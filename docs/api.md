# API

Base URL: `/api/v1`

OpenAPI UI (development): `/api/v1/docs`

## Envelope

Success:

```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" }
}
```

Error:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} },
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" }
}
```

Every response includes `x-request-id`.

## Foundation endpoints

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/health` | public | Dependency checks |
| GET | `/settings/public` | public | Public platform settings |
| POST | `/auth/otp/request` | public | Creates hashed OTP challenge |
| POST | `/auth/otp/verify` | public | Issues access + refresh tokens |
| POST | `/auth/token/refresh` | public | Rotates refresh token |
| POST | `/auth/logout` | public | Revokes refresh token |
| GET | `/users/me` | bearer | Current user |
| GET | `/roles` | admin | Role catalog |
| GET | `/permissions` | admin | Permission catalog |
| GET | `/addresses` | bearer | Current user addresses |
| GET | `/audit` | admin | Recent audit events |
| GET | `/admin/status` | admin | Admin module heartbeat |
| GET | `/{module}/status` | public | Scaffolded domain modules |

## Versioning

All production clients must target `/api/v1`. Future breaking changes land in `/api/v2`.
