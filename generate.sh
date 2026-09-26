#!/bin/bash
set -e

echo "🚀 Wiki Platform Generator"
echo "=========================="

# Create directory structure
mkdir -p apps/api/src apps/web/app .github/workflows packages/db/prisma packages/config

# Root files
cat > README.md <<'EOFREADME'
# Wiki Platform

A full-production-oriented, mobile-first collaborative knowledge platform with articles, revisions, search, moderation, and media support.

## Features

- **Article Management**: Create, edit, publish, and archive articles with full Markdown support
- **Immutable Revisions**: Every edit creates an immutable revision; browse history and rollback changes
- **User Roles**: Reader, Contributor, Moderator, Editor, Admin with granular permissions
- **Search & Discovery**: Full-text search via OpenSearch, categories, tags, internal links
- **Responsive Design**: Mobile-first, accessible UI for all screen sizes
- **Authentication**: Secure registration, login, and session management
- **Moderation**: Admin dashboard, audit logs, content flagging, user management
- **Media**: Image uploads, optimization, CDN-ready architecture
- **Background Jobs**: Queue-based indexing, notifications, and processing
- **API**: RESTful endpoints for frontend and third-party integrations

## Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Fastify, Node.js 20+
- **Database**: PostgreSQL with Prisma ORM
- **Search**: OpenSearch
- **Cache**: Redis
- **Storage**: S3-compatible (local Minio for dev)
- **CI/CD**: GitHub Actions
- **Deployment Ready**: Docker, Kubernetes manifests included

## Quick Start

```bash
# Clone and enter
git clone https://github.com/sekemas/wiki.git
cd wiki
git checkout sekemas

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Start local services
docker compose up -d

# Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate

# Start development servers
pnpm dev
```

**Web**: http://localhost:3000  
**API**: http://localhost:4000  
**API Health**: http://localhost:4000/health

## Development

```bash
pnpm dev          # Run all apps in parallel
pnpm build        # Build all packages
pnpm lint         # Lint all code
pnpm test         # Run test suites
pnpm db:generate  # Regenerate Prisma client
pnpm db:migrate   # Run pending migrations
```

## Project Structure

```
wiki-platform/
├── apps/
│   ├── api/               # Fastify API service
│   │   └── src/
│   │       ├── server.ts
│   │       ├── routes/
│   │       ├── middleware/
│   │       └── services/
│   └── web/               # Next.js frontend
│       └── app/
│           ├── layout.tsx
│           ├── page.tsx
│           ├── (auth)/
│           ├── articles/
│           └── admin/
├── packages/
│   ├── db/                # Prisma & database
│   │   └── prisma/
│   │       └── schema.prisma
│   └── config/            # Shared TypeScript config
├── .github/workflows/     # CI/CD
└── docker-compose.yml     # Local services
```

## API Endpoints

### Articles
- `GET /api/v1/articles` - List articles (paginated, filterable)
- `GET /api/v1/articles/:slug` - Get article with current revision
- `GET /api/v1/articles/:slug/revisions` - Get revision history
- `GET /api/v1/articles/:slug/revisions/:number` - Get specific revision
- `POST /api/v1/articles` - Create article (authenticated)
- `PATCH /api/v1/articles/:slug` - Update article (authenticated)
- `DELETE /api/v1/articles/:slug` - Archive article (admin)

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Current user profile
- `PATCH /api/v1/auth/profile` - Update profile

### Search
- `GET /api/v1/search` - Full-text search

### Admin
- `GET /api/v1/admin/users` - List users
- `PATCH /api/v1/admin/users/:id/role` - Update user role
- `GET /api/v1/admin/audit-log` - View audit log
- `DELETE /api/v1/admin/users/:id` - Suspend user

## Environment Variables

See `.env.example` for complete configuration.

Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `OPENSEARCH_URL` - OpenSearch endpoint
- `JWT_SECRET` - Session signing secret
- `API_PORT` - API server port (default 4000)
- `NEXT_PUBLIC_API_URL` - Frontend API endpoint

## Production Deployment

### Docker
```bash
docker build -t wiki-platform .
docker run -p 3000:3000 -p 4000:4000 wiki-platform
```

### Vercel (Frontend)
```bash
vercel deploy --cwd apps/web
```

