-- The character game submits the established Hebrew subject counter.
-- Verify its actual compact payload without changing the RPC or any real album.
begin;
do $test$
declare
  code text := upper(left(replace(gen_random_uuid()::text,'-',''),24));
  device uuid := gen_random_uuid();
  other_device uuid := gen_random_uuid();
  result jsonb;
  print_progress jsonb := (select jsonb_agg(case when n=5 then 2 else 0 end order by n) from generate_series(0,26) n);
  payload jsonb;
begin
  payload := jsonb_build_object('missions','{"hebrew":26,"letters":0,"english":0,"math":0,"clock":0}'::jsonb,
    'skills','{"hebrew":{"correct":156,"assisted":0},"letters":{"correct":0,"assisted":0},"english":{"correct":0,"assisted":0},"math":{"correct":0,"assisted":0},"clock":{"correct":0,"assisted":0}}'::jsonb,
    'clockLessons',35,'letterPractice',jsonb_build_object('hebrew',jsonb_build_object('writingMain',print_progress)));
  result := public.puppy_sync_album(code,device,payload,true);
  payload := jsonb_set(jsonb_set(jsonb_set(payload,'{missions,hebrew}','27'),'{skills,hebrew,correct}','166'),'{skills,hebrew,assisted}','2');
  result := public.puppy_sync_album(code,device,payload,false);
  result := public.puppy_sync_album(code,device,payload,false);
  if result->>'sessions' <> '27' or result->>'stars' <> '166'
      or result #>> '{skills,hebrew,assisted}' <> '2' then
    raise exception 'character reading did not add one adventure and ten answers exactly once';
  end if;
  result := public.puppy_sync_album(code,other_device,null,false);
  if result->>'sessions' <> '27' or result->>'stars' <> '166' then
    raise exception 'paired device did not see the earned reward total';
  end if;
  -- An old installed game can retry a previous save without losing the reward.
  result := public.puppy_sync_album(code,device,'{"missions":{"hebrew":26}}',false);
  if result->>'sessions' <> '27' or result->>'stars' <> '166'
      or result->>'clockLessons' <> '35'
      or result #>> '{letterPractice,hebrew,writingMain,5}' <> '2' then
    raise exception 'an older upload changed rewards, clock lessons or capital/print practice';
  end if;
end;
$test$;
rollback;
select 'Character reading rewards, repeated uploads, paired devices and old saves passed; test data rolled back.' as result;
