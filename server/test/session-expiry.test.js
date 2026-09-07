// A session's lifetime is configurable so expiry can be observed over HTTP rather than by
// reaching into the sessions table. It runs in its own file because the app reads the setting
// once, at load.
process.env.SESSION_TTL_MS = '1000';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { setTimeout: delay } = require('node:timers/promises');
const { startTestServer } = require('./helpers/testServer');

let harness;

before(async () => {
  harness = await startTestServer();
});

after(async () => {
  await harness.stop();
});

test('an expired session is rejected', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'expiring@example.com', password: 'password123' });

  const whileValid = await client.get('/auth/me');
  assert.equal(whileValid.status, 200);

  await delay(1200);

  const afterExpiry = await client.get('/auth/me');
  assert.equal(afterExpiry.status, 401);
  assert.match(afterExpiry.body.error, /auth/i);
});
