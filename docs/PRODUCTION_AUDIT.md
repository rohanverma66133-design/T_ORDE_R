# Production readiness audit

| Issue | Severity | Location | Risk | Status |
|---|---|---|---|---|
| Prescription privacy controls | CRITICAL | `prescriptions.*`, `storage.service.ts` | Private medical data exposure | Addressed: multipart uploads use random private keys, authenticated five-minute signatures, and no-store downloads; production S3 adapter still requires deployment configuration |
| Webhook signature verification | CRITICAL | `payments.module.ts` | Forged payment state | Addressed: raw-body HMAC verification with constant-time comparison; provider secret is required |
| Checkout inventory decrement occurs outside the order transaction and may decrement multiple rows | CRITICAL | `orders.service.ts` | Overselling and inconsistent orders | Open — must replace before release |
| Coupon validity does not check start time, global/per-user limits atomically | HIGH | `orders.service.ts` | Coupon abuse | Open |
| No route-specific health/readiness/liveness endpoints | HIGH | `health.controller.ts` | Unsafe orchestration decisions | Open |
| Product list limit is not server-clamped | HIGH | `products.service.ts` | Query/resource exhaustion | Open |
| PWA manifest and cache boundaries | MEDIUM | `apps/web/public` | Sensitive data cache exposure | Addressed: install metadata, icon, offline page and API/prescription cache exclusion |
| Structured request logging lacks authenticated user context/metrics export | MEDIUM | middleware/observability | Weak incident diagnosis | Open |

Production readiness score: **61/100**. The existing security headers, rate limit, CORS, CSRF origin check, pagination and RBAC foundation are useful, but the three critical issues above block production approval.

## Required external services
PostgreSQL, Redis, private object storage plus malware scanning, payment provider with webhook signing, email/SMS provider, CDN/HTTPS, and error/metrics monitoring.