const { db } = require('../db');

// The state document — everything one account has produced — is stored and replaced as a single
// opaque JSON document mirroring the shape the client holds. It is deliberately not normalised:
// history entries carry whole assessment snapshots that the report components re-render from.
// See docs/adr/0001-state-document-stays-one-opaque-unit.md.

const EMPTY_DOCUMENT = '{}';

// Called at sign-up so a new account has an empty document rather than a missing one.
function createEmptyState(userId) {
  db.prepare('INSERT OR IGNORE INTO user_state (user_id, state, updated_at) VALUES (?, ?, ?)')
    .run(userId, EMPTY_DOCUMENT, new Date().toISOString());
}

function readState(userId) {
  const row = db.prepare('SELECT state FROM user_state WHERE user_id = ?').get(userId);
  return row ? JSON.parse(row.state) : {};
}

// Wholesale replacement, last-write-wins: the client sends the entire document on every save and
// there is no conflict detection. The upsert covers an account whose row predates this table.
function replaceState(userId, state) {
  db.prepare(
    `INSERT INTO user_state (user_id, state, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
  ).run(userId, JSON.stringify(state), new Date().toISOString());
}

// "Clear my data": the Account survives and only its document goes, back to the same empty one
// sign-up creates. The client's defaults are not reconstructed here — the document stays opaque,
// and an empty one is what the client spreads its defaults over on the next read.
function clearState(userId) {
  replaceState(userId, {});
}

module.exports = { createEmptyState, readState, replaceState, clearState };
