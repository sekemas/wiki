/**
 * The Prisma client, one per process.
 *
 * Server-only: never import this from a component or from anything else that
 * ends up in the browser bundle. Route code reaches the database through the
 * server functions in `src/server-fns.ts`, which import `./queries` lazily so
 * no Prisma code can be pulled into a client build.
 *
 * The connection string comes from DATABASE_URL — the one credential the
 * deployed site needs. Locally it points at the Postgres started by
 * `docker compose up -d` (see .env.example and the README); there is deliberately
 * no committed .env, because a file in the site directory would shadow the
 * platform's own DATABASE_URL.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { __openpediaPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__openpediaPrisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG === "1" ? ["query", "warn", "error"] : ["warn", "error"],
  });

// Reuse the client across hot reloads in development instead of opening a new
// connection pool on every edit.
if (!globalForPrisma.__openpediaPrisma) globalForPrisma.__openpediaPrisma = prisma;