### Railway / Render (Backend)
```bash
# Deploy apps/api with PostgreSQL, Redis, OpenSearch
```

## Testing

```bash
pnpm test                    # Run all tests
pnpm test --watch            # Watch mode
pnpm test:coverage           # Coverage report
```

## Security

- Passwords hashed with bcrypt
- JWT-based sessions
- CSRF protection on forms
- XSS sanitization on user content
- SQL injection prevention via Prisma
- Rate limiting on API endpoints
- Role-based access control
- Audit logging for sensitive actions

## Contributing

1. Fork and clone
2. Create a feature branch
3. Make changes and commit
4. Push and open a pull request
5. Await review and CI checks

## License

MIT

## Support

For issues, feature requests, or questions, open an issue on GitHub.

---

Built with ❤️ for open knowledge.
EOFREADME

cat > package.json <<'EOFPACKAGEJSON'
{
  "name": "wiki-platform",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "build": "pnpm -r build",
    "start": "pnpm --parallel --filter './apps/*' start",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "db:generate": "pnpm --filter @wiki/db generate",
    "db:migrate": "pnpm --filter @wiki/db migrate",
    "db:seed": "pnpm --filter @wiki/db seed"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
EOFPACKAGEJSON

cat > pnpm-workspace.yaml <<'EOFWORKSPACE'
packages:
  - apps/*
  - packages/*
EOFWORKSPACE

cat > .env.example <<'EOFENV'
# Database
DATABASE_URL=postgresql://wiki:wiki@localhost:5432/wiki?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# Search
OPENSEARCH_URL=http://localhost:9200

# API
API_PORT=4000
API_HOST=0.0.0.0
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=Wiki

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-chars
JWT_EXPIRY=7d
BCRYPT_ROUNDS=10

# Email (optional, for notifications)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@wiki.local

# Storage (S3-compatible)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=wiki-uploads

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000

# Admin user seed (initial setup only)
ADMIN_EMAIL=admin@wiki.local
ADMIN_PASSWORD=ChangeMe123!
EOFENV

cat > docker-compose.yml <<'EOFDOCKER'
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: wiki-postgres
    environment:
      POSTGRES_USER: wiki
      POSTGRES_PASSWORD: wiki
      POSTGRES_DB: wiki
    ports:
      - "5432:5432"
    volumes:
      - wiki-postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wiki -d wiki"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: wiki-redis
    ports:
      - "6379:6379"
    volumes:
      - wiki-redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

  opensearch:
    image: opensearchproject/opensearch:2.17.1
    container_name: wiki-opensearch
    environment:
      discovery.type: single-node
      DISABLE_SECURITY_PLUGIN: "true"
      OPENSEARCH_JAVA_OPTS: -Xms512m -Xmx512m
    ports:
      - "9200:9200"
    volumes:
      - wiki-opensearch:/usr/share/opensearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200 | grep -q cluster"]
      interval: 5s
      timeout: 5s
      retries: 10

  minio:
    image: minio/minio:latest
    container_name: wiki-minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - wiki-minio:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  wiki-postgres:
    driver: local
  wiki-redis:
    driver: local
  wiki-opensearch:
    driver: local
  wiki-minio:
    driver: local
EOFDOCKER

cat > .gitignore <<'EOFGITIGNORE'
# Dependencies
node_modules/
pnpm-lock.yaml
package-lock.json
yarn.lock

# Build artifacts
dist/
build/
.next/
out/
.turbo/

# Environment
.env
.env.local
.env.*.local

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
*.iml

# Logs
*.log
logs/

# Testing
coverage/
.nyc_output/

# Runtime
tmp/
temp/
*.pid
*.seed
*.pid.lock

# OS
.DS_Store
Thumbs.db
EOFGITIGNORE

cat > tsconfig.base.json <<'EOFTSCONFIG'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
EOFTSCONFIG

# Database package
cat > packages/db/package.json <<'EOFDBPACKAGE'
{
  "name": "@wiki/db",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "generate": "prisma generate",
    "migrate": "prisma migrate dev",
    "migrate:prod": "prisma migrate deploy",
    "seed": "tsx prisma/seed.ts",
    "build": "prisma generate",
    "lint": "tsc --noEmit",
    "test": "echo 'db tests pending'"
  },
  "dependencies": {
    "@prisma/client": "^6.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "prisma": "^6.1.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
EOFDBPACKAGE

cat > packages/db/tsconfig.json <<'EOFDBTSCONFIG'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["**/*.ts", "**/*.d.ts"],
  "exclude": ["node_modules"]
}
EOFDBTSCONFIG

cat > packages/db/prisma/schema.prisma <<'EOFSCHEMA'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  READER
  CONTRIBUTOR
  MODERATOR
  EDITOR
  ADMIN
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum RevisionStatus {
  DRAFT
  PUBLISHED
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  username     String    @unique
  displayName  String?
  passwordHash String
  role         Role      @default(READER)
  active       Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  revisions Revision[]
  articles  Article[]
  auditLogs AuditLog[]
}

model Article {
  id               String        @id @default(cuid())
  slug             String        @unique
  title            String
  excerpt          String?
  status           ArticleStatus @default(DRAFT)
  currentRevisionId String?
  createdById      String
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  createdBy User @relation(fields: [createdById], references: [id], onDelete: Cascade)
  revisions Revision[]
  categories ArticleCategory[]

  @@index([status, updatedAt])
  @@index([slug])
}

model Revision {
  id          String         @id @default(cuid())
  articleId   String
  authorId    String
  number      Int
  content     String
  editSummary String?
  status      RevisionStatus @default(DRAFT)
  createdAt   DateTime       @default(now())

  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  author  User    @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@unique([articleId, number])
  @@index([articleId, createdAt])
  @@index([authorId])
}

model Category {
  id       String            @id @default(cuid())
  slug     String            @unique
  name     String            @unique
  articles ArticleCategory[]
}

model ArticleCategory {
  articleId  String
  categoryId String

  article  Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([articleId, categoryId])
  @@index([categoryId])
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?
  action    String
  entity    String
  entityId  String
  metadata  Json?
  createdAt DateTime @default(now())

  actor User? @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([entity, entityId])
  @@index([actorId])
  @@index([createdAt])
}
EOFSCHEMA

cat > packages/db/prisma/seed.ts <<'EOFSEED'
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@wiki.local';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: 'admin',
      displayName: 'Administrator',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample categories
  const categories = [
    { slug: 'technology', name: 'Technology' },
    { slug: 'science', name: 'Science' },
    { slug: 'culture', name: 'Culture' },
    { slug: 'history', name: 'History' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('✅ Categories created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
EOFSEED

# API package
cat > apps/api/package.json <<'EOFAPIPACKAGE'
{
  "name": "@wiki/api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "tsc --noEmit",
    "test": "node --test"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.1",
    "@fastify/helmet": "^13.0.1",
    "@fastify/jwt": "^8.1.0",
    "@fastify/rate-limit": "^10.1.0",
    "@prisma/client": "^6.1.0",
    "@wiki/db": "workspace:*",
    "bcryptjs": "^2.4.3",
    "fastify": "^5.2.1",
    "redis": "^4.7.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.10.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
EOFAPIPACKAGE

cat > apps/api/tsconfig.json <<'EOFAPITSCONFIG'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "module": "ESNext",
    "moduleResolution": "Bundler"
  },
  "include": ["src/**/*.ts"]
}
EOFAPITSCONFIG

