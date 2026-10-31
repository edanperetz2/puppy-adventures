-- Run as a database administrator. The test creates only temporary test data.
begin;
do $test$
declare
  code text := upper(left(replace(gen_random_uuid()::text, '-', ''),24));
  first_device uuid := gen_random_uuid();
  second_device uuid := gen_random_uuid();
  result jsonb;
begin
  result := public.puppy_sync_album(code, first_device,
    '{"missions":{"letters":1,"clock":1},"skills":{"letters":{"assisted":2},"clock":{"assisted":1}}}', true);
  if result #>> '{missions,letters}' <> '1' or result ->> 'sessions' <> '2' then
    raise exception 'initial letter progress failed';
  end if;
  result := public.puppy_sync_album(code, second_device,
    '{"missions":{"letters":1},"skills":{"letters":{"assisted":1}}}', false);
  if result #>> '{missions,letters}' <> '2' or result #>> '{skills,letters,assisted}' <> '3' then
    raise exception 'cross-device letters failed';
  end if;
  -- An older client does not know the letters field. Its upload must preserve it.
  result := public.puppy_sync_album(code, first_device,
    '{"missions":{"hebrew":1,"clock":1},"skills":{"hebrew":{"assisted":0},"clock":{"assisted":1}}}', false);
  if result #>> '{missions,letters}' <> '2' or result #>> '{missions,clock}' <> '1'
      or result ->> 'sessions' <> '4' or jsonb_array_length(result -> 'stickers') <> 4 then
    raise exception 'older client overwrote letter progress';
  end if;
  result := public.puppy_sync_album(code, second_device,
    '{"missions":{"letters":1},"skills":{"letters":{"assisted":1}}}', false);
  if result ->> 'sessions' <> '4' then raise exception 'duplicate upload changed rewards'; end if;
  if not has_function_privilege('anon','public.puppy_sync_album(text,uuid,jsonb,boolean)','execute') then
    raise exception 'client execute grant lost';
  end if;
end;
$test$;
rollback;
