import { Link, createFileRoute } from "@tanstack/react-router";

import { SearchForm } from "~/components/layout";
import { CategoryChips } from "~/components/layout";
import { formatDate, timeAgo } from "~/lib/format";
import { fetchHome } from "~/server-fns";

export const Route = createFileRoute("/")({
  loader: async () => fetchHome(),
  component: HomePage,
});

function HomePage() {
  const { featured, featuredCategories, recent, categories, stats } = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="border-b border-stone-200 pb-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Openpedia
        </h1>
        <p className="mt-3 max-w-[70ch] font-serif text-lg leading-8 text-stone-700">
          An encyclopedia written for this project: original articles on subjects worth knowing
          something about, each one kept in a public revision history.
        </p>
        <div className="mt-6 max-w-2xl">
          <SearchForm size="lg" />
        </div>
        <p className="mt-3 text-sm text-stone-500">
          {stats.articles} articles in {stats.categories} categories &middot; {stats.revisions}{" "}
          revisions recorded
          {stats.lastUpdated ? ` · last edit ${timeAgo(stats.lastUpdated)}` : ""}
        </p>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-10">
          {featured ? (
            <section aria-labelledby="featured-heading">
              <h2 id="featured-heading" className="section-label">
                From the encyclopedia
              </h2>
              <article className="mt-3 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
                <h3 className="font-serif text-3xl font-semibold text-stone-900">
                  <Link
                    to="/wiki/$slug"
                    params={{ slug: featured.slug }}
                    className="hover:text-rose-900 hover:underline"
                  >
                    {featured.title}
                  </Link>
                </h3>
                <p className="mt-3 max-w-[70ch] font-serif text-[1.0625rem] leading-8 text-stone-700">
                  {featured.summary}
                </p>
                <div className="mt-4">
                  <CategoryChips categories={featuredCategories} />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                  <Link
                    to="/wiki/$slug"
                    params={{ slug: featured.slug }}
                    className="rounded-md bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700"
                  >
                    Read the article
                  </Link>
                  <span className="text-stone-500">
                    Last edited {formatDate(featured.updated_at)}
                  </span>
                </div>
              </article>
            </section>
          ) : null}

          <section aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="section-label">
              Recently updated
            </h2>
            <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200">
              {recent.map((article) => (
                <li key={article.slug} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <Link
                      to="/wiki/$slug"
                      params={{ slug: article.slug }}
                      className="font-serif text-xl font-semibold text-stone-900 hover:text-rose-900 hover:underline"
                    >
                      {article.title}
                    </Link>
                    <span className="text-xs text-stone-500">
                      {formatDate(article.updated_at)}
                    </span>
                  </div>
                  <p className="mt-1 max-w-[70ch] text-sm leading-7 text-stone-600">
                    {article.summary.slice(0, 220)}
                    {article.summary.length > 220 ? "…" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside aria-labelledby="categories-heading" className="space-y-6">
          <section>
            <h2 id="categories-heading" className="section-label">
              Categories
            </h2>
            <ul className="mt-3 space-y-3">
              {categories.map((category) => (
                <li key={category.slug} className="rounded-lg border border-stone-200 bg-white p-4">
                  <Link
                    to="/category/$slug"
                    params={{ slug: category.slug }}
                    className="font-serif text-lg font-semibold text-stone-900 hover:text-rose-900 hover:underline"
                  >
                    {category.name}
                  </Link>
                  <p className="mt-1 text-xs leading-6 text-stone-600">{category.description}</p>
                  <p className="mt-2 text-xs text-stone-500">
                    {category.articleCount} {category.articleCount === 1 ? "article" : "articles"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="section-label">Keep reading</h2>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link to="/browse" className="text-rose-900 hover:underline">
                  All articles A–Z
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-rose-900 hover:underline">
                  Search titles and text
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
