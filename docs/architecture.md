# Architecture

T-Ord is split into independently deployable applications that share contracts through packages.

```
Client (web now, mobile later)
        |
        |  HTTPS JSON  /api/v1
        v
   NestJS API
    |     |      |
 Prisma  Redis  Object storage
    |     |
 Postgres BullMQ
```

## Design principles

- API-first: all business capability lives behind versioned REST endpoints.
- Modular NestJS domains: each bounded context is a module.
- Shared contracts: `@tord/types` and `@tord/validation` keep web and API aligned.
- Provider-agnostic infrastructure: storage and queue drivers can be swapped without changing modules.
- Security defaults: JWT access tokens, hashed refresh tokens, hashed OTPs, RBAC guards, Helmet, throttling, request IDs.

## Authentication

Phone or email OTP is the first-class login path. The OTP sender currently logs in non-production environments only. Production must inject an SMS/email provider behind the same `OtpService` interface.

Access tokens are short-lived JWTs. Refresh tokens are random high-entropy values stored as SHA-256 hashes and rotated on use.

## Authorization

Roles: customer, vendor, pharmacy, delivery partner, support, admin, super admin.

Guards:

- `JwtAuthGuard` (global, skippable with `@Public()`)
- `RolesGuard` (declarative `@Roles(...)`)

## Storage

`StorageService` delegates to `local` or `s3` drivers. Use local disk in development and any S3-compatible object store in production (AWS, MinIO, GCS interoperability, etc.).

## Frontend visual language

Glass is reserved for navigation, hero panels, filters, and status cards. Content cards stay solid for WCAG contrast. Tokens live in CSS variables, not scattered hex values.