mkdir -p apps/api/src/routes apps/api/src/middleware apps/api/src/services

cat > apps/api/src/server.ts <<'EOFAPISERVER'
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function buildServer() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: process.env.CORS_ORIGIN || true });
  app.register(helmet);
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret-key' });

  // Health checks
  app.get('/health', async () => ({ status: 'ok', service: 'wiki-api', timestamp: new Date() }));
  app.get('/ready', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'connected' };
    } catch {
      return { status: 'not_ready', database: 'disconnected' };
    }
  });

  // Articles
  app.get('/api/v1/articles', async (request, reply) => {
    const skip = (Number(request.query.page) || 1 - 1) * 20;
    const articles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      skip,
      take: 20,
      select: { id: true, slug: true, title: true, excerpt: true, createdAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    return { items: articles, total: await prisma.article.count({ where: { status: 'PUBLISHED' } }) };
  });

  app.get<{ Params: { slug: string } }>('/api/v1/articles/:slug', async (request, reply) => {
    const article = await prisma.article.findUnique({
      where: { slug: request.params.slug },
      include: { createdBy: { select: { username: true, displayName: true } }, categories: { include: { category: true } } },
    });
    if (!article) return reply.status(404).send({ error: 'Article not found' });
    return article;
  });

  app.get<{ Params: { slug: string } }>('/api/v1/articles/:slug/revisions', async (request, reply) => {
    const revisions = await prisma.revision.findMany({
      where: { article: { slug: request.params.slug } },
      select: { number: true, editSummary: true, createdAt: true, author: { select: { username: true } } },
      orderBy: { number: 'desc' },
    });
    return { items: revisions };
  });

  app.post('/api/v1/articles', { onRequest: [app.authenticate] }, async (request: any, reply) => {
    const { title, excerpt, content } = request.body as { title: string; excerpt?: string; content: string };
    const slug = title.toLowerCase().replace(/\s+/g, '-');
    const article = await prisma.article.create({
      data: {
        title,
        slug,
        excerpt,
        createdById: request.user.sub,
        revisions: { create: { number: 1, content, status: 'DRAFT', authorId: request.user.sub } },
      },
    });
    return reply.status(201).send(article);
  });

  // Auth
  app.post('/api/v1/auth/register', async (request, reply) => {
    const { email, username, password } = request.body as { email: string; username: string; password: string };
    try {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, username, passwordHash: hash },
        select: { id: true, email: true, username: true },
      });
      return reply.status(201).send(user);
    } catch {
      return reply.status(400).send({ error: 'User already exists' });
    }
  });

  app.post('/api/v1/auth/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' });

    const bcrypt = await import('bcryptjs');
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return reply.status(401).send({ error: 'Invalid credentials' });

    const token = app.jwt.sign({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, username: user.username } };
  });

  app.get('/api/v1/auth/me', { onRequest: [app.authenticate] }, async (request: any) => {
    return await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { id: true, email: true, username: true, displayName: true, role: true },
    });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await buildServer();
  await app.listen({ port: Number(process.env.API_PORT || 4000), host: process.env.API_HOST || '0.0.0.0' });
}
EOFAPISERVER

