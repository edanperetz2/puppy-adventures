import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimitError } from '../dist/sync-retry.js';

test('Rate limits respect seconds, HTTP dates and the body fallback used when CORS hides Retry-After', () => {
  const now = Date.UTC(2026, 10, 8, 10);
  const response = value => ({ status: 429, headers: new Headers(value ? { 'Retry-After': value } : {}) });
  assert.equal(rateLimitError(response('120'), {}, now).retryAfterMs, 120000);
  assert.equal(rateLimitError(response(new Date(now + 90000).toUTCString()), {}, now).retryAfterMs, 90000);
  assert.equal(rateLimitError(response(), { details: '{"retry_after":42}' }, now).retryAfterMs, 42000);
  assert.equal(rateLimitError(response(), { details: { retry_after: 21 } }, now).retryAfterMs, 21000);
  assert.equal(rateLimitError(response('bad'), { details: 'bad' }, now).retryAfterMs, 60000);
  assert.equal(rateLimitError(response('999999999'), null, now).retryAfterMs, 86400000);
  assert.equal(rateLimitError({ status: 503 }, {}, now), null);
});
