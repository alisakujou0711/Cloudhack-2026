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

// Sign-up necessarily reveals that an address is taken, and so does changing to one. Only
// sign-in has to stay silent about it.
const EMAIL_TAKEN = 'An account with this email already exists';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// The unique index is the authority on "already taken" — a SELECT first would leave a race
// between the check and the write. Both writers of the email column translate it the same way.
function asEmailConflict(err) {
  if (String(err.code).startsWith('SQLITE_CONSTRAINT')) return httpError(400, EMAIL_TAKEN);
  return err;
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
    throw asEmailConflict(err);
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

// The account's own password, checked before a credential change. The session proves the browser
// and nothing more: without this, an unlocked machine would be enough to take an account away
// from its owner permanently. A 400 rather than a 401 — the session is fine, the field is wrong,
// and the client's central "your session has ended" handling must not fire on it.
function verifyPassword(userId, password) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row || !bcrypt.compareSync(String(password), row.password_hash)) {
    throw httpError(400, 'Current password is incorrect');
  }
  return row;
}

function changeEmail({ userId, email, currentPassword }) {
  const row = verifyPassword(userId, currentPassword);
  const normalized = normalizeEmail(email);
  // Sign-up can leave a blank address behind on an account nobody can reach; here it would lock
  // the owner out of one they are already using.
  if (!normalized) throw httpError(400, 'Enter a new email address');
  try {
    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(normalized, userId);
  } catch (err) {
    throw asEmailConflict(err);
  }
  // Sessions key on the account, not the address, so every one of them survives this — including
  // the one making the request, which is what keeps the student where they were. The row the
  // password check already read differs from the stored one by exactly this address.
  return publicUser({ ...row, email: normalized });
}

// Changing the password is the one credential change that revokes: a change that left the
// watcher's session alive would not do the thing the student came here to do. `keepSessionToken`
// is the one that survives, so protecting yourself does not eject you from the tab you are in.
// Password *reset* stays out of scope — there is no mail transport, and a forgotten password
// still means a new account.
function changePassword({ userId, currentPassword, newPassword, keepSessionToken }) {
  verifyPassword(userId, currentPassword);
  const next = String(newPassword);
  if (next.length < PASSWORD_MIN_LENGTH) {
    throw httpError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(next, BCRYPT_COST), userId);
  // `!= ''` rather than a null comparison: an absent token has to revoke everything, and
  // `token != NULL` is NULL in SQL, which would quietly delete nothing.
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?')
    .run(userId, keepSessionToken || '');
}

module.exports = { signUp, signIn, signOut, getSessionUser, changeEmail, changePassword };
