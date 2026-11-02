-- Record encounters separately from support and independent answers.
create or replace function public.puppy_sync_learning(
  access_code text, writer_key uuid,
  observations jsonb default '[]'::jsonb, park_changes jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  code text := upper(regexp_replace(access_code, '[[:space:]-]', '', 'g'));
  album_key uuid; ack bigint; rev bigint; items_value jsonb; park_value jsonb;
  e jsonb; old jsonb; updated jsonb; seq_value bigint; item_key text; kind text;
  at_value bigint; server_ms bigint := floor(extract(epoch from clock_timestamp())*1000);
  day_value text; days_value jsonb; p record; dirty boolean := false;
begin
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
    if old is null and (select count(*) from jsonb_object_keys(items_value))>=2048 then
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