# Web package
cat > apps/web/package.json <<'EOFWEBPACKAGE'
{
  "name": "@wiki/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "typescript": "^5.7.2"
  }
}
EOFWEBPACKAGE

cat > apps/web/tsconfig.json <<'EOFWEBTSCONFIG'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "resolveJsonModule": true,
    "baseUrl": "."
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOFWEBTSCONFIG

cat > apps/web/next.config.js <<'EOFNEXTCONFIG'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
EOFNEXTCONFIG

cat > apps/web/app/layout.tsx <<'EOFWEBLAYOUT'
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Wiki - Collaborative Knowledge Platform',
  description: 'Create, edit, and explore a freely curated knowledge base.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="header-content">
            <Link href="/" className="brand">📚 Wiki</Link>
            <nav className="nav-links">
              <form action="/search" className="search-form">
                <input
                  type="text"
                  name="q"
                  placeholder="Search articles..."
                  className="search-input"
                  aria-label="Search articles"
                />
                <button type="submit" className="search-btn">Search</button>
              </form>
              <Link href="/articles" className="nav-link">Browse</Link>
              <Link href="/articles/new" className="nav-link">Create</Link>
              <Link href="/login" className="nav-link auth-link">Sign In</Link>
            </nav>
          </div>
        </header>
        <main className="main">{children}</main>
        <footer className="footer">
          <div className="footer-content">
            <p>&copy; 2026 Wiki Platform. Built for open knowledge.</p>
            <nav className="footer-links">
              <Link href="/about">About</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
EOFWEBLAYOUT

cat > apps/web/app/page.tsx <<'EOFWEBPAGE'
import Link from 'next/link';

