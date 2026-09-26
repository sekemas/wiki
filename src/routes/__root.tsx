import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import { EmptyState, SearchForm, SiteFooter, SiteHeader } from "~/components/layout";
import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Openpedia" },
      {
        name: "description",
        content:
          "Openpedia is an open encyclopedia: browse, search and read original articles with a full revision history.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: NotFoundPage,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function NotFoundPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <p className="section-label">Error 404</p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
        That page isn&rsquo;t here
      </h1>
      <p className="mt-3 max-w-[70ch] text-stone-700">
        Openpedia has no article or page at this address. It may have been renamed, or the link that
        brought you here may be mistyped. You can search the encyclopedia below, or start from the
        article index.
      </p>
      <div className="mt-6 max-w-xl">
        <SearchForm size="lg" />
      </div>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          to="/"
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-stone-800 hover:border-rose-300 hover:bg-rose-50"
        >
          Openpedia home
        </Link>
        <Link
          to="/browse"
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-stone-800 hover:border-rose-300 hover:bg-rose-50"
        >
          Browse all articles
        </Link>
      </div>
      <div className="mt-10">
        <EmptyState title="Nothing to show">
          If you followed a link from an article, the page it pointed to does not exist yet.
        </EmptyState>
      </div>
    </main>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-dvh flex-col bg-[#fcfbf7]">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Scripts />
      </body>
    </html>
  );
}
