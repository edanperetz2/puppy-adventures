# Family albums and abuse protection

This is a small, free family game. It uses a random family code instead of a
child login. Treat that code and invitation links as private: anyone holding a
code can join that album. Each child should have a separate album code.

## Public configuration

The Supabase project URL and `sb_publishable_…` key in `dist/sync-config.js` are
public browser configuration. They are not administrator credentials. No secret
key, service-role key, database password or family code belongs in this repo.

Album and learning tables deny direct browser reads and writes. The two existing
RPCs validate the 120-bit family code, look up its SHA-256 hash, validate bounded
payloads and merge progress. They run with a fixed empty search path. Parent name
recordings, unfinished adventures and drawings remain on their browser/device.

## Server limits

| Action | Allowance | Scope |
| --- | --- | --- |
| Create a genuinely new album | 30 per UTC hour and 100 per UTC day | Entire project |
| Album or learning/park sync | 360 combined requests per UTC minute | Each existing album separately |

The server checks creation limits only for a missing album when creation is
explicitly requested. Joining or refreshing an existing album still works when
the creation quota is exhausted, including an idempotent retry with
`create_album: true`. Rotating codes cannot avoid the global creation quota.
Rotating device or writer IDs cannot avoid an album's sync quota. Another family
has its own sync allowance.

Private database tables hold two reusable creation buckets and one reusable
sync bucket per real album. Their primary keys make concurrent updates atomic;
an old request cannot reset a newer window. Unknown family codes allocate no
rate rows. No IP addresses or request log are collected for these limits. The
tables have RLS enabled, no public policies or grants, and are outside the public
API schema. The internal helper functions also have no browser execution grant.

Throttled calls return HTTP 429 with `Retry-After` and a body fallback for browsers
that cannot read that header. New clients persist the wait, avoid duplicate retry
timers, keep saving progress locally and retry automatically. They preserve
pending completions, stickers, writing counters, clock lessons, observations and
park changes; retrying the same upload does not award them twice. Older clients
retain compatible RPCs and are subject to the same server limits.

These are fixed windows, so a burst can straddle a boundary. The counters bound
accepted album creations and successful sync operations; they do not stop network
traffic, malformed requests that roll back, a determined denial-of-service attack,
or misuse by someone who already has a family code. There is no paid rate-limit
service, CAPTCHA or new login requirement. Revisit stronger perimeter protection
and account-based access if distribution grows substantially.

## Validation and maintenance

- `npm test` covers queued progress, reopening, cross-device merging, rate-limit
  headers/body fallbacks, automatic retry and child isolation.
- `supabase/tests/anti_abuse.sql` checks the real database limits, boundaries,
  window rollover, device/writer rotation, family isolation, legacy achievements
  and private permissions. It rolls back every fixture and quota change.
- Existing SQL regression fixtures also roll back their changes. Never reset a
  real child's progress to test a release.
- The limits live in `supabase/migrations/*_protect_family_sync.sql`. Change them
  through a new reviewed migration, not a client-side setting.
- Inspect aggregate rate buckets through an administrator connection when
  investigating excessive traffic. Do not post family codes or child data in
  public issues.

The character images and educational content are unchanged by this protection.
