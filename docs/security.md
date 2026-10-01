# Security model

## Trust boundaries
The web/PWA and future React Native client are untrusted clients. The API is the only authority for prices, inventory, coupon eligibility, order transitions, payment state and access decisions. PostgreSQL, Redis, queue, payment provider and private object storage are separate trust boundaries.

## Controls in place
- JWT guard, role/permission guards and owner-scoped address, cart, order and prescription queries protect customer resources.
- Helmet, an allow-listed CORS origin, request-size limits, CSRF origin checks for cookie-authenticated mutations, throttling and request IDs are configured in the API bootstrap.
- Refresh tokens use server-managed authentication flows; logs redact credentials and tokens.
- Product listing is paginated; checkout recalculates price and tax on the server.
- Prescription storage must be private. Service workers must never cache API, prescription or signed-URL requests.

## Required before production
- Replace the prescription `fileUrl` fallback with a multipart upload flow that validates extension, MIME, magic bytes, size and malware scan; store only random private object keys; authorize every signed download and make URLs short-lived.
- Implement provider-specific webhook verification over the raw request body using a configured secret and constant-time comparison. Enforce a database-unique event ID before applying payment state.
- Put checkout, inventory reservation/decrement, order creation, coupon usage and cart clearing in one serializable transaction. The current sequential inventory update can race and must not be released as-is.
- Add per-user coupon limits and a unique idempotency key on checkout/payment operations.
- Enforce strong administrator login, step-up authentication and optional TOTP/WebAuthn before privileged actions. Audit role changes, refunds, prescription decisions, inventory adjustments and configuration changes.
- Run private storage with encryption, least-privilege IAM, retention/deletion policy and malware scanning. Do not serve its bucket publicly.

## Operational rules
Secrets are injected by the deployment platform, never committed. Rotate JWT and provider secrets, set Secure/HttpOnly/SameSite cookies under HTTPS, and restrict `WEB_ORIGIN` to deployed origins. Alert on repeated authorization failures, webhook failures, admin actions and anomalous download activity.