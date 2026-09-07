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

// Changing the address the account signs in with. The current password is required: a session
// alone is not authority enough to take an account away from its owner.

test('changing the email with the correct password updates the address and keeps the session', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'old@example.com', password: PASSWORD });

  const res = await client.patch('/account/email', { email: 'new@school.edu', currentPassword: PASSWORD });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'new@school.edu');

  const me = await client.get('/auth/me');
  assert.equal(me.status, 200, 'the session survives the change');
  assert.equal(me.body.user.email, 'new@school.edu');
});

test('after changing the email the new address signs in and the old one does not', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'moving@example.com', password: PASSWORD });
  await client.patch('/account/email', { email: 'moved@example.com', currentPassword: PASSWORD });

  const withNew = await harness.client().post('/auth/login', { email: 'moved@example.com', password: PASSWORD });
  assert.equal(withNew.status, 200);

  const withOld = await harness.client().post('/auth/login', { email: 'moving@example.com', password: PASSWORD });
  assert.equal(withOld.status, 401);
});

test('changing the email with a wrong password is refused and leaves the address alone', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'guarded@example.com', password: PASSWORD });

  const res = await client.patch('/account/email', {
    email: 'stolen@example.com',
    currentPassword: 'not-the-password',
  });
  assert.equal(res.status, 400, 'a wrong password is not a dead session — it belongs beside the control');
  assert.match(res.body.error, /password/i);

  const me = await client.get('/auth/me');
  assert.equal(me.body.user.email, 'guarded@example.com');

  const stolen = await harness.client().post('/auth/login', { email: 'stolen@example.com', password: PASSWORD });
  assert.equal(stolen.status, 401, 'the address was never taken');
});

test('changing to an address another account already holds is refused with a clear message', async () => {
  await harness.client().post('/auth/signup', { email: 'occupied@example.com', password: PASSWORD });

  const client = harness.client();
  await client.post('/auth/signup', { email: 'hopeful@example.com', password: PASSWORD });

  const res = await client.patch('/account/email', {
    email: 'occupied@example.com',
    currentPassword: PASSWORD,
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /already exists/i);

  const me = await client.get('/auth/me');
  assert.equal(me.body.user.email, 'hopeful@example.com');
});

test('a changed email is normalised and matched case-insensitively, as sign-up is', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'plain@example.com', password: PASSWORD });

  const res = await client.patch('/account/email', { email: '  Shouty@Example.COM ', currentPassword: PASSWORD });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'shouty@example.com');

  const login = await harness.client().post('/auth/login', { email: 'SHOUTY@EXAMPLE.COM', password: PASSWORD });
  assert.equal(login.status, 200);

  const duplicate = await harness.client().post('/auth/signup', { email: 'shouty@example.com', password: PASSWORD });
  assert.equal(duplicate.status, 400, 'the changed address is registered like any other');
});

test('changing the email without a field is rejected', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'partial@example.com', password: PASSWORD });

  assert.equal((await client.patch('/account/email', { email: 'somewhere@example.com' })).status, 400);
  assert.equal((await client.patch('/account/email', { currentPassword: PASSWORD })).status, 400);
  // Blank once normalised: sign-up can leave an unreachable account behind, this would lock the
  // owner out of one they are using.
  assert.equal((await client.patch('/account/email', { email: '   ', currentPassword: PASSWORD })).status, 400);

  const me = await client.get('/auth/me');
  assert.equal(me.body.user.email, 'partial@example.com');
});

test('changing the email requires a session', async () => {
  const res = await harness.client().patch(
    '/account/email',
    { email: 'stranger@example.com', currentPassword: PASSWORD },
    { sendCookies: false },
  );
  assert.equal(res.status, 401);
  assert.match(res.body.error, /auth/i);
});

test('changing the password with the correct current one succeeds and keeps the session', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'rotating@example.com', password: PASSWORD });

  const res = await client.patch('/account/password', {
    currentPassword: PASSWORD,
    newPassword: 'a-much-better-one',
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);

  const me = await client.get('/auth/me');
  assert.equal(me.status, 200, 'the session that made the change keeps working');
  assert.equal(me.body.user.email, 'rotating@example.com');
});

test('after changing the password the new one signs in and the old one does not', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'rotated@example.com', password: PASSWORD });
  await client.patch('/account/password', { currentPassword: PASSWORD, newPassword: 'a-much-better-one' });

  const withNew = await harness
    .client()
    .post('/auth/login', { email: 'rotated@example.com', password: 'a-much-better-one' });
  assert.equal(withNew.status, 200);

  const withOld = await harness
    .client()
    .post('/auth/login', { email: 'rotated@example.com', password: PASSWORD });
  assert.equal(withOld.status, 401);
});

test('changing the password revokes every other session and keeps the one making the change', async () => {
  const owner = harness.client();
  await owner.post('/auth/signup', { email: 'watched@example.com', password: PASSWORD });

  // A second session on the same account — the one the student came here to get rid of.
  const watcher = harness.client();
  const watcherLogin = await watcher.post('/auth/login', { email: 'watched@example.com', password: PASSWORD });
  assert.equal(watcherLogin.status, 200);
  assert.equal((await watcher.get('/auth/me')).status, 200, 'the second session works before the change');

  const res = await owner.patch('/account/password', {
    currentPassword: PASSWORD,
    newPassword: 'a-much-better-one',
  });
  assert.equal(res.status, 200);

  assert.equal((await watcher.get('/auth/me')).status, 401, 'the other session is revoked');
  assert.equal((await owner.get('/auth/me')).status, 200, 'the session that made the change is not');
});

