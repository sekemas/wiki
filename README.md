# Openpedia

An encyclopedia you can run yourself. Openpedia is a small, self-contained web
application: public pages for browsing and searching articles, a real revision
history behind every article, and — since nothing outside this repository is
required — the same code serves a local copy and a live site.

Everything in it is ours: the software, the markup, the styling and the starter
articles in `src/content/seed-data.ts`.

## Run it

Requires [Bun](https://bun.sh) 1.2 or newer.

```bash
bun run setup      # install dependencies, create the database, load the articles
bun run dev        # serve on http://localhost:3000
```

`setup` is safe to re-run. The database is a single SQLite file at
`data/openpedia.db`, created on first use, so there is no server to install, no
connection string to configure and no account to sign up for.

To build and run the production server instead:

```bash
bun run build && bun run start
```

## What is in this version

| Route | What it does |
| --- | --- |
| `/` | Home: search, the day's featured article, recently updated articles, categories. |
| `/wiki/<slug>` | An article: lead paragraph, table of contents, Markdown body, categories, last editor, related articles. |
| `/wiki/<slug>/history` | Every revision of an article, newest first, with editor, note and timestamp. |
| `/browse` | Every article, grouped by first letter, with the category list. |
| `/category/<slug>` | The articles in one category. |
| `/search?q=…` | Case-insensitive search over titles, summaries and article text. |

Accounts, editing, talk pages, media uploads, notifications and moderation are
**not** in this version. The revision rows behind `/history` are the records the
editing interface will write to.

## How it is put together

- **TanStack Start** (React + Vite) renders every page on the server and
  hydrates it in the browser; Tailwind provides the styling.
- **`src/db.ts`** opens the SQLite database with Bun's built-in `bun:sqlite`
  driver and applies the schema idempotently on every start. Tables:
  `articles`, `categories`, `article_categories`, `revisions`.
- **`src/seed.ts` + `src/content/seed-data.ts`** hold the starter encyclopedia.
  Seeding upserts by slug, so it never duplicates an article and never rewrites
  an existing article's history.
- **`src/queries.ts`** contains the read queries; **`src/server-fns.ts`** wraps
  them as server functions. Route code only ever calls those functions, so no
  database code is bundled for the browser.
- **`src/lib/markdown.tsx`** is a small Markdown renderer written for this
  project. It renders to React elements — there is no raw HTML passthrough — and
  it understands ordinary links plus Openpedia's `[[slug|label]]` wiki links.

### Useful commands

```bash
bun run db:migrate   # create or update the schema
bun run db:seed      # (re)load the starter articles, idempotently
bun run format       # Prettier
```

### Writing content

Add an object to `SEED_ARTICLES` in `src/content/seed-data.ts` and run
`bun run db:seed`. Article bodies are Markdown with `##` sections; link to
another article with `[[its-slug]]` or `[[its-slug|words to show]]`. A wiki link
to a slug that does not exist yet is shown differently, so you can see at a
glance which articles still need writing.

## Deployment note

The database is a file, which is exactly what makes `git clone && bun run setup`
work with nothing else to arrange. A host that keeps the filesystem across
requests (a container, a VM, or this project's own serve script) can run it as
is. A host that discards the filesystem between requests would need the storage
layer swapped for a hosted database — that change is confined to `src/db.ts`,
because every query goes through `src/queries.ts`.
