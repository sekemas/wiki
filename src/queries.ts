/**
 * Read queries for Openpedia, on PostgreSQL through Prisma.
 *
 * Server-only — route code calls these through the server functions in
 * `src/server-fns.ts`, which import this module lazily so Prisma can never be
 * pulled into a client bundle.
 *
 * This module is also the mapping boundary: Prisma models are never handed to
 * React. Each row is converted to the plain, dependency-free shape declared in
 * `src/types.ts`, with timestamps as ISO strings, so components only ever see
 * serialisable data. Public reads only ever return PUBLISHED articles.
 */
import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
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

const iso = (value: Date): string => value.toISOString();

/** Categories come back as a join table; this is the include every read uses. */
const withCategories = {
  categories: { include: { category: { select: { slug: true, name: true } } } },
} satisfies Prisma.ArticleInclude;

type ArticleWithCategories = Prisma.ArticleGetPayload<{ include: typeof withCategories }>;

function categoriesOf(article: ArticleWithCategories): CategoryRef[] {
  return article.categories
    .map((link) => ({ slug: link.category.slug, name: link.category.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function toArticleRow(article: ArticleWithCategories): ArticleRow {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    body: article.body,
    created_at: iso(article.createdAt),
    updated_at: iso(article.updatedAt),
  };
}

function decorate(articles: ArticleWithCategories[]): ArticleSummary[] {
  return articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    updated_at: iso(article.updatedAt),
    categories: categoriesOf(article),
  }));
}

/** A–Z orders are case-insensitive, which the database collation is not. */
function byTitle(a: { title: string }, b: { title: string }): number {
  return a.title.localeCompare(b.title, "en", { sensitivity: "base" });
}

export async function getArticleBySlug(slug: string): Promise<ArticleRow | null> {
  const article = await prisma.article.findFirst({
    where: { slug: { equals: slug, mode: "insensitive" }, status: "PUBLISHED" },
    include: withCategories,
  });
  return article ? toArticleRow(article) : null;
}

export async function allSlugs(): Promise<string[]> {
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  return rows.map((row) => row.slug);
}

export async function getRecentArticles(limit = 6): Promise<ArticleSummary[]> {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: withCategories,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return decorate(articles);
}

export async function getAllArticles(): Promise<ArticleSummary[]> {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: withCategories,
  });
  return decorate(articles).sort(byTitle);
}

export async function getCategories(): Promise<CategoryWithCount[]> {
  const categories = await prisma.category.findMany({
    include: {
      // Counted through the join table, published articles only.
      _count: { select: { articles: { where: { article: { status: "PUBLISHED" } } } } },
    },
  });
  return categories
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description,
      articleCount: category._count.articles,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  return prisma.category.findFirst({
    where: { slug: { equals: slug, mode: "insensitive" } },
    select: { id: true, slug: true, name: true, description: true },
  });
}

export async function getArticlesInCategory(categoryId: number): Promise<ArticleSummary[]> {
  const links = await prisma.articleCategory.findMany({
    where: { categoryId, article: { status: "PUBLISHED" } },
    include: { article: { include: withCategories } },
  });
  return decorate(links.map((link) => link.article)).sort(byTitle);
}