test('changing the password with a wrong current one is refused and changes nothing', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'guarded-pw@example.com', password: PASSWORD });

  const res = await client.patch('/account/password', {
    currentPassword: 'not-the-password',
    newPassword: 'a-much-better-one',
  });
  assert.equal(res.status, 400, 'a wrong password is not a dead session — it belongs beside the control');
  assert.match(res.body.error, /password/i);

  assert.equal((await client.get('/auth/me')).status, 200, 'nothing was revoked');
  const stillOld = await harness
    .client()
    .post('/auth/login', { email: 'guarded-pw@example.com', password: PASSWORD });
  assert.equal(stillOld.status, 200, 'the old password still signs in');
});

test('a new password below the minimum length is refused with the rule stated', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'short@example.com', password: PASSWORD });

  const res = await client.patch('/account/password', { currentPassword: PASSWORD, newPassword: 'short' });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /at least 8 characters/i);

  const stillOld = await harness
    .client()
    .post('/auth/login', { email: 'short@example.com', password: PASSWORD });
  assert.equal(stillOld.status, 200);
});

test('changing the password without a field is rejected', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'partial-pw@example.com', password: PASSWORD });

  assert.equal((await client.patch('/account/password', { newPassword: 'a-much-better-one' })).status, 400);
  assert.equal((await client.patch('/account/password', { currentPassword: PASSWORD })).status, 400);

  const stillOld = await harness
    .client()
    .post('/auth/login', { email: 'partial-pw@example.com', password: PASSWORD });
  assert.equal(stillOld.status, 200);
});

test('changing the password requires a session', async () => {
  const res = await harness.client().patch(
    '/account/password',
    { currentPassword: PASSWORD, newPassword: 'a-much-better-one' },
    { sendCookies: false },
  );
  assert.equal(res.status, 401);
  assert.match(res.body.error, /auth/i);
});

// Deleting the account. Irreversible by decision (docs/adr/0004-account-deletion-is-immediate.md),
// and asserted through what a later request can see rather than by reading tables.

test('deleting the account with the correct password ends the session and the account', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'leaving-for-good@example.com', password: PASSWORD });
  const token = client.jar.get('pp_session');

  const res = await client.del('/account', { body: { currentPassword: PASSWORD } });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(client.jar.get('pp_session'), undefined, 'the browser drops the cookie');

  const afterDelete = await harness.client().get('/auth/me', { cookieHeader: `pp_session=${token}` });
  assert.equal(afterDelete.status, 401, 'the session went with the account, not just the cookie');
});

test('after deleting the account neither the email nor the password signs in', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'gone@example.com', password: PASSWORD });
  await client.del('/account', { body: { currentPassword: PASSWORD } });

  const login = await harness.client().post('/auth/login', { email: 'gone@example.com', password: PASSWORD });
  assert.equal(login.status, 401, '"deleted" means deleted');
});

test('every other session on a deleted account stops working too', async () => {
  const owner = harness.client();
  await owner.post('/auth/signup', { email: 'two-devices@example.com', password: PASSWORD });

  const other = harness.client();
  await other.post('/auth/login', { email: 'two-devices@example.com', password: PASSWORD });
  assert.equal((await other.get('/auth/me')).status, 200, 'the second session works beforehand');

  assert.equal((await owner.del('/account', { body: { currentPassword: PASSWORD } })).status, 200);
  assert.equal((await other.get('/auth/me')).status, 401, 'the cascade took it with the account');
});

test('signing up again on a deleted address succeeds and starts from an empty document', async () => {
  const first = harness.client();
  await first.post('/auth/signup', { email: 'returning-empty@example.com', password: PASSWORD });
  await first.put('/state', { profile: { name: 'Jane Tan', educationLevel: 'jc', location: 'Singapore' } });
  await first.del('/account', { body: { currentPassword: PASSWORD } });

  const second = harness.client();
  const signup = await second.post('/auth/signup', { email: 'returning-empty@example.com', password: 'a-new-password' });
  assert.equal(signup.status, 201, 'the address is free again');

  const state = await second.get('/state');
  assert.equal(state.status, 200);
  assert.deepEqual(state.body, {}, 'the old document went with the old account');
});

test('deleting the account with a wrong password is refused and the account survives', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'staying@example.com', password: PASSWORD });

  const res = await client.del('/account', { body: { currentPassword: 'not-the-password' } });
  assert.equal(res.status, 400, 'a wrong password is not a dead session — it belongs beside the control');
  assert.match(res.body.error, /password/i);

  assert.equal((await client.get('/auth/me')).status, 200, 'the session is untouched');
  const login = await harness.client().post('/auth/login', { email: 'staying@example.com', password: PASSWORD });
  assert.equal(login.status, 200, 'and so are the credentials');
});

test('deleting the account without a password is rejected', async () => {
  const client = harness.client();
  await client.post('/auth/signup', { email: 'unarmed@example.com', password: PASSWORD });

  const res = await client.del('/account');
  assert.equal(res.status, 400);

  assert.equal((await client.get('/auth/me')).status, 200);
});

test('deleting the account requires a session', async () => {
  const res = await harness.client().del('/account', {
    body: { currentPassword: PASSWORD },
    sendCookies: false,
  });
  assert.equal(res.status, 401);
  assert.match(res.body.error, /auth/i);
});

test('the health check stays open — it is the one endpoint outside the gate', async () => {
  const res = await harness.client().get('/health', { sendCookies: false });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});
