-- Family codes are random 120-bit capabilities. Only their SHA-256 hashes are
-- stored. Direct table access is denied; the RPC checks the code on every call.
create table public.puppy_albums (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  created_at timestamptz not null default now()
);

create table public.puppy_album_devices (
  album_id uuid not null references public.puppy_albums(id) on delete cascade,
  device_id uuid not null,
  totals jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (album_id, device_id)
);

alter table public.puppy_albums enable row level security;
alter table public.puppy_album_devices enable row level security;
revoke all on public.puppy_albums, public.puppy_album_devices from anon, authenticated;

create function public.puppy_sync_album(
  access_code text,
  device_key uuid,
  device_totals jsonb default null,
  create_album boolean default false
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  code text := upper(regexp_replace(access_code, '[[:space:]-]', '', 'g'));
  album_key uuid;
  previous jsonb;
  normalized jsonb := '{"missions":{},"assisted":{}}'::jsonb;
  mission text;
  count_text text;
  help_text text;
  count_value integer;
  help_value integer;
  total_count integer := 0;
  family_missions jsonb := '{}'::jsonb;
  family_skills jsonb := '{}'::jsonb;
  stickers jsonb := '["flower","boat","star","dog","butterfly","rocket","rainbow","ball","cat","sun","house","heart"]'::jsonb;
  earned jsonb;
begin
  if code is null or code !~ '^[0-9A-HJKMNP-TV-Z]{24}$' or device_key is null then
    raise exception 'invalid_album_code' using errcode = '22023';
  end if;
  if device_totals is not null and (jsonb_typeof(device_totals) <> 'object' or octet_length(device_totals::text) > 4096) then
    raise exception 'invalid_progress' using errcode = '22023';
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

  -- Serialize device updates within one album, preventing lost concurrent joins.
  perform 1 from public.puppy_albums where id = album_key for update;
  select totals into previous from public.puppy_album_devices
    where album_id = album_key and device_id = device_key;
  if previous is null and device_totals is not null and
      (select count(*) from public.puppy_album_devices where album_id = album_key) >= 32 then
    raise exception 'album_device_limit' using errcode = '22023';
  end if;

  if device_totals is not null then
    foreach mission in array array['hebrew','english','math'] loop
      count_text := coalesce(device_totals #>> array['missions',mission], '0');
      help_text := coalesce(device_totals #>> array['skills',mission,'assisted'], '0');
      if count_text !~ '^[0-9]{1,7}$' or help_text !~ '^[0-9]{1,8}$' then
        raise exception 'invalid_progress' using errcode = '22023';
      end if;
      count_value := greatest(count_text::integer, coalesce((previous #>> array['missions',mission])::integer, 0));
      help_value := greatest(help_text::integer, coalesce((previous #>> array['assisted',mission])::integer, 0));
      if count_value > 1000000 or help_value > count_value * 6 then
        raise exception 'invalid_progress' using errcode = '22023';
      end if;
      normalized := jsonb_set(normalized, array['missions',mission], to_jsonb(count_value));
      normalized := jsonb_set(normalized, array['assisted',mission], to_jsonb(help_value));
    end loop;
    insert into public.puppy_album_devices(album_id, device_id, totals)
      values (album_key, device_key, normalized)
      on conflict (album_id, device_id) do update set totals = excluded.totals, updated_at = now()
        where public.puppy_album_devices.totals is distinct from excluded.totals;
  end if;

  foreach mission in array array['hebrew','english','math'] loop
    select coalesce(sum((totals #>> array['missions',mission])::integer), 0),
           coalesce(sum((totals #>> array['assisted',mission])::integer), 0)
      into count_value, help_value from public.puppy_album_devices where album_id = album_key;
    total_count := total_count + count_value;
    family_missions := family_missions || jsonb_build_object(mission, count_value);
    family_skills := family_skills || jsonb_build_object(mission, jsonb_build_object('correct', count_value * 6, 'assisted', help_value));
  end loop;
  select coalesce(jsonb_agg(value order by ordinality), '[]'::jsonb) into earned
    from jsonb_array_elements(stickers) with ordinality where ordinality <= least(total_count, 12);

  return jsonb_build_object('version',1,'sessions',total_count,'stars',total_count*6,
    'missions',family_missions,'skills',family_skills,'stickers',earned);
end;
$$;

revoke all on function public.puppy_sync_album(text, uuid, jsonb, boolean) from public;
grant execute on function public.puppy_sync_album(text, uuid, jsonb, boolean) to anon, authenticated;
