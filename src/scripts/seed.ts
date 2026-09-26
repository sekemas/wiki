#!/usr/bin/env bun
/**
 * Load the starter encyclopedia: `bun run db:seed`.
 *
 * Upserts by slug, so running it twice does not duplicate anything. Existing
 * articles keep their timestamps and revision history.
 */
import { databaseFile, openDatabase } from "../db";
import { seedDatabase } from "../seed";

const db = openDatabase();
const report = seedDatabase(db);

console.log(`seeded ${databaseFile()}`);
console.log(`  categories        ${report.categories}`);
console.log(`  articles inserted ${report.articlesInserted}`);
console.log(`  articles updated  ${report.articlesUpdated}`);
console.log(`  revisions added   ${report.revisionsInserted}`);

const totals = db
  .query<{ articles: number; revisions: number; categories: number }, []>(
    `SELECT (SELECT COUNT(*) FROM articles)   AS articles,
            (SELECT COUNT(*) FROM revisions)  AS revisions,
            (SELECT COUNT(*) FROM categories) AS categories`,
  )
  .get();
console.log(
  `  totals now: ${totals?.articles ?? 0} articles, ${totals?.categories ?? 0} categories, ${totals?.revisions ?? 0} revisions`,
);
db.close();
