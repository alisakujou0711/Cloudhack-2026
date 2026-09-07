const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Optional override so tests can point at a throwaway file. Unset, the database lives next to
// the other server data and creates itself on first boot.
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'portify.db');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Idempotent bootstrap — every statement is create-if-not-exists, so booting against an
// existing database adds what is missing and destroys nothing.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS user_state (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state      TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

module.exports = { db, close: () => db.close() };
