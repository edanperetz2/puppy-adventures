-- Isolated rollback-only fixture. Never reads or changes a family's rewards.
begin;
do $$
declare
  fixture uuid := gen_random_uuid();
  writer uuid := gen_random_uuid();
  code text := '0123456789ABCDEFGHJKMNPQ';
  saved jsonb; response jsonb; event jsonb;
  at_ms bigint := floor(extract(epoch from clock_timestamp())*1000);
begin
  insert into public.puppy_albums(id,code_hash)
    values(fixture,encode(sha256(convert_to(code,'UTF8')),'hex'));
  select jsonb_object_agg('probe:'||n,jsonb_build_object('domain','hebrew','seen',7,'helped',0,'independent',7,'practice',0,'first',at_ms,'last',at_ms,'success',at_ms,'firstSuccess',at_ms,'days',jsonb_build_array('2026-11-03'),'mode',''))
    into saved from generate_series(1,2048) n;
  insert into public.puppy_learning_state(album_id,items,park)
    values(fixture,saved,jsonb_build_object('0',jsonb_build_object('type','tree','at',at_ms,'nonce','capacity-fixture')));
  event := jsonb_build_array(jsonb_build_object('seq',1,'item','read:expanded-capacity-probe','domain','hebrew','kind','independent','at',at_ms));
  response := public.puppy_sync_learning(code,writer,event,'{}'::jsonb);
  assert (select count(*) from jsonb_object_keys(response->'items'))=2049;
  assert response->'items'->'probe:1'=saved->'probe:1';
  assert response->'park'->'0'->>'type'='tree';
  assert (response->>'ack')::integer=1;
  response := public.puppy_sync_learning(code,writer,event,'{}'::jsonb);
  assert (response->'items'->'read:expanded-capacity-probe'->>'independent')::integer=1;
  select jsonb_object_agg('probe:'||n,saved->'probe:1') into saved from generate_series(1,8192) n;
  update public.puppy_learning_state set items=saved where album_id=fixture;
  begin
    perform public.puppy_sync_learning(code,writer,jsonb_build_array(jsonb_build_object('seq',2,'item','probe:over-limit','domain','hebrew','kind','seen','at',at_ms)),'{}'::jsonb);
    raise exception 'capacity_guard_missing';
  exception when sqlstate '22023' then
    assert sqlerrm='learning_item_limit';
  end;
  assert has_function_privilege('anon','public.puppy_sync_learning(text,uuid,jsonb,jsonb)','execute');
  assert not has_function_privilege('authenticated','public.puppy_sync_learning(text,uuid,jsonb,jsonb)','execute');
end $$;
select 'Expanded history, preserved entries and park, duplicate retry, and upper bound verified' as verification;
rollback;
