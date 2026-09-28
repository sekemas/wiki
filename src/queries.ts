/**
 * Read queries for Openpedia. Server-only — route code calls these through the
 * server functions in `src/server-fns.ts`.
 */
import { getDb } from "./db";
import type {
  ArticlePage,
  ArticleRow,
  ArticleSummary,
  CategoryRef,
  CategoryRow,
  CategoryWithCount,
  HomeData,
  RevisionRow,
  SearchResults,
} from "./types";

function categoryRefs(articleId: number, db = getDb()): CategoryRef[] {
  return db
    .query<CategoryRef, [number]>(
      `SELECT c.slug AS slug, c.name AS name
         FROM categories c
         JOIN article_categories ac ON ac.category_id = c.id
        WHERE ac.article_id = ?
        ORDER BY c.name`,
    )
    .all(articleId);
}

function decorate(rows: ArticleRow[], db = getDb()): ArticleSummary[] {
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    updated_at: row.updated_at,
    categories: categoryRefs(row.id, db),
  }));
}

export function getArticleBySlug(slug: string): ArticleRow | null {
  return (
    getDb()
      .query<ArticleRow, [string]>(
        "SELECT * FROM articles WHERE slug = ? COLLATE NOCASE",
      )
      .get(slug) ?? null
  );
}

export function allSlugs(): string[] {
  return getDb()
    .query<{ slug: string }, []>("SELECT slug FROM articles ORDER BY slug")
    .all()
    .map((r) => r.slug);
}

export function getRecentArticles(limit = 6): ArticleSummary[] {
  const rows = getDb()
    .query<ArticleRow, [number]>(
      "SELECT * FROM articles ORDER BY updated_at DESC LIMIT ?",
    )
    .all(limit);
  return decorate(rows);
}

export function getAllArticles(): ArticleSummary[] {
  const rows = getDb()
    .query<ArticleRow, []>("SELECT * FROM articles ORDER BY title COLLATE NOCASE")
    .all();
  return decorate(rows);
}

export function getCategories(): CategoryWithCount[] {
  return getDb()
    .query<CategoryWithCount, []>(
      `SELECT c.slug AS slug, c.name AS name, c.description AS description,
              COUNT(ac.article_id) AS articleCount
         FROM categories c
         LEFT JOIN article_categories ac ON ac.category_id = c.id
        GROUP BY c.id
        ORDER BY c.name`,
    )
    .all();
}

export function getCategoryBySlug(slug: string): CategoryRow | null {
  return (
    getDb()
      .query<CategoryRow, [string]>("SELECT * FROM categories WHERE slug = ? COLLATE NOCASE")
      .get(slug) ?? null
  );
}

export function getArticlesInCategory(categoryId: number): ArticleSummary[] {
  const rows = getDb()
    .query<ArticleRow, [number]>(
      `SELECT a.* FROM articles a
         JOIN article_categories ac ON ac.article_id = a.id
        WHERE ac.category_id = ?
        ORDER BY a.title COLLATE NOCASE`,
    )
    .all(categoryId);
  return decorate(rows);
}

export function getRevisions(articleId: number): RevisionRow[] {
  return getDb()
    .query<RevisionRow, [number]>(
      "SELECT * FROM revisions WHERE article_id = ? ORDER BY created_at DESC, id DESC",
    )
    .all(articleId);
}

/** One revision of one article, or null (the pair must match). */
export function getRevision(articleId: number, revisionId: number): RevisionRow | null {
  return (
    getDb()
      .query<RevisionRow, [number, number]>(
        "SELECT * FROM revisions WHERE id = ? AND article_id = ?",
      )
      .get(revisionId, articleId) ?? null
  );
}

/** Everything the edit form starts from: the current article and its categories. */
export function getArticleForEdit(slug: string): {
  slug: string;
  title: string;
  summary: string;
  body: string;
  categorySlugs: string[];
} | null {
  const article = getArticleBySlug(slug);
  if (!article) return null;
  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    body: article.body,
    categorySlugs: categoryRefs(article.id).map((category) => category.slug),
  };
}

