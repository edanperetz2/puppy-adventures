-- Merge ten completed clock lessons as a bounded bit set.
-- Missing fields from older clients never erase completed lessons.
-- Preserve the existing code check, grants, question counters and row lock.
CREATE OR REPLACE FUNCTION public.puppy_sync_album(access_code text, device_key uuid, device_totals jsonb DEFAULT NULL::jsonb, create_album boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  code text := upper(regexp_replace(access_code, '[[:space:]-]', '', 'g'));
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
    if not create_album then raise exception 'album_not_found' using errcode = '22023'; end if;
    insert into public.puppy_albums(code_hash)
      values (encode(sha256(convert_to(code, 'UTF8')), 'hex'))
      on conflict (code_hash) do update set code_hash = excluded.code_hash
      returning id into album_key;
  end if;

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
      foreach practice_mode in array array['recognition','writing'] loop
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
    foreach practice_mode in array array['recognition','writing'] loop
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
