#!/usr/bin/env bash
# One command that makes a fresh clone work: `bun run setup`.
#
# Installs dependencies, makes sure PostgreSQL is running, applies the committed
# migrations and loads the seed content. Safe to re-run: migrations are
# idempotent and the seed upserts by slug.
set -euo pipefail
cd "$(dirname "$0")/.."

: "${DATABASE_URL:=postgresql://openpedia:openpedia@localhost:5432/openpedia?schema=public}"
export DATABASE_URL

echo "==> installing dependencies"
bun install

echo "==> making sure PostgreSQL is running"
bash scripts/ensure-postgres.sh

echo "==> generating the Prisma client"
bunx prisma generate

echo "==> applying the committed migrations"
bunx prisma migrate deploy

echo "==> loading the seed content"
bun run src/scripts/seed.ts

echo
echo "Openpedia is ready."
echo "DATABASE_URL is not read from a file, so export it in each new shell:"
echo "  export DATABASE_URL=\"${DATABASE_URL}\""
echo "then start the site with 'bun run dev' and open http://localhost:3000"
