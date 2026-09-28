import { Link } from "@tanstack/react-router";

import type { CategoryRef } from "~/types";

/** Plain GET form — works without JavaScript, and matches the /search route. */
export function SearchForm({
  defaultValue = "",
  size = "md",
}: {
  defaultValue?: string;
  size?: "md" | "lg";
}) {
  const large = size === "lg";
  return (
    <form action="/search" method="get" role="search" className="flex w-full items-stretch gap-2">
      <label className="sr-only" htmlFor="site-search">
        Search Openpedia
      </label>
      <input
        key={defaultValue}
        id="site-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search articles"
        autoComplete="off"
        className={
          large
            ? "min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-4 py-3 text-base shadow-sm outline-none placeholder:text-stone-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            : "min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm outline-none placeholder:text-stone-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        }
      />
      <button
        type="submit"
        className={
          large
            ? "shrink-0 rounded-md bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-700"
            : "shrink-0 rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700"
        }
      >
        Search
      </button>
    </form>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-stone-700 hover:text-rose-900 hover:underline"
      activeProps={{ className: "font-semibold text-rose-900" }}
    >
      {children}
    </Link>
  );
}

export function SiteHeader({ session }: { session: { displayName: string } | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#fcfbf7]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
            Openpedia
          </span>
          <span className="hidden text-xs text-stone-500 sm:inline">the open encyclopedia</span>
        </Link>
        <nav
          aria-label="Main"
          className="order-3 -mt-1 flex w-full gap-4 text-sm sm:order-none sm:mt-0 sm:w-auto"
        >
          <NavLink to="/browse">Browse</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/search">Search</NavLink>
        </nav>
        <div className="ml-auto flex w-full items-center gap-4 sm:w-auto">
          <div className="order-4 hidden w-full sm:order-none sm:block sm:w-64">
            <SearchForm />
          </div>
          <AccountMenu session={session} />
        </div>
      </div>
    </header>
  );
}

/**
 * The account part of the header: "Log in / Sign up" for a visitor, and the
 * editor's name plus "Log out" when signed in. Who is signed in is decided on
 * the server (see `__root.tsx`), so this only renders what it is told.
 */
function AccountMenu({ session }: { session: { displayName: string } | null }) {
  if (!session) {
    return (
      <p className="flex shrink-0 items-center gap-3 text-sm whitespace-nowrap">
        <Link to="/login" className="text-stone-700 hover:text-rose-900 hover:underline">
          Log in
        </Link>
        <Link
          to="/signup"
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-stone-800 hover:border-rose-300 hover:bg-rose-50"
        >
          Sign up
        </Link>
      </p>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-3 text-sm whitespace-nowrap">
      <Link
        to="/new"
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-stone-800 hover:border-rose-300 hover:bg-rose-50"
      >
        New article
      </Link>
      <span className="text-stone-700">
        <span className="text-stone-500">Signed in as</span>{" "}
        <span className="font-medium text-stone-900">{session.displayName}</span>
      </span>
      {/* A plain POST: logging out deletes the session row, not just the cookie. */}
      <form method="post" action="/api/auth/logout">
        <button
          type="submit"
          className="text-stone-700 hover:text-rose-900 hover:underline"
        >
          Log out
        </button>
      </form>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-stone-600 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="font-serif text-lg font-semibold text-stone-800">Openpedia</span>
          <Link to="/browse" className="hover:text-rose-900 hover:underline">
            All articles
          </Link>
          <Link to="/search" className="hover:text-rose-900 hover:underline">
            Search
          </Link>
          <Link to="/wiki/celestial-navigation" className="hover:text-rose-900 hover:underline">
            Featured article
          </Link>
        </div>
        <p className="max-w-[70ch] text-xs leading-6 text-stone-500">
          Openpedia is an independent encyclopedia: its articles are written for this project and
          its software is its own. Every change is kept in a public revision history under the name
          of the person who made it.
        </p>
      </div>
    </footer>
  );
}

export function CategoryChips({ categories }: { categories: CategoryRef[] }) {
  if (categories.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2 text-sm">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            to="/category/$slug"
            params={{ slug: category.slug }}
            className="inline-block rounded-full border border-stone-300 bg-white px-3 py-0.5 text-stone-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-900"
          >
            {category.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Breadcrumbs({ trail }: { trail: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-stone-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((crumb, index) => (
          <li key={`${crumb.label}-${String(index)}`} className="flex items-center gap-1.5">
            {crumb.to ? (
              <Link to={crumb.to} className="hover:text-rose-900 hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-stone-700">{crumb.label}</span>
            )}
            {index < trail.length - 1 ? <span aria-hidden="true">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white/70 px-5 py-8 text-center">
      <p className="font-serif text-lg text-stone-800">{title}</p>
      {children ? <div className="mt-2 text-sm text-stone-600">{children}</div> : null}
    </div>
  );
}
