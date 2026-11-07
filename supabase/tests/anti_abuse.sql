-- Run against the migrated database. Every fixture, quota change and write is
-- rolled back; no real family code or child data is selected or changed.
begin;
do $test$
declare
  code_a text := upper(left(replace(gen_random_uuid()::text,'-',''),24));
  code_b text := upper(left(replace(gen_random_uuid()::text,'-',''),24));
  code_c text := upper(left(replace(gen_random_uuid()::text,'-',''),24));
  code_d text := upper(left(replace(gen_random_uuid()::text,'-',''),24));
  device_a uuid := gen_random_uuid(); writer_a uuid := gen_random_uuid();
  family_a uuid; family_b uuid; result jsonb; event jsonb;
  message_text text; detail_text text; before_writers integer; before_devices integer; before_buckets integer;
  role_name text; function_name text; table_name text;
  print_progress jsonb := (select jsonb_agg(case when n=0 then 3 else 0 end order by n) from generate_series(0,26) n);
  legacy jsonb;
begin
  -- Isolate creation quotas for this transaction only, even if run near a real
  -- window boundary. This also checks that an older timestamp cannot reset a bucket.
  insert into puppy_private.creation_limits(period_seconds,window_start,requests)
    values (3600,date_trunc('hour',clock_timestamp())+interval '1 hour',1),
           (86400,(date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC')+interval '1 day',1)
    on conflict(period_seconds) do update set window_start=excluded.window_start,requests=excluded.requests;
  legacy := jsonb_build_object('missions','{"hebrew":26}'::jsonb,'clockLessons',35,
    'letterPractice',jsonb_build_object('hebrew',jsonb_build_object('writingMain',print_progress)));
  result := public.puppy_sync_album(code_a,device_a,legacy,true);
  if result->>'sessions'<>'26' or result->>'stars'<>'156' then raise exception 'legacy album changed'; end if;
  perform public.puppy_sync_album(code_b,gen_random_uuid(),'{}',true);
  select id into family_a from public.puppy_albums where code_hash=encode(sha256(convert_to(code_a,'UTF8')),'hex');
  select id into family_b from public.puppy_albums where code_hash=encode(sha256(convert_to(code_b,'UTF8')),'hex');
  event := jsonb_build_array(jsonb_build_object('seq',1,'item','read:dog','domain','hebrew','kind','independent',
    'at',floor(extract(epoch from clock_timestamp())*1000),'mode',''));
  result := public.puppy_sync_learning(code_a,writer_a,event,
    jsonb_build_object('4',jsonb_build_object('type','tree','at',floor(extract(epoch from clock_timestamp())*1000),'nonce','fixture')));
  if result->>'ack'<>'1' then raise exception 'learning baseline failed'; end if;

  select count(*) into before_devices from public.puppy_album_devices where album_id=family_a;
  select count(*) into before_writers from public.puppy_learning_writers where album_id=family_a;
  update puppy_private.sync_limits set window_start=date_trunc('minute',clock_timestamp())+interval '1 minute',requests=359 where album_id=family_a;
  perform public.puppy_sync_album(code_a,device_a,null,false); -- Exactly the last allowed call.
  if (select requests from puppy_private.sync_limits where album_id=family_a)<>360 then raise exception 'sync boundary failed'; end if;
  begin
    perform public.puppy_sync_learning(code_a,gen_random_uuid(),'[]','{}');
    raise exception 'writer rotation bypassed sync quota';
  exception when sqlstate 'PGRST' then
    get stacked diagnostics message_text=message_text,detail_text=pg_exception_detail;
    if message_text::jsonb->>'message'<>'sync_rate_limited' or (detail_text::jsonb->>'status')::integer<>429
      or (detail_text::jsonb #>> '{headers,Retry-After}')::integer not between 1 and 120 then raise exception 'invalid learning rate response'; end if;
  end;
  begin
    perform public.puppy_sync_album(code_a,gen_random_uuid(),'{}',true);
    raise exception 'device rotation or create flag bypassed sync quota';
  exception when sqlstate 'PGRST' then
    get stacked diagnostics message_text=message_text;
    if message_text::jsonb->>'message'<>'sync_rate_limited' then raise exception 'invalid album rate response'; end if;
  end;
  if (select count(*) from public.puppy_album_devices where album_id=family_a)<>before_devices
    or (select count(*) from public.puppy_learning_writers where album_id=family_a)<>before_writers then raise exception 'throttled requests wrote devices'; end if;
  perform public.puppy_sync_album(code_b,gen_random_uuid(),null,false);
  perform public.puppy_sync_learning(code_b,gen_random_uuid(),'[]','{}'); -- Another family remains available.

  -- A new minute resumes both protocols. Retried observations count once.
  update puppy_private.sync_limits set window_start=date_trunc('minute',clock_timestamp())-interval '1 minute',requests=360 where album_id=family_a;
  event := jsonb_set(event,'{0,seq}','2');
  result := public.puppy_sync_learning(code_a,writer_a,event,'{}');
  result := public.puppy_sync_learning(code_a,writer_a,event,'{}');
  if result->>'ack'<>'2' or result #>> '{items,read:dog,independent}'<>'2' or result #>> '{park,4,type}'<>'tree' then raise exception 'retry lost or duplicated learning or park'; end if;
  result := public.puppy_sync_album(code_a,device_a,legacy,false);
  if result->>'sessions'<>'26' or result->>'stars'<>'156' or result->>'clockLessons'<>'35'
    or result #>> '{letterPractice,hebrew,writingMain,0}'<>'3' then raise exception 'throttle lost established progress'; end if;

  update puppy_private.creation_limits set requests=29 where period_seconds=3600;
  perform public.puppy_sync_album(code_c,gen_random_uuid(),'{}',true); -- Last hourly creation.
  begin
    perform public.puppy_sync_album(code_d,gen_random_uuid(),'{}',true);
    raise exception 'new random code bypassed hourly creation quota';
  exception when sqlstate 'PGRST' then
    get stacked diagnostics message_text=message_text,detail_text=pg_exception_detail;
    if message_text::jsonb->>'message'<>'album_creation_limited' or detail_text::jsonb->>'status'<>'429'
      or (message_text::jsonb->>'details')::jsonb->>'retry_after' is null then raise exception 'invalid creation response'; end if;
  end;
  if exists(select 1 from public.puppy_albums where code_hash=encode(sha256(convert_to(code_d,'UTF8')),'hex')) then raise exception 'blocked album was created'; end if;
  perform public.puppy_sync_album(code_c,gen_random_uuid(),'{}',true); -- Idempotent create/join still succeeds.
  perform public.puppy_sync_album(code_b,gen_random_uuid(),null,false);
  perform public.puppy_sync_learning(code_b,gen_random_uuid(),'[]','{}');

  update puppy_private.creation_limits set requests=case when period_seconds=3600 then 1 else 100 end;
  begin
    perform public.puppy_sync_album(code_d,gen_random_uuid(),'{}',true);
    raise exception 'hourly allowance bypassed daily creation quota';
  exception when sqlstate 'PGRST' then null;
  end;
  if (select requests from puppy_private.creation_limits where period_seconds=3600)<>1 then raise exception 'rejection consumed another creation budget'; end if;

  -- Missing codes cannot create rate rows; null is not permission to create.
  select count(*) into before_buckets from puppy_private.sync_limits;
  begin
    perform public.puppy_sync_learning(code_d,gen_random_uuid(),'[]','{}');
    raise exception 'missing family accepted';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.puppy_sync_album(code_d,gen_random_uuid(),'{}',null);
    raise exception 'null create flag accepted';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.puppy_sync_album(repeat('A',129),gen_random_uuid(),null,false);
    raise exception 'oversized code accepted';
  exception when sqlstate '22023' then null;
  end;
  if (select count(*) from puppy_private.sync_limits)<>before_buckets then raise exception 'guessed code grew rate storage'; end if;
  -- Both periods can roll over without retaining a historical row per window.
  update puppy_private.creation_limits set window_start='2020-01-01',requests=100;
  perform public.puppy_sync_album(code_d,gen_random_uuid(),'{}',true);
  if exists(select 1 from puppy_private.creation_limits where requests<>1) then raise exception 'creation windows did not reset'; end if;

  foreach role_name in array array['anon','authenticated','service_role'] loop
    if has_schema_privilege(role_name,'puppy_private','USAGE') then raise exception 'private schema exposed to %',role_name; end if;
    foreach table_name in array array['creation_limits','sync_limits'] loop
      if has_table_privilege(role_name,'puppy_private.'||table_name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then raise exception 'rate table exposed'; end if;
    end loop;
    foreach function_name in array array['reject_rate_limit(text,integer)','check_album_creation()','check_album_sync(uuid)'] loop
      if has_function_privilege(role_name,'puppy_private.'||function_name,'EXECUTE') then raise exception 'rate helper exposed'; end if;
    end loop;
  end loop;
end;
$test$;
rollback;
select 'Creation and shared sync quotas, window rollover, independent families, legacy progress, learning, park and private permissions passed; all fixtures rolled back.' as result;
