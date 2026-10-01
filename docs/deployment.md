# Deployment

## Services
Deploy web behind a CDN, API behind HTTPS ingress, managed PostgreSQL, managed Redis, private object storage and a queue worker. Use the provided multi-stage Dockerfiles. Never run development migrations or database reset commands in production.

## Required configuration
`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `WEB_ORIGIN`, `API_PORT`, `STORAGE_DRIVER`, storage credentials and `PAYMENT_WEBHOOK_SECRET` must be supplied by the deployment secret manager. Set `NODE_ENV=production`, HTTPS-only cookie settings and a single explicit production origin.

## Release checklist
1. Validate environment and run `prisma migrate deploy` against a backup-tested database.
2. Build images, run lint/typecheck/unit/integration/E2E checks, then deploy API before web.
3. Check `/health/live` and an authenticated readiness endpoint that does not disclose dependency details.
4. Run a real signed webhook, payment idempotency and private-prescription download test in staging.
5. Enable backups, point-in-time recovery, metrics, error tracking and alerts before accepting traffic.

## Rollback
Use immutable image tags. Roll back application images separately from schema migrations; migrations must be additive/backward compatible and only removed after all old versions are gone.