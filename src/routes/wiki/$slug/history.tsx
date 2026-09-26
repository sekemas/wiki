import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { Breadcrumbs, EmptyState } from "~/components/layout";
import { formatDateTime, timeAgo } from "~/lib/format";
import { fetchHistory } from "~/server-fns";

export const Route = createFileRoute("/wiki/$slug/history")({
  loader: async ({ params }) => {
    const history = await fetchHistory({ data: { slug: params.slug } });
    if (!history) throw notFound();
    return history;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `History of ${loaderData?.article.title ?? "article"} - Openpedia` },
      { name: "description", content: "Every recorded revision of this Openpedia article." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { article, revisions } = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        trail={[
          { label: "Openpedia", to: "/" },
          { label: "Browse", to: "/browse" },
          { label: article.title, to: `/wiki/${article.slug}` },
          { label: "History" },
        ]}
      />

      <header className="border-b border-stone-200 pb-4">
        <p className="section-label">Revision history</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-900">
          {article.title}
        </h1>
        <p className="mt-2 max-w-[70ch] text-sm text-stone-600">
          {revisions.length} {revisions.length === 1 ? "revision" : "revisions"} recorded, newest
          first. Every change is kept against the name of the editor who made it and the time it was
          made.
        </p>
        <p className="mt-3 text-sm">
          <Link
            to="/wiki/$slug"
            params={{ slug: article.slug }}
            className="text-rose-900 hover:underline"
          >
            &larr; Back to the article
          </Link>
        </p>
      </header>

      {revisions.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No revisions recorded yet">
            This article has no history rows. It was probably created before history was switched on.
          </EmptyState>
        </div>
      ) : (
        <ol className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
          {revisions.map((revision, index) => (
            <li key={revision.id} className="flex flex-wrap gap-x-6 gap-y-2 py-4">
              <div className="w-40 shrink-0 text-sm">
                <p className="font-medium text-stone-800">{timeAgo(revision.created_at)}</p>
                <p className="text-xs text-stone-500">{formatDateTime(revision.created_at)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium text-stone-900">{revision.editor_name}</span>
                  {index === 0 ? (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[0.7rem] text-amber-900">
                      current
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-stone-700">
                  {revision.note || <span className="text-stone-500">No edit summary</span>}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {revision.title} &middot; {revision.bytes.toLocaleString("en-GB")} bytes of source
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
