const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./helpers/testServer');

const PASSWORD = 'password123';

let harness;

before(async () => {
  harness = await startTestServer();
});

after(async () => {
  await harness.stop();
});

function sessionCookie(setCookie) {
  return setCookie.find((header) => header.startsWith('pp_session='));
}

test('signing up with a new email creates an account and returns a session cookie', async () => {
  const client = harness.client();
  const res = await client.post('/auth/signup', { email: 'new@example.com', password: PASSWORD });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'new@example.com');
  assert.ok(res.body.user.id);
  assert.ok(!('password' in res.body.user), 'the response must not echo the password');

  const cookie = sessionCookie(res.setCookie);
  assert.ok(cookie, 'a session cookie is set');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
});

test('the session cookie from sign-up is immediately usable', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'usable@example.com', password: PASSWORD });

  const me = await client.get('/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'usable@example.com');
});

test('signing up with an email that already exists is rejected with a clear message', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'taken@example.com', password: PASSWORD });

  const res = await client.post('/auth/signup', { email: 'taken@example.com', password: PASSWORD });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /already exists/i);
});

test('email addresses are treated case-insensitively', async () => {
  const client = harness.client();
  const signup = await client.post('/auth/signup', { email: 'Mixed@Example.com', password: PASSWORD });
  assert.equal(signup.status, 201);

  const duplicate = await client.post('/auth/signup', { email: 'mixed@example.com', password: PASSWORD });
  assert.equal(duplicate.status, 400);

  const login = await harness.client().post('/auth/login', { email: 'MIXED@EXAMPLE.COM', password: PASSWORD });
  assert.equal(login.status, 200);
});

test('signing up with a password under 8 characters is rejected with the rule', async () => {
  const client = harness.client();
  const res = await client.post('/auth/signup', { email: 'short@example.com', password: 'short7!' });

  assert.equal(res.status, 400);
  assert.match(res.body.error, /8 characters/i);
  assert.equal(sessionCookie(res.setCookie), undefined);

  const login = await harness.client().post('/auth/login', { email: 'short@example.com', password: 'short7!' });
  assert.equal(login.status, 401, 'the rejected sign-up created no account');
});

test('signing up without an email or a password is rejected', async () => {
  const client = harness.client();
  assert.equal((await client.post('/auth/signup', { password: PASSWORD })).status, 400);
  assert.equal((await client.post('/auth/signup', { email: 'nopass@example.com' })).status, 400);
});

test('signing in with correct credentials returns a session cookie', async () => {
  await harness.client().post('/auth/signup', { email: 'returning@example.com', password: PASSWORD });

  const client = harness.client();
  const res = await client.post('/auth/login', { email: 'returning@example.com', password: PASSWORD });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'returning@example.com');
  const cookie = sessionCookie(res.setCookie);
  assert.ok(cookie);
  assert.match(cookie, /HttpOnly/i);

  const me = await client.get('/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'returning@example.com');
});

test('a wrong password and an unregistered email are indistinguishable', async () => {
  await harness.client().post('/auth/signup', { email: 'known@example.com', password: PASSWORD });

  const wrongPassword = await harness.client().post('/auth/login', {
    email: 'known@example.com',
    password: 'wrong-password',
  });
  const unknownEmail = await harness.client().post('/auth/login', {
    email: 'nobody@example.com',
    password: PASSWORD,
  });

  assert.equal(wrongPassword.status, unknownEmail.status);
  assert.deepEqual(wrongPassword.body, unknownEmail.body);
  assert.equal(wrongPassword.status, 401);
  assert.equal(sessionCookie(wrongPassword.setCookie), undefined);
  assert.equal(sessionCookie(unknownEmail.setCookie), undefined);
});

test('the identity endpoint rejects a missing or unknown session', async () => {
  const anonymous = await harness.client().get('/auth/me', { sendCookies: false });
  assert.equal(anonymous.status, 401);
  assert.match(anonymous.body.error, /auth/i);

  const unknown = await harness.client().get('/auth/me', { cookieHeader: 'pp_session=not-a-real-token' });
  assert.equal(unknown.status, 401);
});

test('signing out revokes the session and clears the cookie', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'leaving@example.com', password: PASSWORD });
  const token = client.jar.get('pp_session');
  assert.ok(token);

  const logout = await client.post('/auth/logout');
  assert.equal(logout.status, 200);
  assert.ok(sessionCookie(logout.setCookie), 'the cookie is overwritten on the way out');
  assert.equal(client.jar.get('pp_session'), undefined, 'the browser drops the cookie');

  const afterLogout = await harness.client().get('/auth/me', { cookieHeader: `pp_session=${token}` });
  assert.equal(afterLogout.status, 401, 'the old token is dead server-side, not just locally');
});

test('signing out requires a session', async () => {
  const res = await harness.client().post('/auth/logout', undefined, { sendCookies: false });
  assert.equal(res.status, 401);
});

test('signing back in after signing out issues a working session', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'again@example.com', password: PASSWORD });
  await client.post('/auth/logout');

  const login = await client.post('/auth/login', { email: 'again@example.com', password: PASSWORD });
  assert.equal(login.status, 200);
  const me = await client.get('/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'again@example.com');
});

test('the health check stays open — it is the one endpoint outside the gate', async () => {
  const res = await harness.client().get('/health', { sendCookies: false });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});
