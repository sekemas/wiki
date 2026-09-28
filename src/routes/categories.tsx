import { Link, createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "~/components/layout";
import { fetchCategories } from "~/server-fns";

export const Route = createFileRoute("/categories")({
  loader: async () => fetchCategories(),
  head: () => ({
    meta: [
      { title: "Categories - Openpedia" },
      { name: "description", content: "Every category in Openpedia, with the articles in each one." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories } = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="border-b border-stone-200 pb-4">
        <p className="section-label">Browse</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-900">
          Categories
        </h1>
        <p className="mt-2 max-w-[70ch] text-sm text-stone-600">
          {categories.length} {categories.length === 1 ? "category" : "categories"}. Categories group
          articles by subject and decide what shows up as a related article.
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No categories yet">
            Categories appear as soon as an article is written into one.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <li key={category.slug} className="rounded-lg border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h2 className="font-serif text-lg font-semibold text-stone-900">
                  <Link
                    to="/category/$slug"
                    params={{ slug: category.slug }}
                    className="hover:text-rose-900 hover:underline"
                  >
                    {category.name}
                  </Link>
                </h2>
                <span className="text-xs text-stone-500">
                  {category.articleCount} {category.articleCount === 1 ? "article" : "articles"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-600">{category.description}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-stone-600">
        Looking for a single article? <Link to="/browse" className="text-rose-900 hover:underline">Browse the full index</Link>{" "}
        or <Link to="/search" className="text-rose-900 hover:underline">search</Link>.
      </p>
    </main>
  );
}
