-- Every generated family and device is rolled back, including after a failed assertion.
begin;
do $test$
declare
  code text := upper(left(replace(gen_random_uuid()::text,'-',''),24));
  first_device uuid := gen_random_uuid();
  second_device uuid := gen_random_uuid();
  third_device uuid := gen_random_uuid();
  result jsonb;
  rejected boolean;
begin
  result := public.puppy_sync_album(code,first_device,'{"missions":{"hebrew":26},"skills":{"hebrew":{"assisted":3}}}',true);
  if result->>'sessions' <> '26' or result->>'stars' <> '156' or result #>> '{skills,hebrew,correct}' <> '156' then raise exception 'legacy history changed'; end if;
  result := public.puppy_sync_album(code,first_device,'{"missions":{"hebrew":27},"skills":{"hebrew":{"correct":166,"assisted":13}}}');
  if result->>'sessions' <> '27' or result->>'stars' <> '166' or result #>> '{skills,hebrew,correct}' <> '166' then raise exception 'new round must add ten questions, not revalue old rounds'; end if;
  result := public.puppy_sync_album(code,first_device,'{"missions":{"hebrew":26},"skills":{"hebrew":{"assisted":3}}}');
  if result->>'stars' <> '166' or result->>'sessions' <> '27' then raise exception 'stale legacy upload lost new progress'; end if;
  result := public.puppy_sync_album(code,second_device,'{"missions":{"english":1},"skills":{"english":{"assisted":1}}}');
  if result->>'stars' <> '172' or result->>'sessions' <> '28' then raise exception 'older device contribution must retain six questions'; end if;
  result := public.puppy_sync_album(code,second_device,'{"missions":{"english":2},"skills":{"english":{"correct":16,"assisted":8}}}');
  if result->>'stars' <> '182' or result #>> '{skills,english,correct}' <> '16' then raise exception 'mixed English contribution incorrect'; end if;
  result := public.puppy_sync_album(code,third_device,'{"missions":{"math":10},"skills":{"math":{"correct":100,"assisted":70}}}');
  if result->>'stars' <> '282' or result->>'sessions' <> '39' or result #>> '{skills,math,assisted}' <> '70' then raise exception 'ten-step help count rejected or altered'; end if;
  result := public.puppy_sync_album(code,third_device,'{"missions":{"math":11},"skills":{"math":{"assisted":72}}}');
  if result #>> '{skills,math,correct}' <> '106' then raise exception 'a legacy completion after ten-step play must add six'; end if;
  result := public.puppy_sync_album(code,third_device,'{"missions":{"math":12},"skills":{"math":{"correct":116,"assisted":75}}}');
  if result->>'stars' <> '298' or result->>'sessions' <> '41' or result #>> '{skills,math,correct}' <> '116' then raise exception 'a new completion after legacy play must add ten'; end if;
  result := public.puppy_sync_album(code,third_device,'{"missions":{"math":10},"skills":{"math":{"correct":100,"assisted":70}}}');
  if result->>'stars' <> '298' or result->>'sessions' <> '41' then raise exception 'replay must not duplicate or reduce questions'; end if;
  result := public.puppy_sync_album(code,first_device,null);
  if result->>'stars' <> '298' then raise exception 'reading shared progress changed its totals'; end if;
  rejected := false;
  begin perform public.puppy_sync_album(code,third_device,'{"missions":{"math":12},"skills":{"math":{"correct":121}}}'); exception when sqlstate '22023' then rejected := true; end;
  if not rejected then raise exception 'oversized question totals accepted'; end if;
  rejected := false;
  begin perform public.puppy_sync_album(code,third_device,'{"missions":{"math":12},"skills":{"math":{"correct":116,"assisted":117}}}'); exception when sqlstate '22023' then rejected := true; end;
  if not rejected then raise exception 'assistance greater than answered questions accepted'; end if;
  rejected := false;
  begin perform public.puppy_sync_album(code,third_device,'{"missions":{"math":12},"skills":{"math":{"correct":-1}}}'); exception when sqlstate '22023' then rejected := true; end;
  if not rejected then raise exception 'negative question total accepted'; end if;
  if not has_function_privilege('anon','public.puppy_sync_album(text,uuid,jsonb,boolean)','EXECUTE') then raise exception 'existing anonymous access lost'; end if;
  if has_function_privilege('authenticated','public.puppy_sync_album(text,uuid,jsonb,boolean)','EXECUTE') then raise exception 'execution privileges expanded'; end if;
end;
$test$;
rollback;
