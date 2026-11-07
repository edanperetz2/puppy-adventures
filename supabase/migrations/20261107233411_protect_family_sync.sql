-- Lightweight abuse limits for a small group of families. Existing album codes,
-- counters and RPC signatures remain unchanged, including for older clients.
-- Buckets are reused: two global rows and one row per real album, never per IP,
-- guessed code, request, window, device or writer.
create schema puppy_private;
revoke all on schema puppy_private from public, anon, authenticated, service_role;

create table puppy_private.creation_limits (
  period_seconds integer primary key check (period_seconds in (3600, 86400)),
  window_start timestamptz not null,
  requests integer not null check (requests > 0)
);
create table puppy_private.sync_limits (
  album_id uuid primary key references public.puppy_albums(id) on delete cascade,
  window_start timestamptz not null,
  requests integer not null check (requests > 0)
);
alter table puppy_private.creation_limits enable row level security;
alter table puppy_private.sync_limits enable row level security;
revoke all on all tables in schema puppy_private from public, anon, authenticated, service_role;

create function puppy_private.reject_rate_limit(reason text, wait_seconds integer)
returns void language plpgsql set search_path = '' as $$
begin
  raise sqlstate 'PGRST' using
    message = jsonb_build_object('code', 'PUPPY_RATE_LIMIT', 'message', reason,
      'details', jsonb_build_object('retry_after', wait_seconds)::text)::text,
    detail = jsonb_build_object('status', 429,
      'headers', jsonb_build_object('Retry-After', wait_seconds::text))::text;
end;
$$;

create function puppy_private.check_album_creation()
returns void language plpgsql set search_path = '' as $$
declare
  period integer; allowance integer; accepted integer;
  stamp timestamptz := clock_timestamp();
  starts timestamptz;
begin
  -- All callers acquire these two rows in the same order. The UPSERT condition
  -- enforces each allowance atomically even for concurrent creation requests.
  for period, allowance in select * from (values (3600,30), (86400,100)) as limits(seconds,maximum) loop
    starts := to_timestamp(floor(extract(epoch from stamp)/period)*period);
    insert into puppy_private.creation_limits as bucket(period_seconds,window_start,requests)
      values(period,starts,1)
      on conflict(period_seconds) do update set
        window_start=greatest(bucket.window_start,excluded.window_start),
        requests=case when bucket.window_start>=excluded.window_start then bucket.requests+1 else 1 end
      where bucket.window_start<excluded.window_start or bucket.requests<allowance
      returning requests into accepted;
    if not found then
      select window_start into starts from puppy_private.creation_limits where period_seconds=period;
      perform puppy_private.reject_rate_limit('album_creation_limited',
        greatest(1,ceil(extract(epoch from starts+make_interval(secs=>period)-clock_timestamp()))::integer));
    end if;
  end loop;
end;
$$;

create function puppy_private.check_album_sync(family_id uuid)
returns void language plpgsql set search_path = '' as $$
declare
  stamp timestamptz := date_trunc('minute',clock_timestamp());
  accepted integer;
begin
  -- Both public RPCs use the same family bucket. Rotating devices or writers
  -- cannot bypass it; a missing/guessed album never creates a bucket.
  insert into puppy_private.sync_limits as bucket(album_id,window_start,requests)
    values(family_id,stamp,1)
    on conflict(album_id) do update set
      window_start=greatest(bucket.window_start,excluded.window_start),
      requests=case when bucket.window_start>=excluded.window_start then bucket.requests+1 else 1 end
    where bucket.window_start<excluded.window_start or bucket.requests<360
    returning requests into accepted;
  if not found then
    select window_start into stamp from puppy_private.sync_limits where album_id=family_id;
    perform puppy_private.reject_rate_limit('sync_rate_limited',
      greatest(1,ceil(extract(epoch from stamp+interval '1 minute'-clock_timestamp()))::integer));
  end if;
end;
$$;
revoke all on all functions in schema puppy_private from public, anon, authenticated, service_role;


