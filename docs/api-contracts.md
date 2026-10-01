# API contracts

Base URL: `/api/v1`. Responses are JSON envelopes; clients must treat server-computed monetary values and status transitions as authoritative. Authentication uses bearer access tokens or the documented cookie flow. Every mobile and web client consumes these same contracts; business rules do not belong in either client.

## Core DTOs
- `ProductListQuery`: `page` (1+), `limit` (1–100), category/search/brand filters, price bounds, stock flag and approved sort values. Responses include `items` and `pagination`.
- `CreateOrder`: `deliveryAddressId`, `paymentMethod`, optional `couponCode`, `notes`, `prescriptionId`. It never accepts prices, totals, inventory quantities or payment status.
- `PrescriptionUpload`: multipart `file` plus optional `orderId`; accepted types and max size are server configuration. File content is private and a response must not expose a permanent public URL.
- `PaymentWebhook`: provider event with a provider signature. Webhooks are unauthenticated only at the JWT layer; signature verification and event idempotency are mandatory.

Swagger is available at `/api/v1/docs`. Before an external/mobile release, generate and version an OpenAPI JSON artifact from the Nest Swagger document, publish it with the API release, and use it to generate the Expo client types.