import { Link, createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { ArticleForm } from "~/components/article-form";
import { Breadcrumbs } from "~/components/layout";
import { Notice } from "~/components/forms";
import { fetchEditData } from "~/server-fns";

export const Route = createFileRoute("/wiki/$slug/edit")({
  loader: async ({ params }) => {
    const data = await fetchEditData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    if (!data.signedIn) {
      // Editing needs an account. Remember where the visitor was going.
      const next = encodeURIComponent(`/wiki/${params.slug}/edit`);
      throw redirect({ href: `/login?next=${next}&error=Log%20in%20to%20edit%20this%20article.` });
    }
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Editing ${loaderData?.article.title ?? "article"} - Openpedia` }],
  }),
  component: EditArticlePage,
});

function EditArticlePage() {
  const { article, categories, editorName } = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        trail={[
          { label: "Openpedia", to: "/" },
          { label: "Browse", to: "/browse" },
          { label: article.title, to: `/wiki/${article.slug}` },
          { label: "Edit" },
        ]}
      />
      <header className="border-b border-stone-200 pb-4">
        <p className="section-label">Edit</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-900">
          {article.title}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Signed in as <span className="font-medium text-stone-800">{editorName}</span>. Saving keeps
          the previous version: the{" "}
          <Link
            to="/wiki/$slug/history"
            params={{ slug: article.slug }}
            className="text-rose-900 hover:underline"
          >
            revision history
          </Link>{" "}
          keeps every version of this article under the name of the editor who wrote it.
        </p>
      </header>

      <div className="mt-5">
        <Notice>
          Plain Markdown in the text box. Anything you leave out of this form stays as it was — there
          is no way to lose the article by mistake.
        </Notice>
      </div>

      <ArticleForm
        action="/api/articles/update"
        values={{
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          body: article.body,
          note: "",
          categorySlugs: article.categorySlugs,
        }}
        categories={categories}
        submitLabel="Save changes"
        editorName={editorName}
      />
    </main>
  );
}
