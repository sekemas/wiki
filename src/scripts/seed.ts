#!/usr/bin/env bun
/**
 * Load the starter encyclopedia: `bun run db:seed`.
 *
 * Upserts by slug, so running it twice does not duplicate anything. Existing
 * articles keep their timestamps and revision history.
 */
import { prisma } from "../prisma";
import { seedDatabase } from "../seed";

const report = await seedDatabase();

// Never print the password half of the connection string.
const target = (process.env.DATABASE_URL ?? "(DATABASE_URL unset)").replace(/:[^:@/]*@/, ":***@");
console.log(`seeded ${target}`);
console.log(`  categories        ${report.categories}`);
console.log(`  articles inserted ${report.articlesInserted}`);
console.log(`  articles updated  ${report.articlesUpdated}`);
console.log(`  revisions added   ${report.revisionsInserted}`);

const [articles, categories, revisions] = await Promise.all([
  prisma.article.count(),
  prisma.category.count(),
  prisma.revision.count(),
]);
console.log(
  `  totals now: ${articles} articles, ${categories} categories, ${revisions} revisions`,
);

await prisma.$disconnect();
