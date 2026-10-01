# Openpedia

An encyclopedia you can run yourself. Openpedia is a small, self-contained web
application: public pages for browsing and searching articles, a real revision
history behind every article, and — since nothing outside this repository is
required — the same code serves a local copy and a live site.

Everything in it is ours: the software, the markup, the styling and the starter
articles in `src/content/seed-data.ts`.

## Run it

Requires [Bun](https://bun.sh) 1.2 or newer and PostgreSQL 16 (the Docker Compose
file in this repository, or any PostgreSQL server you already have).

```bash
export DATABASE_URL="postgresql://openpedia:openpedia@localhost:5432/openpedia?schema=public"
bun run setup      # install, start PostgreSQL, migrate, seed
bun run dev        # serve on http://localhost:3000
```

`setup` is safe to re-run, and it is the only command a fresh clone needs. It:

1. installs dependencies (`bun install`);
2. makes sure a PostgreSQL server is listening on `DATABASE_URL` — reusing one
   that is already running, otherwise `docker compose up -d --wait postgres`
   (`scripts/ensure-postgres.sh` explains what it did if it had to start one);
3. generates the Prisma client;
4. applies the committed migrations (`prisma migrate deploy`);
5. loads the seed content, upserted by slug so it never duplicates anything.

To build and run the production server instead:

```bash
bun run build && bun run start
```

## Bringing the live site back up
The published site (port 3000) runs on this machine against a local PostgreSQL. If
the machine is restarted or replaced, one command puts it back:

```bash
bash scripts/start-live.sh            # add --rebuild to force a fresh vite build
```

It is idempotent, and there is nothing else to do — no `.env`, no manual step. In
order it: installs PostgreSQL 16 if the binaries are gone; mounts the database
image, or creates it on a first-ever run; starts the database server and makes
sure the role and database exist; reinstalls the dependency tree if it is missing;
applies the committed migrations; loads the seed content (upserts by slug); builds
the site if `dist/` is missing; starts the site on port 3000; and waits until the
site actually answers before reporting success.

Two things about a machine replacement are worth knowing. The **database contents
survive** it, and so does the git repository; the **PostgreSQL binaries, the
dependency tree and the build do not** — the script reinstalls or rebuilds each of
those. The database lives in a sparse ext4 *image file* on the persistent `/home`
volume (`/home/team/.data/pgdata.img`, mounted at `/var/lib/openpedia-pg`), because
`/home` hands every file it holds to `root`: PostgreSQL refuses to run as root and
cannot own a directory there, so the cluster runs as the `postgres` user *inside*
that image. `node_modules` stays off `/home` for the reason it always has —
Prisma's engines do not fit there — and lives at `/opt/site/node_modules`,
symlinked into the repository.

## The database

PostgreSQL, described once in `prisma/schema.prisma` and built by the SQL
migrations committed under `prisma/migrations/`. Those migrations are the source
of truth: `prisma migrate deploy` on an empty database creates the whole schema,
so the repository reproduces itself — no one relies on `prisma db push`, which
would leave an untracked database behind. Two migrations exist today:

| Migration | What it does |
| --- | --- |
| `…_init` | Every table, enum, foreign key and index — generated from the schema. |
| `…_article_search_index` | A `GIN` index over `to_tsvector('english', title ‖ summary ‖ body)`, ready for ranked search. |

### Schema

| Model (table) | Purpose |
| --- | --- |
| `Article` (`articles`) | The article: slug, title, summary, Markdown body, `status` (DRAFT / IN_REVIEW / PUBLISHED), `locked` (protected), timestamps. |
| `Category` (`categories`) | Slug, name, description. |
| `ArticleCategory` (`article_categories`) | The article↔category join, with the indexes the read pages need. |
| `Revision` (`revisions`) | One saved version: title, body, `editorName`, optional `editorId`, edit note, timestamp. Indexed on `(articleId, createdAt DESC)` — that is the history page. |
| `User` (`users`) | Lower-cased unique email, unique display name, password hash, `role` (CONTRIBUTOR / EDITOR / MODERATOR / ADMIN), `status` (ACTIVE / SUSPENDED). |
| `Session` (`sessions`) | Unique `tokenHash` (the cookie holds the token, never the database), user, expiry. |
| `Media` (`media`) | Uploads: filename, stored path, MIME type, `kind` (IMAGE / VIDEO), size, dimensions, caption, alt text, uploader. |
| `AuditLog` (`audit_log`) | Append-only record of privileged actions: actor, actor email (denormalised), action, target, JSON metadata. |

