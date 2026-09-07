const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { createEmptyState } = require('./userState');

const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_COST = 10;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Optional override, used by the expiry test. Unset, sessions last 30 days.
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || THIRTY_DAYS_MS;

// One message for both an unknown email and a wrong password, so the sign-in form cannot be
// used to discover who has an account.
const INVALID_CREDENTIALS = 'Email or password is incorrect';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function publicUser(row) {
  return { id: row.id, email: row.email, createdAt: row.created_at };
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run(token, userId, expiresAt);
  return { token, expiresAt, maxAgeMs: SESSION_TTL_MS };
}

function signUp({ email, password }) {
  const normalized = normalizeEmail(email);
  if (String(password).length < PASSWORD_MIN_LENGTH) {
    throw httpError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  const passwordHash = bcrypt.hashSync(String(password), BCRYPT_COST);
  let info;
  try {
    info = db
      .prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)')
      .run(normalized, passwordHash, new Date().toISOString());
  } catch (err) {
    // The unique index is the authority on "already taken" — a SELECT first would leave a race
    // between the check and the insert.
    if (String(err.code).startsWith('SQLITE_CONSTRAINT')) {
      throw httpError(400, 'An account with this email already exists');
    }
    throw err;
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  // Every account owns exactly one state document from the moment it exists, so the first read
  // after sign-up answers with an empty document rather than a missing one.
  createEmptyState(row.id);
  return { user: publicUser(row), session: createSession(row.id) };
}

function signIn({ email, password }) {
  const normalized = normalizeEmail(email);
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized);
  if (!row || !bcrypt.compareSync(String(password), row.password_hash)) {
    throw httpError(401, INVALID_CREDENTIALS);
  }
  return { user: publicUser(row), session: createSession(row.id) };
}

function signOut(token) {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Resolves a session token to its user, or null when the token is unknown or expired.
// An expired row is deleted on the way past.
function getSessionUser(token) {
  if (!token) return null;
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) return null;
  if (session.expires_at <= Date.now()) {
    signOut(token);
    return null;
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  return row ? publicUser(row) : null;
}

module.exports = { signUp, signIn, signOut, getSessionUser };
