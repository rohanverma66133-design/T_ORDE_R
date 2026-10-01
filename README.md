# T-Ord

Town-level grocery and medicine delivery platform.

This repository is an API-first monorepo. The web application and NestJS API are independently deployable. Native mobile clients can consume the same versioned REST API later.

## Architecture

- `apps/web` — Next.js responsive web client
- `apps/api` — NestJS REST API (`/api/v1`)
- `packages/*` — shared TypeScript, validation, design system, and tooling
- `infra/` — Docker Compose and production Dockerfiles
- `docs/` — architecture and API notes

## Prerequisites

- Node.js 22+
- pnpm 9.15.0 (`npm install -g pnpm@9.15.0`)
- Docker Desktop

## Quick start

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

pnpm install
pnpm infra:up
pnpm --filter @tord/api prisma:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

- Web: http://localhost:3000
- API health: http://localhost:3001/api/v1/health
- OpenAPI: http://localhost:3001/api/v1/docs

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start web and API |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm test` | Unit/component/API tests |
| `pnpm build` | Production builds |
| `pnpm infra:up` | Postgres, Redis, MinIO |

## Environment

See `.env.example`. Required for the API:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Never commit real secrets. OTP codes are hashed. Refresh tokens are stored as SHA-256 hashes. Passwords, when added, must use Argon2.

## Current scope

Foundation only: tooling, auth primitives, RBAC schema, storage/job abstractions, design system, and module scaffolding. Domain features are not implemented yet.
