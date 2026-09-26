import { Link, createFileRoute } from "@tanstack/react-router";

import { CategoryChips } from "~/components/layout";
import { formatDate, initial } from "~/lib/format";
import { fetchBrowse } from "~/server-fns";

export const Route = createFileRoute("/browse")({
  loader: async () => fetchBrowse(),
  head: () => ({
    meta: [{ title: "All articles - Openpedia" }],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const { articles, categories, total } = Route.useLoaderData();

  const groups = new Map<string, typeof articles>();
  for (const article of articles) {
    const letter = initial(article.title);
    const bucket = groups.get(letter);
    if (bucket) bucket.push(article);
    else groups.set(letter, [article]);
  }
  const letters = [...groups.keys()].sort();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="border-b border-stone-200 pb-4">
        <p className="section-label">Index</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-900">
          All articles
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          {total} {total === 1 ? "article" : "articles"}, grouped by first letter of the title.
        </p>
      </header>

      <section aria-labelledby="by-category" className="mt-6">
        <h2 id="by-category" className="section-label">
          Jump to a category
        </h2>
        <div className="mt-3">
          <CategoryChips categories={categories} />
        </div>
      </section>

      {letters.length > 0 ? (
        <nav aria-label="Jump to letter" className="mt-6 flex flex-wrap gap-1.5 text-sm">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="rounded border border-stone-300 bg-white px-2 py-0.5 text-stone-700 hover:border-rose-300 hover:bg-rose-50"
            >
              {letter}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="mt-8 space-y-10">
        {letters.map((letter) => (
          <section key={letter} id={`letter-${letter}`} className="scroll-mt-24">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">{letter}</h2>
            <ul className="mt-3 divide-y divide-stone-200 border-t border-stone-200">
              {groups.get(letter)?.map((article) => (
                <li key={article.slug} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <Link
                      to="/wiki/$slug"
                      params={{ slug: article.slug }}
                      className="font-serif text-lg font-semibold text-stone-900 hover:text-rose-900 hover:underline"
                    >
                      {article.title}
                    </Link>
                    <span className="text-xs text-stone-500">
                      updated {formatDate(article.updated_at)}
                    </span>
                  </div>
                  <p className="mt-1 max-w-[70ch] text-sm leading-7 text-stone-600">
                    {article.summary.slice(0, 180)}
                    {article.summary.length > 180 ? "…" : ""}
                  </p>
                  <div className="mt-2">
                    <CategoryChips categories={article.categories} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
