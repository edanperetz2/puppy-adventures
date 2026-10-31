-- The game never creates signed-in accounts. Its publishable key uses anon.
revoke execute on function public.puppy_sync_album(text, uuid, jsonb, boolean) from authenticated;
