import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { Breadcrumbs, CategoryChips } from "~/components/layout";
import { formatDate, timeAgo } from "~/lib/format";
import { Markdown, extractHeadings } from "~/lib/markdown";
import { Route as rootRoute } from "~/routes/__root";
import { fetchArticle } from "~/server-fns";

export const Route = createFileRoute("/wiki/$slug/")({
  loader: async ({ params }) => {
    const page = await fetchArticle({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return page;
  },
  // The URL a save redirects to carries the new revision, so the confirmation
  // can link straight at it.
  validateSearch: (search: Record<string, unknown>) => ({
    saved: typeof search.saved === "string" ? search.saved : undefined,
    created: typeof search.created === "string" ? search.created : undefined,
  }),
  head: ({ loaderData }) => ({
    meta: [
      // An unknown slug renders this route's not-found page, so say that instead
      // of leaving the site's generic title in place.
      {
        title: loaderData
          ? `${loaderData.article.title} - Openpedia`
          : "Page not found - Openpedia",
      },
      { name: "description", content: loaderData?.article.summary.slice(0, 200) ?? "" },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const page = Route.useLoaderData();
  const { saved, created } = Route.useSearch();
  const { session } = rootRoute.useRouteContext();
  const { article, categories, related, lastEditor, revisionCount, knownSlugs } = page;
  const headings = extractHeadings(article.body);
  const toc = headings.filter((_, index) => index < 12);
  const newRevision = saved ?? created;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        trail={[
          { label: "Openpedia", to: "/" },
          { label: "Browse", to: "/browse" },
          ...(categories[0] ? [{ label: categories[0].name, to: `/category/${categories[0].slug}` }] : []),
          { label: article.title },
        ]}
      />

      {newRevision ? (
        <div className="mb-5 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {created ? <p className="font-medium">Your article is published.</p> : null}
          <p className={created ? "mt-1" : ""}>
            {created ? "It" : "Your edit"} was saved as revision{" "}
            <Link
              to="/wiki/$slug/revision/$id"
              params={{ slug: article.slug, id: newRevision }}
              className="font-medium underline hover:no-underline"
            >
              #{newRevision}
            </Link>
            {lastEditor ? ` by ${lastEditor}` : ""}. It may take a moment to appear in search.{" "}
            <Link
              to="/wiki/$slug/history"
              params={{ slug: article.slug }}
              className="underline hover:no-underline"
            >
              See the full history
            </Link>
            .
          </p>
        </div>
      ) : null}

      <header className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-2 text-xs text-stone-500">
          Last edited {formatDate(article.updated_at)}
          {lastEditor ? ` by ${lastEditor}` : ""} ({timeAgo(article.updated_at)}) &middot;{" "}
          {revisionCount} {revisionCount === 1 ? "revision" : "revisions"} &middot;{" "}
          <Link
            to="/wiki/$slug/history"
            params={{ slug: article.slug }}
            className="text-rose-900 hover:underline"
          >
            View history
          </Link>
        </p>
        <p className="mt-3 text-sm">
          {session ? (
            <Link
              to="/wiki/$slug/edit"
              params={{ slug: article.slug }}
              className="inline-block rounded-md border border-stone-300 bg-white px-3 py-1.5 text-stone-800 hover:border-rose-300 hover:bg-rose-50"
            >
              Edit this article
            </Link>
          ) : (
            <Link
              to="/login"
              search={{
                next: `/wiki/${article.slug}/edit`,
                error: "Log in to edit this article.",
                email: undefined,
              }}
              className="inline-block rounded-md border border-stone-300 bg-white px-3 py-1.5 text-stone-800 hover:border-rose-300 hover:bg-rose-50"
            >
              Log in to edit
            </Link>
          )}
        </p>
      </header>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article>
          <p className="max-w-[70ch] font-serif text-[1.1875rem] leading-9 font-medium text-stone-900">
            {article.summary}
          </p>

          {toc.length >= 3 ? (
            <nav
              aria-labelledby="toc-heading"
              className="mt-8 inline-block w-full max-w-[70ch] rounded-lg border border-stone-200 bg-white px-5 py-4"
            >
              <h2 id="toc-heading" className="section-label">
                Contents
              </h2>
              <ol className="mt-2 space-y-1 text-sm">
                {toc.map((heading, index) => (
                  <li key={heading.id} className="flex gap-2">
                    <span className="w-5 shrink-0 text-right text-stone-400">{index + 1}.</span>
                    <a href={`#${heading.id}`} className="text-blue-800 hover:underline">
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className="mt-8">
            <Markdown source={article.body} knownSlugs={new Set(knownSlugs)} />
          </div>

          <footer className="mt-10 border-t border-stone-200 pt-5">
            <h2 className="section-label">Categories</h2>
            <div className="mt-2">
              <CategoryChips categories={categories} />
            </div>
            <p className="mt-5 text-xs text-stone-500">
              Created {formatDate(article.created_at)}. See the{" "}
              <Link
                to="/wiki/$slug/history"
                params={{ slug: article.slug }}
                className="text-rose-900 hover:underline"
              >
                revision history
              </Link>{" "}
              for every version of this article.
            </p>
          </footer>
        </article>

        <aside aria-labelledby="related-heading" className="space-y-4">
          <h2 id="related-heading" className="section-label">
            Related articles
          </h2>
          {related.length > 0 ? (
            <ul className="space-y-3">
              {related.map((item) => (
                <li key={item.slug} className="rounded-lg border border-stone-200 bg-white p-4">
                  <Link
                    to="/wiki/$slug"
                    params={{ slug: item.slug }}
                    className="font-serif text-base font-semibold text-stone-900 hover:text-rose-900 hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs leading-6 text-stone-600">
                    {item.summary.slice(0, 140)}
                    {item.summary.length > 140 ? "…" : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-600">
              No related articles yet. Browse the{" "}
              <Link to="/browse" className="text-rose-900 hover:underline">
                article index
              </Link>
              .
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
