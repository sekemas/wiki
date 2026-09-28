/**
 * Seeding for Openpedia, on PostgreSQL. Server-only.
 *
 * Idempotent by design: articles and categories are upserted by slug, so
 * `bun run db:seed` can be run as often as you like and `bun run setup` is safe
 * to re-run. Existing articles keep their original timestamps and revision
 * history; only the text is refreshed from `src/content/seed-data.ts`.
 *
 * Everything a seed writes is PUBLISHED, so the public pages show the whole
 * encyclopedia the moment the database exists.
 */
import { prisma } from "./prisma";
import { SEED_ARTICLES, SEED_CATEGORIES } from "./content/seed-data";

export type SeedReport = {
  categories: number;
  articlesInserted: number;
  articlesUpdated: number;
  revisionsInserted: number;
};

const DAY = 86_400_000;
const HOUR = 3_600_000;

/**
 * The first version of an article: everything up to (not including) the third
 * `##` heading. Gives the history page a genuinely shorter earlier revision.
 */
function firstVersion(body: string): string {
  const headings: number[] = [];
  const re = /^## /gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) headings.push(m.index);
  if (headings.length < 3) return body;
  return body.slice(0, headings[2]).trimEnd();
}

export async function seedDatabase(now = Date.now()): Promise<SeedReport> {
  const report: SeedReport = {
    categories: 0,
    articlesInserted: 0,
    articlesUpdated: 0,
    revisionsInserted: 0,
  };

  // One transaction: a half-seeded encyclopedia is never left behind.
  await prisma.$transaction(
    async (tx) => {
      for (const category of SEED_CATEGORIES) {
        await tx.category.upsert({
          where: { slug: category.slug },
          update: { name: category.name, description: category.description },
          create: {
            slug: category.slug,
            name: category.name,
            description: category.description,
          },
        });
        report.categories += 1;
      }

      for (const [index, seed] of SEED_ARTICLES.entries()) {
        // Spread the timestamps so "recently updated" is a real ordering rather
        // than the order of the source file. They are written explicitly on
        // every run, so re-seeding does not shuffle the front page.
        const updatedAt = new Date(now - ((index * 7) % 41) * DAY - 2 * HOUR);
        const createdAt = new Date(updatedAt.getTime() - (12 + (index % 5) * 3) * DAY);
        const text = {
          title: seed.title,
          summary: seed.summary,
          body: seed.body,
          status: "PUBLISHED" as const,
        };

        const existing = await tx.article.findUnique({
          where: { slug: seed.slug },
          select: { id: true },
        });

        let articleId: number;
        if (existing) {
          await tx.article.update({ where: { id: existing.id }, data: { ...text, updatedAt } });
          articleId = existing.id;
          report.articlesUpdated += 1;
        } else {
          const created = await tx.article.create({
            data: { slug: seed.slug, ...text, createdAt, updatedAt },
            select: { id: true },
          });
          articleId = created.id;
          report.articlesInserted += 1;
        }

        await tx.articleCategory.deleteMany({ where: { articleId } });
        for (const categorySlug of seed.categories) {
          const category = await tx.category.findUnique({
            where: { slug: categorySlug },
            select: { id: true },
          });
          if (!category) throw new Error(`Unknown category in seed data: ${categorySlug}`);
          await tx.articleCategory.create({ data: { articleId, categoryId: category.id } });
        }

        const already = await tx.revision.count({ where: { articleId } });
        if (already === 0) {
          await tx.revision.createMany({
            data: [
              {
                articleId,
                title: seed.title,
                body: firstVersion(seed.body),
                editorName: "Openpedia editors",
                note: "Initial version",
                createdAt,
              },
              {
                articleId,
                title: seed.title,
                body: seed.body,
                editorName: "Openpedia editors",
                note: "Copyedit: tightened the lead, added sections and internal links",
                createdAt: updatedAt,
              },
            ],
          });
          report.revisionsInserted += 2;
        }
      }
    },
    { timeout: 60_000, maxWait: 15_000 },
  );

  return report;
}

let inFlight: Promise<SeedReport | null> | null = null;

/**
 * Seed only when the database has no articles at all. Used at startup by the
 * home page, so a fresh database is never an empty shell, and safe to call
 * concurrently: the work happens once, the second caller awaits the same run.
 */
export async function seedIfEmpty(now = Date.now()): Promise<SeedReport | null> {
  if (inFlight) return inFlight;
  if ((await prisma.article.count()) > 0) return null;
  const run = seedDatabase(now);
  inFlight = run;
  try {
    return await run;
  } finally {
    inFlight = null;
  }
}
