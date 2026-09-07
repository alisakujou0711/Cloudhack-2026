// The seeded demo account: someone evaluating the app signs in with published credentials and
// finds a used-looking account. The fixtures are the point — a history entry whose snapshot is
// missing what its renderer reads expands into an empty panel, which demos worse than no seed.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  startTestServer,
  startServerProcess,
  createClient,
  temporaryDatabase,
  freePort,
} = require('./helpers/testServer');

let harness;
let demo;

before(async () => {
  harness = await startTestServer();
  demo = require('../services/demoAccount');
});

after(async () => {
  await harness.stop();
});

async function signedInDemoClient() {
  const client = harness.client();
  const res = await client.post('/auth/login', { email: demo.DEMO_EMAIL, password: demo.DEMO_PASSWORD });
  assert.equal(res.status, 200, 'the demo credentials work on the ordinary sign-in route');
  return client;
}

// What each renderer in HistoryPage's `renderSnapshot` reads. A snapshot missing any of these
// renders as a blank expansion. See docs/features/history.md.
const REQUIRED_SNAPSHOT_FIELDS = {
  university: ['competitiveness', 'university', 'major', 'checklist', 'checklistPassCount', 'checklistTotal', 'feedback', 'source'],
  internship: ['name', 'sections', 'overallImpression', 'strengths', 'improvementAreas', 'source'],
  essay: ['overallImpression', 'strengths', 'improvementAreas', 'perQuestion', 'source'],
  coverLetter: ['overallImpression', 'strengths', 'improvementAreas', 'perPrompt', 'source'],
  interview: ['targetName', 'overview', 'researchTips', 'technicalPrep', 'timelineAdvice', 'commonQuestions', 'source'],
};

test('seeding an empty database creates an account that signs in through the ordinary route', async () => {
  const result = demo.seedDemoAccount();
  assert.equal(result.seeded, true);

  const client = await signedInDemoClient();
  const me = await client.get('/auth/me');
  assert.equal(me.body.user.email, demo.DEMO_EMAIL);
});

test('the demo account holds a complete profile, so it goes straight into the app', async () => {
  const client = await signedInDemoClient();
  const state = (await client.get('/state')).body;

  assert.ok(state.profile, 'a missing profile would send the routing gate back to onboarding');
  assert.ok(state.profile.name, 'profile.name');
  assert.ok(state.profile.educationLevel, 'profile.educationLevel');
  assert.ok(state.profile.location, 'profile.location');
});

test('history spans more than one optimization type', async () => {
  const client = await signedInDemoClient();
  const { history } = (await client.get('/state')).body;

  assert.ok(Array.isArray(history) && history.length >= 3, 'several entries, not one');
  const types = new Set(history.map((entry) => entry.type));
  assert.ok(types.size > 1, `more than one type, got ${[...types].join(', ')}`);
});

test('every seeded entry carries a snapshot its renderer can display in full', async () => {
  const client = await signedInDemoClient();
  const { history } = (await client.get('/state')).body;

  for (const entry of history) {
    assert.ok(entry.id, 'entry.id');
    assert.ok(entry.timestamp, `${entry.type}: timestamp`);
    assert.ok(entry.title, `${entry.type}: title`);
    assert.ok(entry.summary, `${entry.type}: summary`);

    const required = REQUIRED_SNAPSHOT_FIELDS[entry.type];
    assert.ok(required, `${entry.type} is a known history type`);
    for (const field of required) {
      const value = entry.snapshot[field];
      assert.ok(
        value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0),
        `${entry.type} snapshot is missing "${field}" — its renderer reads it`,
      );
    }
  }
});

test('the itemized half of each report is populated, not just the overview', async () => {
  const client = await signedInDemoClient();
  const { history } = (await client.get('/state')).body;
  const byType = Object.fromEntries(history.map((entry) => [entry.type, entry.snapshot]));

  assert.ok(byType.university.checklist.length > 0, 'university: checklist rows');
  assert.ok(byType.university.feedback.summary, 'university: feedback.summary');
  assert.ok(byType.university.feedback.recommendations.length > 0, 'university: recommendations');

  const bullets = byType.internship.sections.flatMap((s) => s.entries.flatMap((e) => e.bullets));
  assert.ok(bullets.length > 0, 'internship: parsed bullets');
  assert.ok(bullets.some((b) => b.suggestion), 'internship: at least one suggested rewrite to accept/reject');

  assert.ok(byType.essay.perQuestion.every((q) => q.question && q.feedback), 'essay: every question answered');
  assert.ok(byType.coverLetter.perPrompt.every((p) => p.prompt && p.feedback), 'coverLetter: every prompt answered');
  assert.ok(byType.interview.commonQuestions.length > 0, 'interview: common questions');
});