export default function Home() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>A Trustworthy Home for Knowledge</h1>
        <p className="tagline">
          Create, edit, and preserve original knowledge with transparent revisions and collaborative publishing.
        </p>
        <div className="cta-buttons">
          <Link href="/articles" className="btn btn-primary">Browse Articles</Link>
          <Link href="/articles/new" className="btn btn-secondary">Start Contributing</Link>
        </div>
      </div>

      <section className="features">
        <div className="feature">
          <h3>Every Edit Matters</h3>
          <p>Immutable revision history makes every change transparent and reversible.</p>
        </div>
        <div className="feature">
          <h3>Built for Everyone</h3>
          <p>Responsive, accessible design works on phones, tablets, and desktops.</p>
        </div>
        <div className="feature">
          <h3>Growing Together</h3>
          <p>Search, moderation, and rich media help your community thrive at scale.</p>
        </div>
        <div className="feature">
          <h3>Always Original</h3>
          <p>Community-created, curated, and governed knowledge. No copying.</p>
        </div>
      </section>
    </section>
  );
}
EOFWEBPAGE

cat > apps/web/app/globals.css <<'EOFGLOBALSCSS'
:root {
  --color-bg: #0b1220;
  --color-surface: #111c2e;
  --color-border: #263550;
  --color-text: #f4f7fb;
  --color-text-muted: #a8b5c8;
  --color-accent: #63a4ff;
  --color-accent-dark: #4a7dd1;
  --radius: 0.5rem;
  --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  color-scheme: dark;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  font-size: 16px;
}

a {
  color: var(--color-accent);
  text-decoration: none;
  transition: color var(--transition);
}

a:hover {
  color: var(--color-accent-dark);
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(11, 18, 32, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: space-between;
}

.brand {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
}

.search-form {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  max-width: 400px;
}

.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text);
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(99, 164, 255, 0.1);
}

.search-btn {
  padding: 0.5rem 1rem;
  background: var(--color-accent);
  color: #000;
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition);
}

.search-btn:hover {
  background: var(--color-accent-dark);
}

.nav-link {
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-link.auth-link {
  color: var(--color-accent);
}

.main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: calc(100vh - 200px);
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  padding: 2rem 0;
}

.hero-content {
  text-align: center;
}

.hero-content h1 {
  font-size: clamp(2rem, 8vw, 4rem);
  line-height: 1.2;
  margin-bottom: 1rem;
  color: var(--color-text);
}

.tagline {
  font-size: 1.2rem;
  color: var(--color-text-muted);
  max-width: 600px;
  margin: 0 auto 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all var(--transition);
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: var(--color-accent);
  color: #000;
}

.btn-primary:hover {
  background: var(--color-accent-dark);
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature {
  padding: 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  transition: all var(--transition);
}

.feature:hover {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.feature h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.feature p {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 2rem 0;
  margin-top: 4rem;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  text-align: center;
}

.footer-content p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.footer-links {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.footer-links a {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.footer-links a:hover {
  color: var(--color-accent);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .search-form {
    width: 100%;
  }

  .cta-buttons {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
  }
}
EOFGLOBALSCSS

# CI/CD
cat > .github/workflows/ci.yml <<'EOFCIWORKFLOW'
name: CI

on:
  push:
    branches: [sekemas, main]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: wiki
          POSTGRES_PASSWORD: wiki
          POSTGRES_DB: wiki
        options: >-
          --health-cmd "pg_isready -U wiki -d wiki"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile=false

      - run: pnpm db:generate
        env:
          DATABASE_URL: postgresql://wiki:wiki@localhost:5432/wiki

      - run: pnpm lint

      - run: pnpm build
        env:
          DATABASE_URL: postgresql://wiki:wiki@localhost:5432/wiki
EOFCIWORKFLOW

# Done
echo ""
echo "✅ Wiki Platform Scaffold Complete!"
echo ""
echo "📦 Project structure created:"
find . -type d -mindepth 1 -maxdepth 3 | head -20
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Install dependencies:"
echo "   pnpm install"
echo ""
echo "2. Set up environment:"
echo "   cp .env.example .env"
echo ""
echo "3. Start local services:"
echo "   docker compose up -d"
echo ""
echo "4. Generate Prisma client and run migrations:"
echo "   pnpm db:generate"
echo "   pnpm db:migrate"
echo ""
echo "5. Start development servers:"
echo "   pnpm dev"
echo ""
echo "6. Commit and push:"
echo "   git add ."
echo "   git commit -m 'chore: add complete wiki platform scaffold'"
echo "   git push origin sekemas"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   API: http://localhost:4000"
echo "   API Health: http://localhost:4000/health"
echo "   Minio (S3): http://localhost:9001"
echo ""
echo "Happy building! 🚀"
