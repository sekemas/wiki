/** Shared, dependency-free types. Safe to import from route code and components. */

export type ArticleRow = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type ArticleSummary = {
  slug: string;
  title: string;
  summary: string;
  updated_at: string;
  categories: CategoryRef[];
};

export type CategoryRef = {
  slug: string;
  name: string;
};

export type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
};

export type CategoryWithCount = CategoryRef & {
  description: string;
  articleCount: number;
};

export type RevisionRow = {
  id: number;
  article_id: number;
  title: string;
  body: string;
  editor_name: string;
  note: string;
  created_at: string;
};

export type ArticlePage = {
  article: ArticleRow;
  categories: CategoryRef[];
  related: { slug: string; title: string; summary: string }[];
  lastEditor: string | null;
  lastNote: string | null;
  revisionCount: number;
  knownSlugs: string[];
};

export type SearchHit = {
  slug: string;
  title: string;
  summary: string;
  updated_at: string;
  matchInTitle: boolean;
  snippet: string;
};

export type SearchResults = {
  query: string;
  count: number;
  hits: SearchHit[];
};

export type HomeData = {
  featured: ArticleRow | null;
  featuredCategories: CategoryRef[];
  recent: ArticleSummary[];
  categories: CategoryWithCount[];
  stats: { articles: number; categories: number; revisions: number; lastUpdated: string | null };
};
