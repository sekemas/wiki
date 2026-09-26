#!/usr/bin/env bun
/**
 * Apply the schema: `bun run db:migrate`.
 * Idempotent — safe to run against an existing database at any time.
 */
import { databaseFile, openDatabase } from "../db";

const db = openDatabase();
const version = db
  .query<{ value: string }, []>("SELECT value FROM meta WHERE key = 'schema_version'")
  .get();

console.log(`migrated ${databaseFile()} (schema version ${version?.value ?? "?"})`);
db.close();
