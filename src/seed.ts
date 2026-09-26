/**
 * Seeding for Openpedia. Server-only.
 *
 * Idempotent by design: articles and categories are upserted by slug, so
 * `bun run db:seed` can be run as often as you like. Existing articles keep
 * their original timestamps and revision history; only the text is refreshed
 * from `src/content/seed-data.ts`.
 */
import type { Database } from "bun:sqlite";

import { SEED_ARTICLES, SEED_CATEGORIES } from "./content/seed-data";

export type SeedReport = {
  categories: number;
  articlesInserted: number;
  articlesUpdated: number;
  revisionsInserted: number;
};

const DAY = 86_400_000;

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

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

export function isSeeded(db: Database): boolean {
  const row = db.query<{ n: number }, []>("SELECT COUNT(*) AS n FROM articles").get();
  return (row?.n ?? 0) > 0;
}

export function seedDatabase(db: Database, now = Date.now()): SeedReport {
  const report: SeedReport = {
    categories: 0,
    articlesInserted: 0,
    articlesUpdated: 0,
    revisionsInserted: 0,
  };

  const upsertCategory = db.prepare(
    `INSERT INTO categories (slug, name, description) VALUES (?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description`,
  );
  const findCategory = db.prepare<{ id: number }, [string]>(
    "SELECT id FROM categories WHERE slug = ?",
  );
  const linkCategory = db.prepare(
    "INSERT INTO article_categories (article_id, category_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
  );
  const clearLinks = db.prepare("DELETE FROM article_categories WHERE article_id = ?");

  const findArticle = db.prepare<{ id: number }, [string]>(
    "SELECT id FROM articles WHERE slug = ?",
  );
  const insertArticle = db.prepare(
    `INSERT INTO articles (slug, title, summary, body, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const updateArticle = db.prepare(
    "UPDATE articles SET title = ?, summary = ?, body = ? WHERE slug = ?",
  );
  const countRevisions = db.prepare<{ n: number }, [number]>(
    "SELECT COUNT(*) AS n FROM revisions WHERE article_id = ?",
  );
  const insertRevision = db.prepare(
    `INSERT INTO revisions (article_id, title, body, editor_name, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  db.transaction(() => {
    for (const category of SEED_CATEGORIES) {
      upsertCategory.run(category.slug, category.name, category.description);
      report.categories += 1;
    }

    SEED_ARTICLES.forEach((article, index) => {
      // Spread the timestamps so "recently updated" is a real ordering rather
      // than the order of the source file.
      const updatedAt = now - ((index * 7) % 41) * DAY - 2 * 3_600_000;
      const createdAt = updatedAt - (12 + (index % 5) * 3) * DAY;

      const existing = findArticle.get(article.slug);
      let articleId: number;
      if (existing) {
        updateArticle.run(article.title, article.summary, article.body, article.slug);
        articleId = existing.id;
        report.articlesUpdated += 1;
      } else {
        const info = insertArticle.run(
          article.slug,
          article.title,
          article.summary,
          article.body,
          iso(createdAt),
          iso(updatedAt),
        );
        articleId = Number(info.lastInsertRowid);
        report.articlesInserted += 1;
      }

      clearLinks.run(articleId);
      for (const categorySlug of article.categories) {
        const category = findCategory.get(categorySlug);
        if (!category) throw new Error(`Unknown category in seed data: ${categorySlug}`);
        linkCategory.run(articleId, category.id);
      }

      const already = countRevisions.get(articleId)?.n ?? 0;
      if (already === 0) {
        const early = firstVersion(article.body);
        insertRevision.run(
          articleId,
          article.title,
          early,
          "Openpedia editors",
          "Initial version",
          iso(createdAt),
        );
        insertRevision.run(
          articleId,
          article.title,
          article.body,
          "Openpedia editors",
          "Copyedit: tightened the lead, added sections and internal links",
          iso(updatedAt),
        );
        report.revisionsInserted += 2;
      }
    });
  })();

  return report;
}

/** Convenience used at startup: seed only when the database has no articles. */
export function seedIfEmpty(db: Database): SeedReport | null {
  if (isSeeded(db)) return null;
  return seedDatabase(db);
}