export function getArticlePage(slug: string): ArticlePage | null {
  const db = getDb();
  const article = getArticleBySlug(slug);
  if (!article) return null;

  const categories = categoryRefs(article.id, db);

  const related = db
    .query<{ slug: string; title: string; summary: string }, [number, number]>(
      `SELECT DISTINCT a.slug AS slug, a.title AS title, a.summary AS summary
         FROM articles a
         JOIN article_categories ac ON ac.article_id = a.id
        WHERE ac.category_id IN (SELECT category_id FROM article_categories WHERE article_id = ?)
          AND a.id != ?
        ORDER BY a.updated_at DESC
        LIMIT 5`,
    )
    .all(article.id, article.id);

  const revisions = getRevisions(article.id);

  return {
    article,
    categories,
    related,
    lastEditor: revisions[0]?.editor_name ?? null,
    lastNote: revisions[0]?.note ?? null,
    revisionCount: revisions.length,
    knownSlugs: allSlugs(),
  };
}

/** Escape the LIKE wildcards so a search for "50%" means those characters. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

function plainText(markdown: string): string {
  return markdown
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_all, slug: string, label?: string) => label ?? slug)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function snippetAround(text: string, needle: string): string {
  const flat = plainText(text);
  if (needle.length === 0) return flat.slice(0, 180);
  const at = flat.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return flat.slice(0, 180);
  const start = Math.max(0, at - 70);
  const end = Math.min(flat.length, at + needle.length + 110);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}

export function searchArticles(rawQuery: string): SearchResults {
  const query = rawQuery.trim();
  if (query.length === 0) return { query, count: 0, hits: [] };

  const like = `%${escapeLike(query)}%`;
  const rows = getDb()
    .query<
      {
        slug: string;
        title: string;
        summary: string;
        body: string;
        updated_at: string;
        match_title: number;
      },
      [string, string, string, string]
    >(
      `SELECT slug, title, summary, body, updated_at,
              CASE WHEN title LIKE ? ESCAPE '\\' THEN 1 ELSE 0 END AS match_title
         FROM articles
        WHERE title LIKE ? ESCAPE '\\'
           OR summary LIKE ? ESCAPE '\\'
           OR body LIKE ? ESCAPE '\\'
        ORDER BY match_title DESC, length(title) ASC, title COLLATE NOCASE ASC`,
    )
    .all(like, like, like, like);

  const hits = rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    updated_at: row.updated_at,
    matchInTitle: row.match_title === 1,
    snippet: row.match_title === 1 ? plainText(row.summary).slice(0, 180) : snippetAround(row.body, query),
  }));

  return { query, count: hits.length, hits };
}

export function getStats() {
  const db = getDb();
  const one = <T,>(sql: string): T => db.query<T, []>(sql).get() as T;
  const articles = one<{ n: number }>("SELECT COUNT(*) AS n FROM articles").n;
  const categories = one<{ n: number }>("SELECT COUNT(*) AS n FROM categories").n;
  const revisions = one<{ n: number }>("SELECT COUNT(*) AS n FROM revisions").n;
  const lastUpdated =
    one<{ t: string | null }>("SELECT MAX(updated_at) AS t FROM articles").t ?? null;
  return { articles, categories, revisions, lastUpdated };
}

/** Featured article: stable for a whole day, then moves on. */
export function getFeaturedArticle(): ArticleRow | null {
  const db = getDb();
  const slugs = db
    .query<{ slug: string }, []>("SELECT slug FROM articles ORDER BY slug")
    .all();
  if (slugs.length === 0) return null;
  const day = Math.floor(Date.now() / 86_400_000);
  const pick = slugs[day % slugs.length].slug;
  return getArticleBySlug(pick);
}

export function getHomeData(): HomeData {
  const featured = getFeaturedArticle();
  return {
    featured,
    featuredCategories: featured ? categoryRefs(featured.id) : [],
    recent: getRecentArticles(6),
    categories: getCategories(),
    stats: getStats(),
  };
}