-- Add separate Hebrew print and English capital writing counters.
-- Keep old handwriting/lowercase and recognition counters, and preserve newer
-- values when an older client uploads a payload without writingMain.
CREATE OR REPLACE FUNCTION public.puppy_sync_album(access_code text, device_key uuid, device_totals jsonb DEFAULT NULL::jsonb, create_album boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  code text;
  album_key uuid;
  previous jsonb;
  normalized jsonb := '{"missions":{},"assisted":{},"questions":{},"letterPractice":{},"clockLessons":0}'::jsonb;
  mission text;
  count_text text;
  help_text text;
  count_value integer;
  help_value integer;
  question_text text;
  question_value integer;
  previous_count integer;
  previous_questions integer;
  total_questions integer := 0;
  clock_lessons_text text;
  family_clock_lessons integer := 0;
  total_count integer := 0;
  family_missions jsonb := '{}'::jsonb;
  family_skills jsonb := '{}'::jsonb;
  family_letters jsonb := '{}'::jsonb;
  language text;
  practice_mode text;
  letter_count integer;
  slot integer;
  start_value integer;
  incoming jsonb;
  counters jsonb;
  stickers jsonb := '["flower","boat","star","dog","butterfly","rocket","rainbow","ball","cat","sun","house","heart"]'::jsonb;
  earned jsonb;
begin
  if access_code is null or octet_length(access_code)>128 then
    raise exception 'invalid_album_code' using errcode='22023';
  end if;
  code := upper(regexp_replace(access_code, '[[:space:]-]', '', 'g'));
  if code is null or code !~ '^[0-9A-HJKMNP-TV-Z]{24}$' or device_key is null then
    raise exception 'invalid_album_code' using errcode = '22023';
  end if;
  if device_totals is not null and (jsonb_typeof(device_totals) <> 'object' or octet_length(device_totals::text) > 4096) then
    raise exception 'invalid_progress' using errcode = '22023';
  end if;
  if device_totals ? 'letterPractice' and jsonb_typeof(device_totals->'letterPractice') <> 'object' then
    raise exception 'invalid_letter_progress' using errcode = '22023';
  end if;

  select id into album_key from public.puppy_albums
    where code_hash = encode(sha256(convert_to(code, 'UTF8')), 'hex');
  if album_key is null then
    if create_album is distinct from true then raise exception 'album_not_found' using errcode = '22023'; end if;
    perform puppy_private.check_album_creation();
    insert into public.puppy_albums(code_hash)
      values (encode(sha256(convert_to(code, 'UTF8')), 'hex'))
      on conflict (code_hash) do update set code_hash = excluded.code_hash
      returning id into album_key;
  end if;

  perform puppy_private.check_album_sync(album_key);
  perform 1 from public.puppy_albums where id = album_key for update;
  select totals into previous from public.puppy_album_devices
    where album_id = album_key and device_id = device_key;
  if previous is null and device_totals is not null and
      (select count(*) from public.puppy_album_devices where album_id = album_key) >= 32 then
    raise exception 'album_device_limit' using errcode = '22023';
  end if;

  if device_totals is not null then
    clock_lessons_text := coalesce(device_totals->>'clockLessons', '0');
    if clock_lessons_text !~ '^[0-9]{1,4}$' then
      raise exception 'invalid_clock_lessons' using errcode = '22023';
    end if;
    if clock_lessons_text::integer > 1023 then
      raise exception 'invalid_clock_lessons' using errcode = '22023';
    end if;
    normalized := jsonb_set(normalized, '{clockLessons}',
      to_jsonb(clock_lessons_text::integer | coalesce((previous->>'clockLessons')::integer, 0)));
    foreach mission in array array['hebrew','english','math','clock','letters'] loop
      count_text := coalesce(device_totals #>> array['missions',mission], '0');
      help_text := coalesce(device_totals #>> array['skills',mission,'assisted'], '0');
      if count_text !~ '^[0-9]{1,7}$' or help_text !~ '^[0-9]{1,8}$' then
        raise exception 'invalid_progress' using errcode = '22023';
      end if;
      previous_count := coalesce((previous #>> array['missions',mission])::integer, 0);
      previous_questions := coalesce((previous #>> array['questions',mission])::integer, previous_count * 6);
      count_value := greatest(count_text::integer, previous_count);
      question_text := device_totals #>> array['skills',mission,'correct'];
      if question_text is null then
        -- An older client adds six answers for each genuinely new completion.
        question_value := previous_questions + greatest(0, count_text::integer - previous_count) * 6;
      else
        if question_text !~ '^[0-9]{1,8}$' then
          raise exception 'invalid_progress' using errcode = '22023';
        end if;
        if question_text::integer < count_text::integer * 6 or question_text::integer > count_text::integer * 10 then
          raise exception 'invalid_progress' using errcode = '22023';
        end if;
        question_value := greatest(question_text::integer, previous_questions + greatest(0, count_text::integer - previous_count) * 6);
      end if;
      help_value := greatest(help_text::integer, coalesce((previous #>> array['assisted',mission])::integer, 0));
      if count_value > 1000000 or question_value > count_value * 10 or help_value > question_value then
        raise exception 'invalid_progress' using errcode = '22023';
      end if;
      normalized := jsonb_set(normalized, array['missions',mission], to_jsonb(count_value));
      normalized := jsonb_set(normalized, array['assisted',mission], to_jsonb(help_value));
      normalized := jsonb_set(normalized, array['questions',mission], to_jsonb(question_value));
    end loop;

    foreach language in array array['hebrew','english'] loop
      letter_count := case when language = 'hebrew' then 27 else 26 end;
      if device_totals->'letterPractice' ? language and jsonb_typeof(device_totals #> array['letterPractice',language]) <> 'object' then
        raise exception 'invalid_letter_progress' using errcode = '22023';
      end if;
      count_text := coalesce(device_totals #>> array['letterPractice',language,'start'], '0');
      if count_text !~ '^[0-9]{1,2}$' or count_text::integer >= letter_count then
        raise exception 'invalid_letter_progress' using errcode = '22023';
      end if;
      start_value := greatest(count_text::integer, coalesce((previous #>> array['letterPractice',language,'start'])::integer, 0));
      -- Legacy rounds did not record individual letters. Change only the order;
      -- never mark letters as practiced from an old subject total.
      if language = 'hebrew' and previous #> '{letterPractice,hebrew}' is null
          and device_totals #> '{letterPractice,hebrew}' is null
          and (normalized #>> '{missions,letters}')::integer > 0 then start_value := 3; end if;
      normalized := jsonb_set(normalized, array['letterPractice',language], jsonb_build_object('start',start_value));
      foreach practice_mode in array array['recognition','writing','writingMain'] loop
        incoming := device_totals #> array['letterPractice',language,practice_mode];
        if incoming is not null then
          if jsonb_typeof(incoming) <> 'array' then raise exception 'invalid_letter_progress' using errcode = '22023'; end if;
          if jsonb_array_length(incoming) <> letter_count then raise exception 'invalid_letter_progress' using errcode = '22023'; end if;
        end if;
        counters := '[]'::jsonb;
        for slot in 0..letter_count-1 loop
          count_text := coalesce(incoming ->> slot, '0');
          if count_text !~ '^[0-9]{1,7}$' then raise exception 'invalid_letter_progress' using errcode = '22023'; end if;
          count_value := greatest(count_text::integer, coalesce((previous #>> array['letterPractice',language,practice_mode,slot::text])::integer,0));
          if count_value > 1000000 then raise exception 'invalid_letter_progress' using errcode = '22023'; end if;
          counters := counters || to_jsonb(count_value);
        end loop;
        normalized := jsonb_set(normalized, array['letterPractice',language,practice_mode], counters);
      end loop;
    end loop;

    insert into public.puppy_album_devices(album_id, device_id, totals)
      values (album_key, device_key, normalized)
      on conflict (album_id, device_id) do update set totals = excluded.totals, updated_at = now()
        where public.puppy_album_devices.totals is distinct from excluded.totals;
  end if;

  foreach mission in array array['hebrew','english','math','clock','letters'] loop
    select coalesce(sum((totals #>> array['missions',mission])::integer), 0),
           coalesce(sum((totals #>> array['assisted',mission])::integer), 0),
           coalesce(sum(coalesce((totals #>> array['questions',mission])::integer, (totals #>> array['missions',mission])::integer * 6)), 0)
      into count_value, help_value, question_value from public.puppy_album_devices where album_id = album_key;
    total_count := total_count + count_value;
    total_questions := total_questions + question_value;
    family_missions := family_missions || jsonb_build_object(mission, count_value);
    family_skills := family_skills || jsonb_build_object(mission, jsonb_build_object('correct', question_value, 'assisted', help_value));
  end loop;
  foreach language in array array['hebrew','english'] loop
    letter_count := case when language = 'hebrew' then 27 else 26 end;
    select coalesce(max(coalesce((totals #>> array['letterPractice',language,'start'])::integer,
      case when language='hebrew' and coalesce((totals #>> '{missions,letters}')::integer,0)>0 then 3 else 0 end)),0)
      into start_value from public.puppy_album_devices where album_id=album_key;
    family_letters := jsonb_set(family_letters,array[language],jsonb_build_object('start',start_value));
    foreach practice_mode in array array['recognition','writing','writingMain'] loop
      select jsonb_agg(total order by position) into counters from (
        select positions.position, coalesce(sum((device.totals #>> array['letterPractice',language,practice_mode,positions.position::text])::integer),0) as total
          from generate_series(0,letter_count-1) as positions(position)
          left join public.puppy_album_devices as device on device.album_id=album_key
          group by positions.position
      ) as combined;
      family_letters := jsonb_set(family_letters,array[language,practice_mode],counters);
    end loop;
  end loop;
  select coalesce(jsonb_agg(value order by ordinality), '[]'::jsonb) into earned
    from jsonb_array_elements(stickers) with ordinality where ordinality <= least(total_count, 12);

  select coalesce(bit_or(coalesce((totals->>'clockLessons')::integer, 0)), 0)
    into family_clock_lessons from public.puppy_album_devices where album_id = album_key;

  return jsonb_build_object('version',1,'sessions',total_count,'stars',total_questions,
    'missions',family_missions,'skills',family_skills,'stickers',earned,'letterPractice',family_letters,'clockLessons',family_clock_lessons);
end;
$function$;

-- Capacity for the expanded curriculum; retain every existing learning item.
create or replace function public.puppy_sync_learning(
  access_code text, writer_key uuid,
  observations jsonb default '[]'::jsonb, park_changes jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  code text;
  album_key uuid; ack bigint; rev bigint; items_value jsonb; park_value jsonb;
  e jsonb; old jsonb; updated jsonb; seq_value bigint; item_key text; kind text;
  at_value bigint; server_ms bigint := floor(extract(epoch from clock_timestamp())*1000);
  day_value text; days_value jsonb; p record; dirty boolean := false;
begin
  if access_code is null or octet_length(access_code)>128 then
    raise exception 'invalid_album_code' using errcode='22023';
  end if;
  code := upper(regexp_replace(access_code, '[[:space:]-]', '', 'g'));
  if code is null or code !~ '^[0-9A-HJKMNP-TV-Z]{24}$' or writer_key is null then
    raise exception 'invalid_album_code' using errcode='22023';
  end if;
  if observations is null or park_changes is null or jsonb_typeof(observations)<>'array'
    or jsonb_array_length(observations)>30 or octet_length(observations::text)>24000
    or jsonb_typeof(park_changes)<>'object' or octet_length(park_changes::text)>8000 then
    raise exception 'invalid_learning_batch' using errcode='22023';
  end if;
  select id into album_key from public.puppy_albums
    where code_hash=encode(sha256(convert_to(code,'UTF8')),'hex');
  if album_key is null then raise exception 'album_not_found' using errcode='22023'; end if;
  -- One short lock per family serializes devices; no network work occurs here.
  perform puppy_private.check_album_sync(album_key);
  perform 1 from public.puppy_albums where id=album_key for update;
  insert into public.puppy_learning_state(album_id) values(album_key) on conflict do nothing;
  if not exists(select 1 from public.puppy_learning_writers where album_id=album_key and writer_id=writer_key)
    and (select count(*) from public.puppy_learning_writers where album_id=album_key)>=128 then
    raise exception 'too_many_learning_devices' using errcode='22023';
  end if;
  insert into public.puppy_learning_writers(album_id,writer_id) values(album_key,writer_key) on conflict do nothing;
  select last_seq into ack from public.puppy_learning_writers where album_id=album_key and writer_id=writer_key;
  select items,park,revision into items_value,park_value,rev from public.puppy_learning_state where album_id=album_key;
  for e in select value from jsonb_array_elements(observations) loop
    if jsonb_typeof(e)<>'object' or coalesce(e->>'seq','') !~ '^[0-9]{1,10}$'
      or coalesce(e->>'item','') !~ '^[a-z0-9:._-]{1,96}$'
      or coalesce(e->>'domain','') not in ('hebrew','english','letters','math','clock')
      or coalesce(e->>'kind','') not in ('seen','independent','helped','practice')
      or coalesce(e->>'at','') !~ '^[0-9]{13}$'
      or coalesce(e->>'mode','') !~ '^[a-z-]{0,20}$' then
      raise exception 'invalid_observation' using errcode='22023';
    end if;
    seq_value := (e->>'seq')::bigint;
    if seq_value<=ack then continue; end if;
    if seq_value<>ack+1 then raise exception 'learning_sequence_gap' using errcode='22023'; end if;
    at_value := (e->>'at')::bigint;
    if at_value<1577836800000 or at_value>server_ms+300000 then
      raise exception 'invalid_observation_time' using errcode='22023';
    end if;
    item_key:=e->>'item'; kind:=e->>'kind'; old:=items_value->item_key;
    if old is null and (select count(*) from jsonb_object_keys(items_value))>=8192 then
      raise exception 'learning_item_limit' using errcode='22023';
    end if;
    old:=coalesce(old,'{"seen":0,"independent":0,"helped":0,"practice":0,"first":0,"last":0,"success":0,"firstSuccess":0,"days":[],"mode":""}'::jsonb);
    updated:=old || jsonb_build_object('domain',e->>'domain','seen',least(1000000,(old->>'seen')::integer+case when kind in ('seen','practice') or (old->>'seen')::integer=0 then 1 else 0 end),kind,least(1000000,(old->>kind)::integer+1),
      'first',case when (old->>'first')::bigint=0 then at_value else least((old->>'first')::bigint,at_value) end,
      'last',greatest((old->>'last')::bigint,at_value),'mode',coalesce(e->>'mode',''));
    if kind='independent' then
      day_value:=to_char(to_timestamp(at_value/1000.0) at time zone 'UTC','YYYY-MM-DD');
      select coalesce(jsonb_agg(d order by d),'[]'::jsonb) into days_value from
        (select distinct value #>> '{}' as d from jsonb_array_elements((old->'days')||to_jsonb(day_value)) order by d desc limit 8) days;
      updated:=updated||jsonb_build_object('days',days_value,'success',greatest((old->>'success')::bigint,at_value),
        'firstSuccess',case when (old->>'firstSuccess')::bigint=0 then at_value else least((old->>'firstSuccess')::bigint,at_value) end);
    end if;
    items_value:=jsonb_set(items_value,array[item_key],updated,true);ack:=seq_value;dirty:=true;
  end loop;
  for p in select key,value from jsonb_each(park_changes) loop
    if p.key !~ '^([0-9]|[12][0-9]|3[0-9])$' or jsonb_typeof(p.value)<>'object'
      or coalesce(p.value->>'type','?') not in ('','tree','flower','bench','ball','pond','house','flag','slide','picnic','rainbow','rocket','sign')
      or coalesce(p.value->>'at','') !~ '^[0-9]{13}$' or coalesce(p.value->>'nonce','') !~ '^[a-z0-9-]{1,64}$' then
      raise exception 'invalid_park_change' using errcode='22023';
    end if;
    at_value:=(p.value->>'at')::bigint;
    if at_value<1577836800000 or at_value>server_ms+300000 then raise exception 'invalid_park_time' using errcode='22023'; end if;
    old:=park_value->p.key;
    if old is null or at_value>(old->>'at')::bigint or (at_value=(old->>'at')::bigint and p.value->>'nonce'>old->>'nonce') then
      park_value:=jsonb_set(park_value,array[p.key],jsonb_build_object('type',p.value->>'type','at',at_value,'nonce',p.value->>'nonce'),true);dirty:=true;
    end if;
  end loop;
  if dirty then
    rev:=rev+1;
    update public.puppy_learning_state set items=items_value,park=park_value,revision=rev,updated_at=now() where album_id=album_key;
    update public.puppy_learning_writers set last_seq=ack where album_id=album_key and writer_id=writer_key;
  end if;
  return jsonb_build_object('version',1,'ack',ack,'revision',rev,'items',items_value,'park',park_value);
end;
$$;
revoke all on function public.puppy_sync_learning(text,uuid,jsonb,jsonb) from public, authenticated;
grant execute on function public.puppy_sync_learning(text,uuid,jsonb,jsonb) to anon;
