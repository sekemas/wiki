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

CREATE INDEX IF NOT EXISTS idx_articles_updated    ON articles (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug       ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_revisions_article   ON revisions (article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug     ON categories (slug);
`;

export const SCHEMA_VERSION = 1;

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
