// The gate over the pre-existing feature endpoints. These routes hold no user data, so the point
// is posture: the API answers account holders, not strangers. Bodies here are the ones that would
// succeed, so a 401 is about the missing Session and never about the payload.
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

const FEATURE_ENDPOINTS = [
  ['GET', '/university/options', undefined],
  ['POST', '/assess/university', {
    university: 'NUS',
    major: 'Computer Science',
    portfolio: {
      gpa: 3.8,
      subjects: ['Mathematics'],
      extracurriculars: 'Robotics club captain',
      languageProficiency: 'IELTS 7.5',
    },
  }],
  ['POST', '/university/extract-text', { text: 'GPA 3.8. Subjects: Mathematics, Physics.' }],
  ['POST', '/assess/internship', { resumeText: 'Ada Lovelace — software engineering intern.' }],
  ['POST', '/optimize/essay', { questions: ['Why this course?'], answers: ['Because I build things.'] }],
  ['POST', '/optimize/cover-letter', { prompts: ['Why this role?'], answers: ['Because I ship.'] }],
  ['POST', '/interview/prepare', { type: 'university', university: 'NUS', major: 'Computer Science' }],
  ['POST', '/resume/export', { name: 'Ada Lovelace', contact: 'ada@example.com', sections: [] }],
  ['POST', '/chat', { message: 'What should I work on next?', history: [], context: {} }],
];

const UPLOAD_ENDPOINTS = ['/university/extract', '/optimize/classify', '/resume/extract'];

function textUpload(content, filename = 'application.txt') {
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/plain' }), filename);
  return form;
}

async function signedUpClient(email) {
  const client = harness.client();
  const res = await client.post('/auth/signup', { email, password: PASSWORD });
  assert.equal(res.status, 201, `sign-up for ${email} succeeded`);
  return client;
}

for (const [method, endpoint, body] of FEATURE_ENDPOINTS) {
  test(`${method} ${endpoint} is unreachable without a session`, async () => {
    const res = await harness.client().request(method, endpoint, { body, sendCookies: false });
    assert.equal(res.status, 401);
    assert.match(res.body.error, /auth/i);
  });
}

for (const endpoint of UPLOAD_ENDPOINTS) {
  test(`POST ${endpoint} is unreachable without a session`, async () => {
    const res = await harness.client().postForm(endpoint, textUpload('Ada Lovelace, Mathematics.'), {
      sendCookies: false,
    });
    assert.equal(res.status, 401);
    assert.match(res.body.error, /auth/i);
  });
}

test('an expired or unknown session is turned away the same as no session at all', async () => {
  const res = await harness.client().post('/chat', { message: 'Hello', history: [], context: {} }, {
    cookieHeader: 'pp_session=not-a-real-token',
  });
  assert.equal(res.status, 401);
});

test('an upload from a stranger is refused without being parsed', async () => {
  // Comfortably over the 10MB multer limit. Were the gate behind the upload parser this would
  // fail as an oversized file; the session is checked before multer reads the body at all.
  const oversized = textUpload('x'.repeat(11 * 1024 * 1024), 'huge.txt');
  const res = await harness.client().postForm('/optimize/classify', oversized, { sendCookies: false });
  assert.equal(res.status, 401);
});

test('every feature endpoint still answers a signed-in person', async () => {
  const client = await signedUpClient('member@example.com');

  for (const [method, endpoint, body] of FEATURE_ENDPOINTS) {
    const res = await client.request(method, endpoint, { body });
    assert.equal(res.status, 200, `${method} ${endpoint} answered a signed-in person`);
  }
});

test('every upload endpoint still takes a document from a signed-in person', async () => {
  const client = await signedUpClient('uploader@example.com');
  const document = 'Ada Lovelace\nGPA 3.9\nExperience\n- Built the first program';

  for (const endpoint of UPLOAD_ENDPOINTS) {
    const res = await client.postForm(endpoint, textUpload(document, 'resume.txt'));
    assert.equal(res.status, 200, `${endpoint} answered a signed-in person`);
    assert.equal(res.body.filename, 'resume.txt', `${endpoint} still echoes the filename`);
  }
});

test('a signed-in upload still comes back classified', async () => {
  const client = await signedUpClient('classifier@example.com');

  const res = await client.postForm('/optimize/classify', textUpload('Ada Lovelace\nExperience\n- Built things', 'resume.txt'));
  assert.equal(res.status, 200);
  assert.ok(res.body.predictedType, 'the classification still comes back');
  assert.match(res.body.text, /Ada Lovelace/);
});

// The job description added to resume review and cover letter feedback is prompt context only:
// it must reach the service without widening either endpoint's response.
test('a job description is extra context, not a new response field', async () => {
  const client = await signedUpClient('jobdesc@example.com');
  const jobDescription = 'Software Engineering Intern. Required: Python, SQL, and shipping tested code.';

  const resume = await client.post('/assess/internship', {
    resumeText: 'Ada Lovelace\n\nEXPERIENCE\n- Built the first program',
    targetRole: 'Software Engineering Intern',
    jobDescription,
  });
  assert.equal(resume.status, 200);
  assert.ok(Array.isArray(resume.body.sections), 'the resume still comes back parsed into sections');
  assert.equal(resume.body.jobDescription, undefined, 'the job description is never echoed into the result');

  const letter = await client.post('/optimize/cover-letter', {
    prompts: ['Why this role?'],
    answers: ['Because I ship.'],
    companyName: 'Stripe',
    role: 'Software Engineering Intern',
    jobDescription,
  });
  assert.equal(letter.status, 200);
  assert.equal(letter.body.perPrompt.length, 1, 'still exactly one feedback entry per prompt');
  assert.equal(letter.body.jobDescription, undefined, 'the job description is never echoed into the result');
});
