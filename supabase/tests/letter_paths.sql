-- Transactional regression test. All generated albums disappear on rollback.
begin;
do $test$
declare
  code text := upper(left(replace(gen_random_uuid()::text,'-',''),24));
  first_device uuid := gen_random_uuid();
  second_device uuid := gen_random_uuid();
  third_device uuid := gen_random_uuid();
  result jsonb;
  he_zero jsonb := (select jsonb_agg(0) from generate_series(1,27));
  en_zero jsonb := (select jsonb_agg(0) from generate_series(1,26));
  he_read jsonb;
  en_read jsonb;
  he_write jsonb;
  body jsonb;
  rejected boolean;
begin
  result := public.puppy_sync_album(code,first_device,'{"missions":{"letters":7},"skills":{"letters":{"assisted":2}}}',true);
  if result #>> '{letterPractice,hebrew,start}' <> '3' or result #>> '{letterPractice,hebrew,recognition,0}' <> '0' then
    raise exception 'legacy order must move on without inventing practiced letters';
  end if;
  he_read := jsonb_set(jsonb_set(jsonb_set(he_zero,'{3}','1'),'{4}','1'),'{5}','1');
  body := jsonb_build_object('missions','{"letters":8}'::jsonb,'skills','{"letters":{"assisted":3}}'::jsonb,
    'letterPractice',jsonb_build_object('hebrew',jsonb_build_object('start',3,'recognition',he_read,'writing',he_zero)));
  result := public.puppy_sync_album(code,first_device,body,false);
  if result #>> '{sessions}' <> '8' or result #>> '{letterPractice,hebrew,recognition,3}' <> '1' then
    raise exception 'recognition completion not stored';
  end if;

  en_read := jsonb_set(jsonb_set(jsonb_set(en_zero,'{0}','1'),'{1}','1'),'{2}','1');
  he_write := jsonb_set(he_zero,'{5}','1');
  body := jsonb_build_object('missions','{"letters":1}'::jsonb,'skills','{"letters":{"assisted":0}}'::jsonb,
    'letterPractice',jsonb_build_object('hebrew',jsonb_build_object('writing',he_write),
      'english',jsonb_build_object('recognition',en_read,'writing',en_zero)));
  result := public.puppy_sync_album(code,second_device,body,false);
  if result #>> '{sessions}' <> '9' or result #>> '{letterPractice,english,recognition,2}' <> '1'
      or result #>> '{letterPractice,hebrew,writing,5}' <> '1' or result #>> '{letterPractice,hebrew,recognition,3}' <> '1' then
    raise exception 'language or mode progress lost across devices';
  end if;
  result := public.puppy_sync_album(code,second_device,body,false);
  if result #>> '{sessions}' <> '9' or result #>> '{letterPractice,hebrew,writing,5}' <> '1' then
    raise exception 'repeated upload duplicated practice';
  end if;

  -- A stale old client knows neither the per-letter fields nor the new modes.
  result := public.puppy_sync_album(code,first_device,'{"missions":{"letters":7},"skills":{"letters":{"assisted":2}}}',false);
  if result #>> '{sessions}' <> '9' or result #>> '{letterPractice,hebrew,recognition,3}' <> '1'
      or result #>> '{letterPractice,english,recognition,2}' <> '1' or result #>> '{skills,letters,assisted}' <> '3' then
    raise exception 'old client overwrote new or previous progress';
  end if;

  -- Writing-only updates never mint completed adventures or stickers.
  body := jsonb_build_object('missions','{"letters":1}'::jsonb,'letterPractice',
    jsonb_build_object('hebrew',jsonb_build_object('writing',jsonb_set(he_zero,'{5}','1'))));
  result := public.puppy_sync_album(code,third_device,body,false);
  if result #>> '{letterPractice,hebrew,writing,5}' <> '2' or result #>> '{sessions}' <> '10' then
    raise exception 'per-device practice must add once';
  end if;
  body := jsonb_set(body,'{letterPractice,hebrew,writing,0}','1');
  result := public.puppy_sync_album(code,third_device,body,false);
  if result #>> '{sessions}' <> '10' or result #>> '{letterPractice,hebrew,writing,0}' <> '1' then
    raise exception 'writing-only update changed completed adventure total';
  end if;
  result := public.puppy_sync_album(code,first_device,null,false);
  if jsonb_array_length(result #> '{letterPractice,hebrew,recognition}') <> 27
      or jsonb_array_length(result #> '{letterPractice,english,writing}') <> 26 then
    raise exception 'response arrays have wrong lengths';
  end if;

  rejected := false;
  begin
    perform public.puppy_sync_album(code,first_device,'{"letterPractice":{"hebrew":{"writing":[1]}}}',false);
  exception when invalid_parameter_value then rejected := true;
  end;
  if not rejected then raise exception 'wrong array length accepted'; end if;
  rejected := false;
  begin
    perform public.puppy_sync_album(code,first_device,jsonb_build_object('letterPractice',
      jsonb_build_object('hebrew',jsonb_build_object('writing',jsonb_set(he_zero,'{0}','-1')))),false);
  exception when invalid_parameter_value then rejected := true;
  end;
  if not rejected then raise exception 'negative practice counter accepted'; end if;
  rejected := false;
  begin
    perform public.puppy_sync_album(code,first_device,jsonb_build_object('letterPractice',
      jsonb_build_object('hebrew',jsonb_build_object('writing',jsonb_set(he_zero,'{0}','1000001')))),false);
  exception when invalid_parameter_value then rejected := true;
  end;
  if not rejected then raise exception 'unbounded practice counter accepted'; end if;
  rejected := false;
  begin
    perform public.puppy_sync_album(code,first_device,'{"letterPractice":{"hebrew":{"writing":{}}}}',false);
  exception when invalid_parameter_value then rejected := true;
  end;
  if not rejected then raise exception 'non-array practice accepted'; end if;
  if not has_function_privilege('anon','public.puppy_sync_album(text,uuid,jsonb,boolean)','execute') then
    raise exception 'client execution grant changed';
  end if;
  if exists(select 1 from pg_class where oid in ('public.puppy_albums'::regclass,'public.puppy_album_devices'::regclass) and not relrowsecurity) then
    raise exception 'row-level security was disabled';
  end if;
end;
$test$;
rollback;
select 'Letter paths, old-client compatibility, bounds and shared counters passed; all test data rolled back.' as result;
