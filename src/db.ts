/**
 * Openpedia's database: a single SQLite file, opened with Bun's built-in
 * `bun:sqlite`. No server, no connection string, no third-party signup.
 *
 * The file lives at `data/openpedia.db` (override with OPENPEDIA_DB). It is
 * created on first use, its schema is applied idempotently, and the seed
 * content is loaded if the database is empty — so `bun run setup` on a fresh
 * clone, or simply starting the app, gives you a working encyclopedia.
 *
 * Server-only: never import this from a component or any other code that is
 * bundled for the browser. Route code reaches the database through the server
 * functions in `src/server/fns.ts`.
 */
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

import { seedIfEmpty } from "./seed";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  summary    TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS article_categories (
  article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

CREATE TABLE IF NOT EXISTS revisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  editor_name TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL
);

-- Accounts. Made in-house: an email, a display name (the name that appears in
-- revision history) and an argon2id password hash. No plaintext password is
-- ever stored, logged or returned.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

-- Login sessions. Only the SHA-256 hash of the random token is stored: the
-- cookie carries the token, the database carries the hash, so a leaked
-- database file is not a pile of usable sessions.
CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_updated    ON articles (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug       ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_revisions_article   ON revisions (article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug     ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_sessions_token      ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user       ON sessions (user_id);
`;

export const SCHEMA_VERSION = 2;

/**
 * Columns added after the first release. `CREATE TABLE IF NOT EXISTS` cannot
 * add a column to a table that already exists, so each one is checked against
 * `PRAGMA table_info` first — the same idempotent-migration rule as the schema
 * above, and safe to run on a database created by an earlier version.
 */
const ADDED_COLUMNS: { table: string; column: string; definition: string }[] = [
  {
    table: "revisions",
    column: "editor_user_id",
    definition: "INTEGER REFERENCES users(id)",
  },
];

function addMissingColumns(db: Database): void {
  for (const { table, column, definition } of ADDED_COLUMNS) {
    const columns = db.query<{ name: string }, []>(`PRAGMA table_info(${table})`).all();
    if (columns.some((c) => c.name === column)) continue;
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/** Absolute path of the SQLite file. */
export function databaseFile(): string {
  const override = process.env.OPENPEDIA_DB;
  if (override && override.length > 0) {
    return isAbsolute(override) ? override : resolve(process.cwd(), override);
  }
  return join(process.cwd(), "data", "openpedia.db");
}

/**
 * Apply the schema. Every statement is `IF NOT EXISTS`, so this is safe to run
 * on every startup and on an existing database — the standard idempotent
 * migration. `meta.schema_version` records the level the file is at.
 */
export function migrate(db: Database): void {
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  addMissingColumns(db);
  db.prepare("INSERT INTO meta (key, value) VALUES ('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(
    String(SCHEMA_VERSION),
  );
}

let handle: Database | null = null;

/** Open (once per process) and migrate the database, then return it. */
export function getDb(): Database {
  if (handle) return handle;
  const file = databaseFile();
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new Database(file, { create: true });
  migrate(db);
  // A fresh clone has an empty file: seed it on first use so the site is never
  // an empty shell. No-op once articles exist.
  seedIfEmpty(db);
  handle = db;
  return db;
}

/**
 * Open a database without touching the process-wide handle. Used by the
 * `db:migrate` / `db:seed` scripts so they can run and exit cleanly.
 */
export function openDatabase(file = databaseFile()): Database {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new Database(file, { create: true });
  migrate(db);
  return db;
}
