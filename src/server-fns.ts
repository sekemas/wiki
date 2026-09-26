/**
 * Server functions: the only way route code reaches the database.
 *
 * Every page reads its data through one of these, so nothing that talks to
 * SQLite is ever bundled for the browser, and the same code path runs whether
 * the page is server-rendered on first load or navigated to in the browser.
 */
import { createServerFn } from "@tanstack/react-start";

import {
  getArticlePage,
  getAllArticles,
  getArticleBySlug,
  getCategories,
  getCategoryBySlug,
  getArticlesInCategory,
  getHomeData,
  getRevisions,
  searchArticles,
} from "./queries";

const asSlug = (input: unknown): { slug: string } => ({
  slug: typeof (input as { slug?: unknown })?.slug === "string" ? (input as { slug: string }).slug : "",
});

export const fetchHome = createServerFn({ method: "GET" }).handler(async () => getHomeData());

export const fetchArticle = createServerFn({ method: "GET" })
  .inputValidator(asSlug)
  .handler(async ({ data }) => getArticlePage(data.slug));

export const fetchHistory = createServerFn({ method: "GET" })
  .inputValidator(asSlug)
  .handler(async ({ data }) => {
    const article = getArticleBySlug(data.slug);
    if (!article) return null;
    return {
      article: { slug: article.slug, title: article.title, summary: article.summary },
      revisions: getRevisions(article.id).map((r) => ({
        id: r.id,
        title: r.title,
        editor_name: r.editor_name,
        note: r.note,
        created_at: r.created_at,
        bytes: r.body.length,
      })),
    };
  });

export const fetchBrowse = createServerFn({ method: "GET" }).handler(async () => {
  const articles = getAllArticles();
  return { articles, categories: getCategories(), total: articles.length };
});

export const fetchCategory = createServerFn({ method: "GET" })
  .inputValidator(asSlug)
  .handler(async ({ data }) => {
    const category = getCategoryBySlug(data.slug);
    if (!category) return null;
    return { category, articles: getArticlesInCategory(category.id) };
  });

export const fetchSearch = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): { q: string } => ({
    q: typeof (input as { q?: unknown })?.q === "string" ? (input as { q: string }).q : "",
  }))
  .handler(async ({ data }) => searchArticles(data.q));
