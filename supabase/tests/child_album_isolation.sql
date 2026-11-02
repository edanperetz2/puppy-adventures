-- Each child uses an independent existing family capability. Names and local
-- voice recordings are not sent to this RPC. Fixtures are always rolled back.
begin;
do $test$
declare
  code_a text := upper(left(replace(gen_random_uuid()::text,'-',''),24));
  code_b text := upper(left(replace(gen_random_uuid()::text,'-',''),24));
  device_a uuid := gen_random_uuid();
  device_b uuid := gen_random_uuid();
  result jsonb;
  print_progress jsonb := (select jsonb_agg(case when n=0 then 3 else 0 end order by n) from generate_series(0,26) n);
  legacy jsonb;
  fresh jsonb := '{"missions":{"hebrew":0,"letters":0,"english":0,"math":0,"clock":0},"skills":{"hebrew":{"correct":0,"assisted":0},"letters":{"correct":0,"assisted":0},"english":{"correct":0,"assisted":0},"math":{"correct":0,"assisted":0},"clock":{"correct":0,"assisted":0}}}'::jsonb;
begin
  legacy := jsonb_build_object('missions','{"hebrew":26,"letters":0,"english":0,"math":0,"clock":0}'::jsonb,
    'skills','{"hebrew":{"correct":156,"assisted":0},"letters":{"correct":0,"assisted":0},"english":{"correct":0,"assisted":0},"math":{"correct":0,"assisted":0},"clock":{"correct":0,"assisted":0}}'::jsonb,
    'clockLessons',35,'letterPractice',jsonb_build_object('hebrew',jsonb_build_object('writingMain',print_progress)));
  perform public.puppy_sync_album(code_a,device_a,legacy,true);
  result := public.puppy_sync_album(code_b,device_b,fresh,true);
  if result->>'sessions' <> '0' or result->>'clockLessons' <> '0' then raise exception 'new child inherited another album'; end if;
  fresh := jsonb_set(jsonb_set(fresh,'{missions,math}','1'),'{skills,math,correct}','10');
  result := public.puppy_sync_album(code_b,device_b,fresh,false);
  result := public.puppy_sync_album(code_b,device_b,fresh,false);
  if result->>'sessions' <> '1' or result->>'stars' <> '10' then raise exception 'new child reward was lost or duplicated'; end if;
  result := public.puppy_sync_album(code_a,gen_random_uuid(),null,false);
  if result->>'sessions' <> '26' or result->>'stars' <> '156'
      or result->>'clockLessons' <> '35'
      or result #>> '{letterPractice,hebrew,writingMain,0}' <> '3' then
    raise exception 'another child changed the original album';
  end if;
  result := public.puppy_sync_album(code_b,gen_random_uuid(),null,false);
  if result->>'sessions' <> '1' or result #>> '{missions,hebrew}' <> '0' then raise exception 'paired device opened the wrong album'; end if;
end;
$test$;
rollback;
select 'Independent child albums, 26-sticker preservation, repeated uploads and paired devices passed; fixtures rolled back.' as result;
