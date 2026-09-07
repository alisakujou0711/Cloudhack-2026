const fs = require('fs');
const path = require('path');
const { db } = require('../db');
const { signUp, signOut } = require('./auth');
const { replaceState } = require('./userState');

// An ordinary account with published credentials — there is deliberately no demo affordance on
// the sign-in screen, so these are how someone evaluating the app gets in. They appear in the
// README and in the startup log. See docs/features/demo-account.md.
const DEMO_EMAIL = 'demo@portify.app';
const DEMO_PASSWORD = 'portify';

// The state document the account is seeded with, recorded from real runs of the samples by
// `scripts/generate-demo-state.js` — never hand-edited, because report components read fields no
// summary line carries and a trimmed snapshot expands into an empty panel.
const FIXTURE_PATH = path.join(__dirname, '..', 'data', 'demoState.json');

const DAY_MS = 24 * 60 * 60 * 1000;
const ENTRY_SPACING_MS = 2 * DAY_MS;

// The fixture carries no timestamps: entries are dated relative to the boot that writes them, so
// the demo opens on runs from the last fortnight however long the fixture has been committed.
// The array is newest-first, exactly as `addHistoryEntry` prepends.
function demoState() {
  const now = Date.now();
  const state = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  state.history = state.history.map((entry, index) => ({
    ...entry,
    timestamp: now - index * ENTRY_SPACING_MS,
  }));
  return state;
}

/**
 * Creates the demo account and its worked-in state document, once.
 *
 * Keyed on whether the *account* exists, not on what it holds: a restart mid-demo never lands on
 * top of edits someone is showing, and an account whose data was cleared stays cleared. Deleting
 * the database file is what brings the fixtures back.
 */
function seedDemoAccount() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
  if (existing) return { seeded: false, email: DEMO_EMAIL, password: DEMO_PASSWORD };

  // Read the fixture before writing anything, and write the three rows as one transaction. The
  // existence of the account is what suppresses the next boot's attempt, so an account that
  // outlives a failed state write would be seeded-but-empty for good — and land the person
  // evaluating the app straight back in onboarding.
  const state = demoState();
  db.transaction(() => {
    // Going through sign-up rather than inserting directly keeps the demo account an ordinary
    // one: same hashing, same normalised email, same empty state row. The session it mints
    // belongs to nobody, so it is revoked immediately — the sign-in form is the only way in.
    const { user, session } = signUp({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    signOut(session.token);
    replaceState(user.id, state);
  })();

  return { seeded: true, email: DEMO_EMAIL, password: DEMO_PASSWORD };
}

module.exports = { seedDemoAccount, DEMO_EMAIL, DEMO_PASSWORD };