test('the documents the reports were produced from are on file too', async () => {
  const client = await signedInDemoClient();
  const state = (await client.get('/state')).body;

  // The History page's "Your Documents" card reads these, and the chatbot's context carries them.
  assert.ok(state.universityPortfolio.rawText, 'universityPortfolio.rawText');
  assert.ok(state.internshipPortfolio.resumeText, 'internshipPortfolio.resumeText');
});

test('seeding again leaves the account exactly as it was found', async () => {
  const client = await signedInDemoClient();
  await client.put('/state', { profile: { name: 'Edited mid-demo', educationLevel: 'jc', location: 'Singapore' } });

  const again = demo.seedDemoAccount();
  assert.equal(again.seeded, false, 'the account already exists, so nothing is written');

  const state = (await client.get('/state')).body;
  assert.equal(state.profile.name, 'Edited mid-demo', "the demo's own work survived a re-seed");
  assert.ok(!state.history, 'the fixtures were not put back over it');
});

test('a demo account cleared mid-demo stays cleared', async () => {
  const client = await signedInDemoClient();
  assert.equal((await client.del('/state')).status, 200);

  demo.seedDemoAccount();

  assert.deepEqual((await client.get('/state')).body, {}, 'clearing keys on the account, not its content');
});

// The boot path itself: index.js is what seeds, so the credentials in the README have to work
// against a database nobody has touched, and the log has to say what they are.
test('a fresh database boots with the demo account, and the log says how to reach it', async () => {
  const database = temporaryDatabase();
  const port = await freePort();

  const server = startServerProcess({
    port,
    databasePath: database.file,
    // The demo line is the last thing boot prints, so waiting for it waits for the whole startup
    // banner rather than racing the line this test is about.
    readyWhen: (output) => output.includes('listening') && output.includes('Demo account'),
  });
  try {
    await server.ready;

    assert.ok(server.log().includes(demo.DEMO_EMAIL), 'the log names the demo email');
    assert.ok(server.log().includes(demo.DEMO_PASSWORD), 'the log names the demo password');

    const client = createClient(`http://127.0.0.1:${port}/api`);
    const login = await client.post('/auth/login', { email: demo.DEMO_EMAIL, password: demo.DEMO_PASSWORD });
    assert.equal(login.status, 200, 'the published credentials work on a database nobody has touched');
    assert.ok((await client.get('/state')).body.history.length > 0, 'and it opens on a used-looking account');
  } finally {
    await server.stop();
    database.remove();
  }
});

// The one case where deletion is recoverable, and the reason a presenter can demonstrate it:
// seeding is keyed on the demo account's absence, so a restart finds it missing and puts it back.
test('a deleted demo account comes back on the next restart', async () => {
  const database = temporaryDatabase();
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}/api`;
  const boot = {
    port,
    databasePath: database.file,
    readyWhen: (output) => output.includes('listening') && output.includes('Demo account'),
  };
  const signIn = () =>
    createClient(baseUrl).post('/auth/login', { email: demo.DEMO_EMAIL, password: demo.DEMO_PASSWORD });

  const first = startServerProcess(boot);
  try {
    await first.ready;
    const client = createClient(baseUrl);
    assert.equal(
      (await client.post('/auth/login', { email: demo.DEMO_EMAIL, password: demo.DEMO_PASSWORD })).status,
      200,
    );

    const deleted = await client.del('/account', { body: { currentPassword: demo.DEMO_PASSWORD } });
    assert.equal(deleted.status, 200, 'the demo account is not special-cased — it deletes like any other');
    assert.equal((await signIn()).status, 401, 'and it is gone while this server is up');
  } finally {
    await first.stop();
  }

  const second = startServerProcess(boot);
  try {
    await second.ready;
    assert.equal((await signIn()).status, 200, 'the restart seeded it again');

    const client = createClient(baseUrl);
    await client.post('/auth/login', { email: demo.DEMO_EMAIL, password: demo.DEMO_PASSWORD });
    assert.ok((await client.get('/state')).body.history.length > 0, 'with its fixtures, not empty');
  } finally {
    await second.stop();
    database.remove();
  }
});
