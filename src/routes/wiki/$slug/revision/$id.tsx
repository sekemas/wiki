import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { Breadcrumbs } from "~/components/layout";
import { Notice } from "~/components/forms";
import { formatDateTime, timeAgo } from "~/lib/format";
import { Markdown } from "~/lib/markdown";
import { fetchRevisionView } from "~/server-fns";

export const Route = createFileRoute("/wiki/$slug/revision/$id")({
  loader: async ({ params }) => {
    const view = await fetchRevisionView({ data: { slug: params.slug, id: Number(params.id) } });
    if (!view) throw notFound();
    return view;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Old revision of ${loaderData.article.title} - Openpedia`
          : "Page not found - Openpedia",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RevisionPage,
});

function RevisionPage() {
  const { article, revision, isCurrent, knownSlugs } = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        trail={[
          { label: "Openpedia", to: "/" },
          { label: article.title, to: `/wiki/${article.slug}` },
          { label: "History", to: `/wiki/${article.slug}/history` },
          { label: `Revision ${String(revision.id)}` },
        ]}
      />

      <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">
          This is {isCurrent ? "the current revision" : "an old revision"} of{" "}
          <span className="font-semibold">{article.title}</span>, saved by {revision.editor_name} on{" "}
          {formatDateTime(revision.created_at)} ({timeAgo(revision.created_at)}).
        </p>
        <p className="mt-1">
          It is read-only{isCurrent ? "." : ", and may differ from the article as it stands now. "}
          {isCurrent ? null : (
            <Link
              to="/wiki/$slug"
              params={{ slug: article.slug }}
              className="underline hover:no-underline"
            >
              Read the current article
            </Link>
          )}
        </p>
      </div>

      <article className="mt-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
          {revision.title}
        </h1>
        <p className="mt-2 text-xs text-stone-500">
          Revision {revision.id} &middot; {revision.body.length.toLocaleString("en-GB")} bytes of
          source &middot;{" "}
          {revision.note.length > 0 ? revision.note : <span className="italic">no edit note</span>}
        </p>
        <div className="mt-6 rounded-lg border border-stone-200 bg-white px-5 py-4">
          <Markdown source={revision.body} knownSlugs={new Set(knownSlugs)} />
        </div>
      </article>

      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
        <Link
          to="/wiki/$slug"
          params={{ slug: article.slug }}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-stone-800 hover:border-rose-300 hover:bg-rose-50"
        >
          Back to the current article
        </Link>
        <Link
          to="/wiki/$slug/history"
          params={{ slug: article.slug }}
          className="text-rose-900 hover:underline"
        >
          All revisions
        </Link>
      </div>

      <div className="mt-6">
        <Notice>
          Old revisions are kept forever and cannot be edited. To change the article, open the current
          version and edit that.
        </Notice>
      </div>
    </main>
  );
}
