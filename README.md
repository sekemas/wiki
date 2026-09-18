# Wiki Platform

A full-production-oriented, mobile-first collaborative knowledge platform. This is an original implementation and contains no Wikipedia content.

## Stack

- Next.js and React frontend
- Fastify TypeScript API
- PostgreSQL with Prisma
- Redis and OpenSearch infrastructure
- Docker Compose for local services
- GitHub Actions CI

## Development

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm dev
```

The initial release is a modular monolith with immutable article revisions, role-based access, search-ready infrastructure, responsive UI, and production hardening foundations.
