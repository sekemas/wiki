import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { Breadcrumbs, EmptyState } from "~/components/layout";
import { formatDate } from "~/lib/format";
import { fetchCategory } from "~/server-fns";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const data = await fetchCategory({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category.name ?? "Category"} - Openpedia` },
      { name: "description", content: loaderData?.category.description ?? "" },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { category, articles } = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        trail={[
          { label: "Openpedia", to: "/" },
          { label: "Browse", to: "/browse" },
          { label: category.name },
        ]}
      />

      <header className="border-b border-stone-200 pb-4">
        <p className="section-label">Category</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-900">
          {category.name}
        </h1>
        <p className="mt-2 max-w-[70ch] text-stone-700">{category.description}</p>
        <p className="mt-2 text-sm text-stone-500">
          {articles.length} {articles.length === 1 ? "article" : "articles"} in this category.
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No articles in this category yet">
            Articles are added to a category by their editors.{" "}
            <Link to="/browse" className="text-rose-900 underline">
              Browse everything
            </Link>{" "}
            in the meantime.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
          {articles.map((article) => (
            <li key={article.slug} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <Link
                  to="/wiki/$slug"
                  params={{ slug: article.slug }}
                  className="font-serif text-xl font-semibold text-stone-900 hover:text-rose-900 hover:underline"
                >
                  {article.title}
                </Link>
                <span className="text-xs text-stone-500">updated {formatDate(article.updated_at)}</span>
              </div>
              <p className="mt-1 max-w-[70ch] text-sm leading-7 text-stone-600">{article.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
