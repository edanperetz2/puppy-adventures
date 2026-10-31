-- All fixtures are random, and the complete test transaction is rolled back.
begin;
do $test$
declare
  code text := upper(left(replace(gen_random_uuid()::text,'-',''),24));
  first_device uuid := gen_random_uuid();
  second_device uuid := gen_random_uuid();
  result jsonb;
  he_zero jsonb := (select jsonb_agg(0) from generate_series(1,27));
  en_zero jsonb := (select jsonb_agg(0) from generate_series(1,26));
  body jsonb;
  rejected boolean;
begin
  result := public.puppy_sync_album(code,first_device,'{"missions":{"hebrew":26},"clockLessons":35}',true);
  if result #>> '{sessions}' <> '26' or result #>> '{stars}' <> '156'
      or jsonb_array_length(result #> '{letterPractice,hebrew,writingMain}') <> 27
      or jsonb_array_length(result #> '{letterPractice,english,writingMain}') <> 26 then
    raise exception 'old album or new empty arrays changed';
  end if;
  body := jsonb_build_object('missions','{"hebrew":26}'::jsonb,'clockLessons',35,'letterPractice',
    jsonb_build_object('hebrew',jsonb_build_object('writingMain',jsonb_set(he_zero,'{26}','1'),'writing',jsonb_set(he_zero,'{26}','3')),
      'english',jsonb_build_object('writingMain',jsonb_set(en_zero,'{11}','1'))));
  result := public.puppy_sync_album(code,first_device,body,false);
  if result #>> '{letterPractice,hebrew,writingMain,26}' <> '1' or result #>> '{letterPractice,hebrew,writing,26}' <> '3'
      or result #>> '{letterPractice,english,writingMain,11}' <> '1' or result #>> '{letterPractice,english,writing,11}' <> '0'
      or result #>> '{letterPractice,hebrew,recognition,26}' <> '0' or result #>> '{sessions}' <> '26' then
    raise exception 'forms were not saved independently or writing minted an adventure';
  end if;
  result := public.puppy_sync_album(code,first_device,body,false);
  if result #>> '{letterPractice,hebrew,writingMain,26}' <> '1' then raise exception 'duplicate upload counted twice'; end if;
  result := public.puppy_sync_album(code,second_device,jsonb_build_object('letterPractice',
    jsonb_build_object('hebrew',jsonb_build_object('writingMain',jsonb_set(he_zero,'{26}','1')),
      'english',jsonb_build_object('writing',jsonb_set(en_zero,'{11}','1')))),false);
  if result #>> '{letterPractice,hebrew,writingMain,26}' <> '2' or result #>> '{letterPractice,english,writing,11}' <> '1'
      or result #>> '{letterPractice,english,writingMain,11}' <> '1' then raise exception 'device practice did not merge once'; end if;

  -- Older clients omit the new form, and older yet omit all letter practice.
  body := jsonb_build_object('missions','{"hebrew":26}'::jsonb,'letterPractice',
    jsonb_build_object('hebrew',jsonb_build_object('writing',he_zero),'english',jsonb_build_object('writing',en_zero)));
  result := public.puppy_sync_album(code,first_device,body,false);
  result := public.puppy_sync_album(code,first_device,'{"missions":{"hebrew":26}}',false);
  if result #>> '{letterPractice,hebrew,writingMain,26}' <> '2' or result #>> '{letterPractice,hebrew,writing,26}' <> '3'
      or result #>> '{letterPractice,english,writingMain,11}' <> '1' or result #>> '{clockLessons}' <> '35'
      or result #>> '{sessions}' <> '26' or result #>> '{stars}' <> '156' then
    raise exception 'stale client erased newer form, clock lessons or album totals';
  end if;
  result := public.puppy_sync_album(code,second_device,null,false);
  if result #>> '{letterPractice,hebrew,writingMain,26}' <> '2' then raise exception 'read-only sync lost new form'; end if;

  foreach body in array array[
    '{"letterPractice":{"hebrew":{"writingMain":[1]}}}'::jsonb,
    '{"letterPractice":{"english":{"writingMain":{}}}}'::jsonb,
    jsonb_build_object('letterPractice',jsonb_build_object('hebrew',jsonb_build_object('writingMain',jsonb_set(he_zero,'{0}','-1')))),
    jsonb_build_object('letterPractice',jsonb_build_object('hebrew',jsonb_build_object('writingMain',jsonb_set(he_zero,'{0}','1000001'))))
  ] loop
    rejected := false;
    begin perform public.puppy_sync_album(code,first_device,body,false);
    exception when invalid_parameter_value then rejected := true; end;
    if not rejected then raise exception 'malformed new-form counter accepted'; end if;
  end loop;
end;
$test$;
rollback;
select 'Print/capital writing, old-client preservation, independent shared counters and bounds passed; fixtures rolled back.' as result;
