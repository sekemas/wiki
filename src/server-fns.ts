/**
 * Server functions: the only way route code reaches the database.
 *
 * Every page reads its data through one of these, so nothing that talks to
 * SQLite is ever bundled for the browser, and the same code path runs whether
 * the page is server-rendered on first load or navigated to in the browser.
 */
import { createServerFn } from "@tanstack/react-start";

import { currentUser } from "./auth";
import {
  allSlugs,
  getArticleForEdit,
  getArticlePage,
  getAllArticles,
  getArticleBySlug,
  getCategories,
  getCategoryBySlug,
  getArticlesInCategory,
  getHomeData,
  getRevision,
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

/* --------------------------------------------------------- accounts & editing */

const asSlugAndId = (input: unknown): { slug: string; id: number } => {
  const raw = input as { slug?: unknown; id?: unknown };
  return {
    slug: typeof raw?.slug === "string" ? raw.slug : "",
    id: typeof raw?.id === "number" ? raw.id : Number(raw?.id ?? 0),
  };
};

/**
 * Who is signed in, if anyone. Read on every page for the header, and by the
 * article page to decide between "Edit" and "Log in to edit". The session is
 * resolved here on the server from the cookie — the browser never sends a user
 * id anywhere.
 */
export const fetchSession = createServerFn({ method: "GET" }).handler(async () => {
  const user = currentUser();
  return {
    user: user ? { id: user.id, displayName: user.displayName, email: user.email } : null,
    canEdit: user !== null,
  };
});

/** The category list, for the article forms and the category index. */
export const fetchCategories = createServerFn({ method: "GET" }).handler(async () => ({
  categories: getCategories(),
}));

/** Fields for the edit form: the current article plus every category to choose from. */
export const fetchEditData = createServerFn({ method: "GET" })
  .inputValidator(asSlug)
  .handler(async ({ data }) => {
    const user = currentUser();
    const article = getArticleForEdit(data.slug);
    if (!article) return null;
    return {
      article,
      categories: getCategories().map((category) => ({ slug: category.slug, name: category.name })),
      signedIn: user !== null,
      editorName: user?.displayName ?? null,
    };
  });

/** One stored revision, for the read-only old-revision page. */
export const fetchRevisionView = createServerFn({ method: "GET" })
  .inputValidator(asSlugAndId)
  .handler(async ({ data }) => {
    const article = getArticleBySlug(data.slug);
    if (!article) return null;
    const revision = getRevision(article.id, data.id);
    if (!revision) return null;
    const revisions = getRevisions(article.id);
    return {
      article: { slug: article.slug, title: article.title },
      revision: {
        id: revision.id,
        title: revision.title,
        body: revision.body,
        editor_name: revision.editor_name,
        note: revision.note,
        created_at: revision.created_at,
      },
      isCurrent: revisions[0]?.id === revision.id,
      knownSlugs: allSlugs(),
    };
  });

