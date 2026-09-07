const express = require('express');
const multer = require('multer');
const { assessUniversity, listOptions } = require('../services/universityAssessment');
const { assessInternship } = require('../services/internshipAssessment');
const { chatReply } = require('../services/chatbot');
const { hasKey, provider } = require('../services/llm');
const { extractText } = require('../services/resumeParser');
const { parseUniversityApplication } = require('../services/universityProfileParser');
const { buildResumePdf } = require('../services/resumePdf');
const { classifyDocument } = require('../services/documentClassifier');
const { assessEssays } = require('../services/essayOptimization');
const { assessCoverLetter } = require('../services/coverLetterOptimization');
const { prepareInterview } = require('../services/interviewPrep');
const { signUp, signIn, signOut } = require('../services/auth');
const { readState, replaceState } = require('../services/userState');
const {
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
} = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/health', (req, res) => {
  res.json({ ok: true, llmConfigured: hasKey, llmProvider: provider });
});

// An expected rejection (a taken email, a bad password) carries its own status and is not
// logged; anything else is a real failure and follows the file's 400-plus-log convention.
function sendAuthError(res, err) {
  if (!err.status) console.error(err);
  res.status(err.status || 400).json({ error: err.message });
}

router.post('/auth/signup', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const { user, session } = signUp({ email, password });
    setSessionCookie(res, session);
    res.status(201).json({ user });
  } catch (err) {
    sendAuthError(res, err);
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const { user, session } = signIn({ email, password });
    setSessionCookie(res, session);
    res.json({ user });
  } catch (err) {
    sendAuthError(res, err);
  }
});

// Everything below this line needs a session. The health check and the two credential routes
// above are the only open endpoints — a route added below is gated by default, and the guard sits
// ahead of `upload.single`, so a stranger's upload is refused without multer ever parsing it.
router.use(requireAuth);

router.post('/auth/logout', (req, res) => {
  signOut(req.sessionToken);
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/auth/me', (req, res) => {
  res.json({ user: req.user });
});

router.get('/state', (req, res) => {
  res.json(readState(req.user.id));
});

// The only check is that the body is a JSON object. The thirteen keys are not validated: the
// client is the sole writer, and a shape check here would need updating on every state change.
router.put('/state', (req, res) => {
  const state = req.body;
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return res.status(400).json({ error: 'The state document must be a JSON object' });
  }
  replaceState(req.user.id, state);
  res.json({ ok: true });
});

router.get('/university/options', (req, res) => {
  res.json({ universities: listOptions() });
});

router.post('/assess/university', async (req, res) => {
  try {
    const { university, major, portfolio, profile } = req.body;
    if (!university || !major || !portfolio) {
      return res.status(400).json({ error: 'university, major, and portfolio are required' });
    }
    const result = await assessUniversity({ university, major, portfolio, profile });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/university/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const rawText = await extractText(req.file.buffer, req.file.originalname, req.file.mimetype);
    if (!rawText || !rawText.trim()) {
      return res.status(422).json({ error: 'Could not extract any text from this file.' });
    }
    const fields = await parseUniversityApplication(rawText);
    res.json({ ...fields, filename: req.file.originalname });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/university/extract-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });
    const fields = await parseUniversityApplication(text);
    res.json(fields);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/optimize/classify', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const text = await extractText(req.file.buffer, req.file.originalname, req.file.mimetype);
    if (!text || !text.trim()) {
      return res.status(422).json({ error: 'Could not extract any text from this file.' });
    }
    const classification = await classifyDocument(text);
    res.json({ text: text.trim(), filename: req.file.originalname, ...classification });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/optimize/essay', async (req, res) => {
  try {
    const { university, major, questions, answers, profile } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions is required' });
    }
    const result = await assessEssays({ university, major, questions, answers: answers || [], profile });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/optimize/cover-letter', async (req, res) => {
  try {
    const { companyName, role, prompts, answers, profile } = req.body;
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: 'prompts is required' });
    }
    const result = await assessCoverLetter({ companyName, role, prompts, answers: answers || [], profile });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/resume/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const text = await extractText(req.file.buffer, req.file.originalname, req.file.mimetype);
    if (!text || !text.trim()) {
      return res.status(422).json({ error: 'Could not extract any text from this file.' });
    }
    res.json({ text: text.trim(), filename: req.file.originalname });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/assess/internship', async (req, res) => {
  try {
    const { resumeText, targetRole, profile } = req.body;
    if (!resumeText || resumeText.trim().length < 10) {
      return res.status(400).json({ error: 'resumeText is required (min 10 characters)' });
    }
    const result = await assessInternship({ resumeText, targetRole, profile });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/resume/export', (req, res) => {
  try {
    const { name, contact, sections } = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'sections is required' });
    }
    const safeName = (name || 'resume').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'resume';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    const doc = buildResumePdf({ name, contact, sections });
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/interview/prepare', async (req, res) => {
  try {
    const { type, university, major, companyName, role, jobDescription, daysUntil, profile } = req.body;
    if (type !== 'university' && type !== 'internship') {
      return res.status(400).json({ error: 'type must be "university" or "internship"' });
    }
    if (type === 'university' && !university) {
      return res.status(400).json({ error: 'university is required for a university interview' });
    }
    if (type === 'internship' && !companyName) {
      return res.status(400).json({ error: 'companyName is required for an internship interview' });
    }
    const result = await prepareInterview({
      type,
      university,
      major,
      companyName,
      role,
      jobDescription,
      daysUntil: typeof daysUntil === 'number' ? daysUntil : parseInt(daysUntil, 10) || undefined,
      profile,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const result = await chatReply({ message, history: history || [], context: context || {} });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
