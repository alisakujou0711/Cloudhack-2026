// The State document over HTTP: every Account has exactly one, only its owner can reach it, and
// what a Session writes is what a later Session reads back — snapshots and all.
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

async function signedUpClient(email) {
  const client = harness.client();
  const res = await client.post('/auth/signup', { email, password: PASSWORD });
  assert.equal(res.status, 201, `sign-up for ${email} succeeded`);
  return client;
}

// Shaped like the real thing: a Profile, an in-progress draft, and a History entry whose Snapshot
// is the whole Assessment the report components re-render from.
function stateDocument(name) {
  return {
    profile: { name, educationLevel: 'jc', location: 'Malaysia' },
    essayOptimization: { university: 'NUS', major: 'Computer Science', questionCount: 1, questions: ['Why us?'], answers: ['Half a draft'] },
    chatHistory: [{ role: 'user', text: 'hello' }],
    history: [
      {
        id: 'entry-1',
        timestamp: 1700000000000,
        bookmarked: true,
        type: 'essay',
        title: 'Essay review',
        summary: '1 question',
        snapshot: {
          overallImpression: 'Promising',
          strengths: ['Clear voice'],
          improvementAreas: ['Add specifics'],
          internationalNote: 'Check transcript equivalency',
          perQuestion: [{ question: 'Why us?', feedback: ['Be concrete'], revised: 'A better answer' }],
          source: 'mock',
        },
      },
    ],
  };
}

test('a newly created account has an empty state document rather than a missing one', async () => {
  const client = await signedUpClient('fresh@example.com');

  const res = await client.get('/state');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, {});
});

test('state written on a session is returned intact by a later request, snapshots and all', async () => {
  const client = await signedUpClient('roundtrip@example.com');
  const document = stateDocument('Roundtrip');

  const write = await client.put('/state', document);
  assert.equal(write.status, 200);

  const read = await client.get('/state');
  assert.equal(read.status, 200);
  assert.deepEqual(read.body, document);
});

test('a write replaces the document wholesale rather than merging into it', async () => {
  const client = await signedUpClient('wholesale@example.com');
  await client.put('/state', stateDocument('Wholesale'));

  await client.put('/state', { profile: { name: 'Only me' } });

  const read = await client.get('/state');
  assert.deepEqual(read.body, { profile: { name: 'Only me' } });
  assert.ok(!('history' in read.body), 'the replaced keys are gone, not merged over');
});

test('state survives signing out and signing back in', async () => {
  const first = await signedUpClient('returning@example.com');
  await first.put('/state', stateDocument('Returning'));
  assert.equal((await first.post('/auth/logout')).status, 200);

  // A different client, as a different browser would be: only the credentials carry over.
  const second = harness.client();
  const login = await second.post('/auth/login', { email: 'returning@example.com', password: PASSWORD });
  assert.equal(login.status, 200);

  const read = await second.get('/state');
  assert.equal(read.status, 200);
  assert.deepEqual(read.body, stateDocument('Returning'));
});

test('one account cannot read or write another account\'s state', async () => {
  const owner = await signedUpClient('owner@example.com');
  await owner.put('/state', stateDocument('Owner'));

  const other = await signedUpClient('other@example.com');
  const read = await other.get('/state');
  assert.equal(read.status, 200);
  assert.deepEqual(read.body, {}, 'a second account starts empty');

  await other.put('/state', { profile: { name: 'Other' } });

  const ownerRead = await owner.get('/state');
  assert.deepEqual(ownerRead.body, stateDocument('Owner'), "the other account's write left this one untouched");
});

test('state requests without a usable session are rejected', async () => {
  const anonymous = harness.client();

  const noCookie = await anonymous.get('/state');
  assert.equal(noCookie.status, 401);

  const noCookieWrite = await anonymous.put('/state', { profile: null });
  assert.equal(noCookieWrite.status, 401);

  const unknownCookie = await anonymous.get('/state', { cookieHeader: 'pp_session=not-a-real-token' });
  assert.equal(unknownCookie.status, 401);

  const revoked = await signedUpClient('revoked@example.com');
  await revoked.post('/auth/logout');
  const afterSignOut = await revoked.get('/state');
  assert.equal(afterSignOut.status, 401);
});

test('a body that is not a json object is rejected', async () => {
  const client = await signedUpClient('badbody@example.com');
  await client.put('/state', { profile: { name: 'Intact' } });

  const array = await client.put('/state', []);
  assert.equal(array.status, 400, 'an array is not a state document');
  assert.match(array.body.error, /object/i);

  const missing = await client.put('/state');
  assert.equal(missing.status, 400, 'no body at all is not a state document');
  assert.match(missing.body.error, /object/i);

  const read = await client.get('/state');
  assert.deepEqual(read.body, { profile: { name: 'Intact' } }, 'a rejected write changed nothing');
});
