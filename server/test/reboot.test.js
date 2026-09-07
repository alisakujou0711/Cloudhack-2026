// Booting repeatedly against an existing database must be safe: the schema bootstrap is
// create-if-not-exists, so a second boot finds the first boot's account intact.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startServerProcess, createClient, temporaryDatabase, freePort } = require('./helpers/testServer');

test('an account survives a restart against the same database file', async () => {
  const database = temporaryDatabase();
  const port = await freePort();
  const client = createClient(`http://127.0.0.1:${port}/api`);

  const first = startServerProcess({ port, databasePath: database.file });
  try {
    await first.ready;
    const signup = await client.post('/auth/signup', {
      email: 'persisted@example.com',
      password: 'password123',
    });
    assert.equal(signup.status, 201);
  } finally {
    await first.stop();
  }

  const second = startServerProcess({ port, databasePath: database.file });
  try {
    await second.ready;
    const login = await createClient(`http://127.0.0.1:${port}/api`).post('/auth/login', {
      email: 'persisted@example.com',
      password: 'password123',
    });
    assert.equal(login.status, 200, 'the second boot kept the account created by the first');
  } finally {
    await second.stop();
    database.remove();
  }
});
