/**
 * Server functions: the only way route code reaches the database.
 *
 * Every page reads its data through one of these. The query modules are
 * imported *inside* each handler, so the Prisma client — and the query code that
 * uses it — belongs only to the server bundle: nothing that touches PostgreSQL
 * can be pulled into a browser build, whether the page is server-rendered on
 * first load or navigated to in the browser.
 */
import { createServerFn } from "@tanstack/react-start";

const asSlug = (input: unknown): { slug: string } => ({
  slug:
    typeof (input as { slug?: unknown })?.slug === "string" ? (input as { slug: string }).slug : "",
});

export const fetchHome = createServerFn({ method: "GET" }).handler(async () => {
  const { getHomeData } = await import("./queries");
  return getHomeData();
});

export const fetchArticle = createServerFn({ method: "GET" })
  .inputValidator(asSlug)
  .handler(async ({ data }) => {
    const { getArticlePage } = await import("./queries");
    return getArticlePage(data.slug);
  });

export const fetchHistory = createServerFn({ method: "GET" })
  .inputValidator(asSlug)
  .handler(async ({ data }) => {
    const { getArticleBySlug, getRevisions } = await import("./queries");
    const article = await getArticleBySlug(data.slug);
    if (!article) return null;
    const revisions = await getRevisions(article.id);
    return {
      article: { slug: article.slug, title: article.title, summary: article.summary },
      revisions: revisions.map((r) => ({
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
  const { getAllArticles, getCategories } = await import("./queries");
  const [articles, categories] = await Promise.all([getAllArticles(), getCategories()]);
  return { articles, categories, total: articles.length };
});

export const fetchCategory = createServerFn({ method: "GET" })
  .inputValidator(asSlug)
  .handler(async ({ data }) => {
    const { getArticlesInCategory, getCategoryBySlug } = await import("./queries");
    const category = await getCategoryBySlug(data.slug);
    if (!category) return null;
    return { category, articles: await getArticlesInCategory(category.id) };
  });

export const fetchSearch = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): { q: string } => ({
    q: typeof (input as { q?: unknown })?.q === "string" ? (input as { q: string }).q : "",
  }))
  .handler(async ({ data }) => {
    const { searchArticles } = await import("./queries");
    return searchArticles(data.q);
  });