export async function getRevisions(articleId: number): Promise<RevisionRow[]> {
  const revisions = await prisma.revision.findMany({
    where: { articleId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return revisions.map((revision) => ({
    id: revision.id,
    article_id: revision.articleId,
    title: revision.title,
    body: revision.body,
    editor_name: revision.editorName,
    note: revision.note,
    created_at: iso(revision.createdAt),
  }));
}

/** One revision of one article, or null (the pair must match). */
export async function getRevision(
  articleId: number,
  revisionId: number,
): Promise<RevisionRow | null> {
  const revision = await prisma.revision.findFirst({ where: { id: revisionId, articleId } });
  if (!revision) return null;
  return {
    id: revision.id,
    article_id: revision.articleId,
    title: revision.title,
    body: revision.body,
    editor_name: revision.editorName,
    note: revision.note,
    created_at: iso(revision.createdAt),
  };
}

/** Everything the edit form starts from: the current article and its categories. */
export async function getArticleForEdit(slug: string): Promise<{
  slug: string;
  title: string;
  summary: string;
  body: string;
  categorySlugs: string[];
} | null> {
  const article = await prisma.article.findFirst({
    where: { slug: { equals: slug, mode: "insensitive" } },
    include: withCategories,
  });
  if (!article) return null;
  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    body: article.body,
    categorySlugs: article.categories.map((link) => link.category.slug),
  };
}

export async function getArticlePage(slug: string): Promise<ArticlePage | null> {
  const article = await prisma.article.findFirst({
    where: { slug: { equals: slug, mode: "insensitive" }, status: "PUBLISHED" },
    include: withCategories,
  });
  if (!article) return null;

  const links = await prisma.articleCategory.findMany({
    where: {
      articleId: { not: article.id },
      article: { status: "PUBLISHED" },
      category: { articles: { some: { articleId: article.id } } },
    },
    include: { article: { select: { slug: true, title: true, summary: true, updatedAt: true } } },
    orderBy: { article: { updatedAt: "desc" } },
  });

  const seen = new Set<string>();
  const related: { slug: string; title: string; summary: string }[] = [];
  for (const link of links) {
    if (seen.has(link.article.slug)) continue;
    seen.add(link.article.slug);
    related.push({
      slug: link.article.slug,
      title: link.article.title,
      summary: link.article.summary,
    });
    if (related.length === 5) break;
  }

  const revisions = await getRevisions(article.id);

  return {
    article: toArticleRow(article),
    categories: categoriesOf(article),
    related,
    lastEditor: revisions[0]?.editor_name ?? null,
    lastNote: revisions[0]?.note ?? null,
    revisionCount: revisions.length,
    knownSlugs: await allSlugs(),
  };
}

function plainText(markdown: string): string {
  return markdown
    .replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_all, slug: string, label?: string) => label ?? slug,
    )
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

export async function searchArticles(rawQuery: string): Promise<SearchResults> {
  const query = rawQuery.trim();
  if (query.length === 0) return { query, count: 0, hits: [] };

  const contains = { contains: query, mode: "insensitive" as const };
  const rows = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ title: contains }, { summary: contains }, { body: contains }],
    },
    select: { slug: true, title: true, summary: true, body: true, updatedAt: true },
  });

  const hits = rows
    .map((row) => {
      const matchInTitle = row.title.toLowerCase().includes(query.toLowerCase());
      return {
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        updated_at: iso(row.updatedAt),
        matchInTitle,
        snippet: matchInTitle
          ? plainText(row.summary).slice(0, 180)
          : snippetAround(row.body, query),
      };
    })
    // Title matches first, then shortest title, then A–Z. The GIN index from the
    // search-index migration is what the ranked version of this will use.
    .sort(
      (a, b) =>
        Number(b.matchInTitle) - Number(a.matchInTitle) ||
        a.title.length - b.title.length ||
        byTitle(a, b),
    );

  return { query, count: hits.length, hits };
}

export async function getStats() {
  const [articles, categories, revisions, newest] = await Promise.all([
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.category.count(),
    prisma.revision.count({ where: { article: { status: "PUBLISHED" } } }),
    prisma.article.aggregate({ where: { status: "PUBLISHED" }, _max: { updatedAt: true } }),
  ]);
  return {
    articles,
    categories,
    revisions,
    lastUpdated: newest._max.updatedAt ? iso(newest._max.updatedAt) : null,
  };
}

/** Featured article: stable for a whole day, then moves on. */
export async function getFeaturedArticle(): Promise<ArticleRow | null> {
  const slugs = await allSlugs();
  if (slugs.length === 0) return null;
  const day = Math.floor(Date.now() / 86_400_000);
  return getArticleBySlug(slugs[day % slugs.length]);
}

export async function getHomeData(): Promise<HomeData> {
  // A database that has been migrated but never seeded would render an empty
  // front page; top it up from the seed content instead (one COUNT when the
  // encyclopedia already has articles).
  const { seedIfEmpty } = await import("./seed");
  await seedIfEmpty();

  const featured = await getFeaturedArticle();
  const [recent, categories, stats] = await Promise.all([
    getRecentArticles(6),
    getCategories(),
    getStats(),
  ]);

  const featuredArticle = featured
    ? await prisma.article.findFirst({
        where: { slug: featured.slug },
        include: withCategories,
      })
    : null;

  return {
    featured,
    featuredCategories: featuredArticle ? categoriesOf(featuredArticle) : [],
    recent,
    categories,
    stats,
  };
}
