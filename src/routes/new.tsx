import { createFileRoute, redirect } from "@tanstack/react-router";

import { ArticleForm } from "~/components/article-form";
import { Breadcrumbs } from "~/components/layout";
import { fetchCategories, fetchSession } from "~/server-fns";

export const Route = createFileRoute("/new")({
  loader: async () => {
    const [session, { categories }] = await Promise.all([fetchSession(), fetchCategories()]);
    if (!session.user) {
      // Writes need an account: send the visitor to log in and come back here.
      throw redirect({ href: "/login?next=%2Fnew&error=Log%20in%20to%20write%20a%20new%20article." });
    }
    return { categories, editorName: session.user.displayName };
  },
  head: () => ({ meta: [{ title: "New article - Openpedia" }] }),
  component: NewArticlePage,
});

function NewArticlePage() {
  const { categories, editorName } = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs trail={[{ label: "Openpedia", to: "/" }, { label: "New article" }]} />
      <header className="border-b border-stone-200 pb-4">
        <p className="section-label">Write</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-900">
          New article
        </h1>
        <p className="mt-2 max-w-[70ch] text-sm leading-6 text-stone-600">
          Signed in as <span className="font-medium text-stone-800">{editorName}</span>. The web
          address is built from the title, and the article joins the index, search and its categories
          the moment you save it.
        </p>
      </header>

      <ArticleForm
        action="/api/articles/create"
        values={{ title: "", summary: "", body: "", note: "New article", categorySlugs: [] }}
        categories={categories}
        submitLabel="Publish article"
        editorName={editorName}
      />
    </main>
  );
}
