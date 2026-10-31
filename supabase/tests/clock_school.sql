begin;
do $test$
declare
  code text := upper(substr(md5(gen_random_uuid()::text),1,24));
  first_device uuid := gen_random_uuid();
  second_device uuid := gen_random_uuid();
  result jsonb;
  old_progress jsonb := '{"missions":{"clock":26},"skills":{"clock":{"correct":156,"assisted":10}}}';
begin
  result := public.puppy_sync_album(code,first_device,old_progress,true);
  assert (result->>'clockLessons')::integer=0, 'Old quizzes must not invent teaching history';
  result := public.puppy_sync_album(code,first_device,old_progress||'{"clockLessons":1}',false);
  assert (result->>'clockLessons')::integer=1;
  assert (result->>'sessions')::integer=26 and (result->>'stars')::integer=156, 'Lessons must not alter existing rewards';
  result := public.puppy_sync_album(code,second_device,'{"clockLessons":2}',false);
  assert (result->>'clockLessons')::integer=3, 'Lessons completed on two devices merge';
  result := public.puppy_sync_album(code,first_device,old_progress,false);
  assert (result->>'clockLessons')::integer=3, 'Old clients cannot erase new lessons';
  result := public.puppy_sync_album(code,first_device,old_progress||'{"clockLessons":4}',false);
  assert (result->>'clockLessons')::integer=7, 'Stale lesson snapshots merge monotonically';
  result := public.puppy_sync_album(code,second_device,'{"clockLessons":2}',false);
  assert (result->>'clockLessons')::integer=7, 'Retries are idempotent';
  result := public.puppy_sync_album(code,first_device,'{"missions":{"clock":27},"skills":{"clock":{"correct":166,"assisted":10}},"clockLessons":1023}',false);
  assert (result->>'clockLessons')::integer=1023;
  assert (result->>'sessions')::integer=27 and (result->>'stars')::integer=166, 'A ten-question game still awards exactly once';
  result := public.puppy_sync_album(code,first_device,old_progress,false);
  assert (result->>'clockLessons')::integer=1023 and (result->>'stars')::integer=166;
  begin
    perform public.puppy_sync_album(code,first_device,'{"clockLessons":1024}',false);
    raise exception 'Accepted out-of-range lesson flag';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.puppy_sync_album(code,first_device,'{"clockLessons":-1}',false);
    raise exception 'Accepted negative lesson flag';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.puppy_sync_album(code,first_device,'{"clockLessons":1.5}',false);
    raise exception 'Accepted fractional lesson flag';
  exception when sqlstate '22023' then null; end;
  assert has_function_privilege('anon','public.puppy_sync_album(text,uuid,jsonb,boolean)','EXECUTE');
  assert not has_function_privilege('authenticated','public.puppy_sync_album(text,uuid,jsonb,boolean)','EXECUTE');
end
$test$;
rollback;