The tables for accounts, sessions, media and the audit log are in place from the
first migration — the phases that use them fill in behaviour, not schema.

### Local PostgreSQL

`docker-compose.yml` starts PostgreSQL 16 with a named volume, so the data
survives a container restart; `docker compose down -v` deletes it and the next
`bun run setup` rebuilds it from the migrations.

```bash
docker compose up -d          # start PostgreSQL on localhost:5432
docker compose ps             # check the healthcheck
docker compose down -v        # throw the local database away
```

There is deliberately **no committed `.env`**: a `.env` file in this directory
would shadow the platform's own `DATABASE_URL` on the deployed site. Export the
variable in your shell instead — `.env.example` holds the value that matches the
Compose file.

### Useful commands

```bash
bash scripts/start-live.sh  # recovery: PostgreSQL + migrations + the site on port 3000
bun run db:migrate       # apply the committed migrations (prisma migrate deploy)
bun run db:migrate:dev   # author a new migration from a schema change
bun run db:seed          # (re)load the starter articles, idempotently
bun run prisma:generate  # regenerate the client after a schema change
bun run db:studio        # browse the database with Prisma Studio
bun run format           # Prettier
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

Only `PUBLISHED` articles are ever shown. Accounts, editing, talk pages, media
uploads, notifications and moderation are **not** in this version: the schema
carries their tables, and the routes come next.

## How it is put together

- **TanStack Start** (React + Vite) renders every page on the server and
  hydrates it in the browser; Tailwind provides the styling.
- **`src/prisma.ts`** holds the one `PrismaClient` per process, reading
  `DATABASE_URL`. It is server-only.
- **`src/queries.ts`** contains the read queries and is also the mapping
  boundary: Prisma models are never handed to React, every row becomes the plain
  shape in `src/types.ts` with timestamps as ISO strings.
- **`src/server-fns.ts`** wraps those queries as server functions, importing the
  query module *inside* each handler so no database code can reach a browser
  bundle. Route code only ever calls those functions.
- **`src/seed.ts` + `src/content/seed-data.ts`** hold the starter encyclopedia.
  Seeding upserts by slug, so it never duplicates an article and never rewrites
  an existing article's history.
- **`vite.config.ts`** keeps `@prisma/client` out of the SSR bundle
  (`ssr.external`), because the generated client loads a native query engine by
  path; the production server requires it from `node_modules` at run time.
- **`src/lib/markdown.tsx`** is a small Markdown renderer written for this
  project. It renders to React elements — there is no raw HTML passthrough — and
  it understands ordinary links plus Openpedia's `[[slug|label]]` wiki links.

### Writing content

Add an object to `SEED_ARTICLES` in `src/content/seed-data.ts` and run
`bun run db:seed`. Article bodies are Markdown with `##` sections; link to
another article with `[[its-slug]]` or `[[its-slug|words to show]]`. A wiki link
to a slug that does not exist yet is shown differently, so you can see at a
glance which articles still need writing.

## Deployment note

The deployed site needs exactly one thing that is not in this repository: a
PostgreSQL connection string in `DATABASE_URL`, set in the environment the server
runs in. Point it at a hosted PostgreSQL database, then:

```bash
bun run db:migrate   # build the schema on the hosted database
bun run db:seed      # load the articles (safe to re-run)
bun run publish      # build and serve on port 3000
```

If the database is empty but migrated, the home page tops itself up from the seed
content on first load, so the site is never a blank shell.
