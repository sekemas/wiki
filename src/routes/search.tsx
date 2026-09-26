import { Link, createFileRoute } from "@tanstack/react-router";

import { EmptyState, SearchForm } from "~/components/layout";
import { formatDate } from "~/lib/format";
import { fetchSearch } from "~/server-fns";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q: string } => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ deps }) => fetchSearch({ data: { q: deps.q } }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title:
          loaderData && loaderData.query.trim().length > 0
            ? `Search: ${loaderData.query.trim()} - Openpedia`
            : "Search - Openpedia",
      },
    ],
  }),
  component: SearchPage,
});

/** Wrap the matched part of a string in <mark> without any HTML injection. */
function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (needle.length === 0) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let at = lowerText.indexOf(lowerNeedle);
  let key = 0;
  while (at >= 0) {
    if (at > cursor) parts.push(text.slice(cursor, at));
    parts.push(
      <mark key={`m${String(key++)}`} className="bg-amber-200/70 text-stone-900">
        {text.slice(at, at + needle.length)}
      </mark>,
    );
    cursor = at + needle.length;
    at = lowerText.indexOf(lowerNeedle, cursor);
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function SearchPage() {
  const { query, count, hits } = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="border-b border-stone-200 pb-4">
        <p className="section-label">Search</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-900">
          {query.trim().length > 0 ? `Results for “${query.trim()}”` : "Search Openpedia"}
        </h1>
        <div className="mt-4 max-w-2xl">
          <SearchForm size="lg" defaultValue={query} />
        </div>
        <p className="mt-3 text-sm text-stone-600">
          {query.trim().length === 0
            ? "Searches article titles, summaries and full text."
            : `${count} ${count === 1 ? "article matches" : "articles match"} your search.`}
        </p>
      </header>

      {query.trim().length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Type a word to search">
            Try a subject — <em>lighthouse</em>, <em>coffee</em>, <em>spore</em> — or part of an
            article title.
          </EmptyState>
        </div>
      ) : count === 0 ? (
        <div className="mt-8">
          <EmptyState title={`No articles match “${query.trim()}”`}>
            <p>
              Check the spelling, or try a shorter word. You can also{" "}
              <Link to="/browse" className="text-rose-900 underline">
                browse every article
              </Link>
              .
            </p>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
          {hits.map((hit) => (
            <li key={hit.slug} className="py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <Link
                  to="/wiki/$slug"
                  params={{ slug: hit.slug }}
                  className="font-serif text-xl font-semibold text-stone-900 hover:text-rose-900 hover:underline"
                >
                  <Highlight text={hit.title} query={query} />
                </Link>
                <span className="text-xs text-stone-500">
                  {hit.matchInTitle ? "title match · " : ""}
                  updated {formatDate(hit.updated_at)}
                </span>
              </div>
              <p className="mt-1 max-w-[70ch] text-sm leading-7 text-stone-700">
                <Highlight text={hit.snippet} query={query} />
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
