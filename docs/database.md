# Database Architecture & Entity Specifications

The T-Ord delivery platform uses PostgreSQL with Prisma ORM.

## ERD Overview & Core Domains

```
+------------------+         +-------------------+         +---------------------+
|       User       |<--------|     UserRole      |-------->|        Role         |
+------------------+         +-------------------+         +---------------------+
  |              |                                            |                 |
  |              v                                            v                 |
  |      +---------------+                           +------------------+       |
  |      |    Address    |                           |  RolePermission  |       |
  |      +---------------+                           +------------------+       |
  |              ^                                            |                 |
  |              |                                            v                 |
  |      +---------------+                           +------------------+       |
  |      | Vendor/Store/ |                           |    Permission    |       |
  |      |   Pharmacy    |                           +------------------+       |
  |      +---------------+                                                      |
  v              ^                                                              |
+------------------+                                                            |
|      Order       |<-----------------------------------------------------------+
+------------------+
  |    |    |    |
  |    |    |    +---------------------> OrderStatusHistory
  |    |    +--------------------------> OrderItem
  |    +-------------------------------> Payment -> PaymentTransaction / Refund
  +------------------------------------> DeliveryAssignment -> DeliveryStatusHistory
```

---

## 1. Identity & RBAC

### User
Primary key: `id` (CUID string). Phone and Email must be unique. Password hashes are stored using Argon2id or bcrypt. Sensitive data is never stored in plain text.

- `status`: `PENDING` | `ACTIVE` | `SUSPENDED` | `DELETED`
- `deletedAt`: Timestamp for soft-deletion recovery.

### Roles & Permissions
- Enums: `CUSTOMER`, `VENDOR_ADMIN`, `PHARMACY_ADMIN`, `DELIVERY_PARTNER`, `SUPPORT_AGENT`, `ADMIN`, `SUPER_ADMIN`.
- Explicit relational mapping via `UserRole` and `RolePermission`.

---

## 2. Vendors, Stores & Pharmacies

- `Vendor`: Parent entity representing a registered business entity.
- `Store`: Grocery store associated with a Vendor.
- `Pharmacy`: Pharmacy store associated with a Vendor, storing explicit `licenseNumber`.

---

## 3. Catalog & Products

- `Category`: Tree hierarchy supporting nested categories (`parentId`), flagged with `isMedicine`.
- `Product`: Multi-tenant product record linked to Store or Pharmacy.
  - Fields: `sku` (unique), `barcode`, `name`, `slug` (unique), `unit`, `price`, `compareAtPrice`, `taxRate`, `isMedicine`, `isPrescriptionRequired`, `isAgeRestricted`, `metadata`.
- `ProductVariant`: Sizes, weights, pack counts, and variant SKUs.
- `ProductImage`: URLs and S3/local object keys with `isPrimary` flag.

---

## 4. Auditable Inventory

- `InventoryItem`: Tracks current `quantity`, `reserved`, and `minThreshold` per Product/Variant per Store/Pharmacy.
- `InventoryTransaction`: Immutable log recording all stock changes.
  - Types: `PURCHASE`, `SALE`, `ADJUSTMENT`, `RETURN`, `DAMAGE`, `EXPIRED`, `RESERVED`, `RELEASED`.

---

## 5. Orders & State Transitions

Order numbers are strictly formatted as `ORD-YYYY-XXXXXX`.

### Order States
1. `PENDING`: Order created, awaiting confirmation.
2. `CONFIRMED`: Vendor/store accepted order.
3. `PAYMENT_PENDING`: Awaiting payment confirmation.
4. `PAYMENT_CONFIRMED`: Payment captured.
5. `PROCESSING`: Store assembling items.
6. `READY_FOR_PICKUP`: Items packed.
7. `ASSIGNED`: Delivery partner assigned.
8. `PICKED_UP`: Delivery partner picked up package.
9. `OUT_FOR_DELIVERY`: In transit to customer.
10. `DELIVERED`: Successfully delivered.
11. `CANCELLED`: Cancelled by user or system.
12. `FAILED`: Delivery or processing failed.
13. `REFUNDED`: Full order refund completed.

- `OrderStatusHistory`: Records `previousStatus`, `newStatus`, `reason`, `changedByUserId`, and `createdAt`.

---

## 6. Payments & Refunds

- `PaymentStatus`: `PENDING`, `AUTHORIZED`, `CAPTURED`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`.
- `PaymentMethod`: `CARD`, `UPI`, `NET_BANKING`, `WALLET`, `CASH_ON_DELIVERY`.
- `PaymentTransaction`: Detailed gateway log.
- `Refund`: Records `amount`, `reason`, `providerRefundId`, and status.

---

## 7. Prescriptions (Secure Domain)

Prescription files are stored in object storage with private access controls.

- `status`: `UPLOADED` | `UNDER_REVIEW` | `APPROVED` | `REJECTED` | `EXPIRED`.
- `PrescriptionVerification`: Audit trail of licensed pharmacist review (`verifierId`, `rejectionReason`, `verifiedAt`).

---

## 8. Delivery Partner & Assignments

- `DeliveryPartner`: `userId`, `vehicleType`, `licenseNumber`, `isAvailable`, `currentLocationLat`, `currentLocationLng`, `rating`.
- `DeliveryAssignment`: Connects Order, DeliveryPartner, Pickup Address, and Dropoff Address.
- `DeliveryStatus`: `ASSIGNED` -> `ACCEPTED` -> `ARRIVED_AT_STORE` -> `PICKED_UP` -> `IN_TRANSIT` -> `DELIVERED`.

---

## 9. Coupons, Reviews, Support & Audit

- `Coupon` & `CouponUsage`: Promotional discounts with minimum order thresholds and expiration dates.
- `Review`: Star rating (1-5) and comments for products, stores, pharmacies, or delivery partners.
- `Notification` & `NotificationPreference`: In-app and push notification preferences.
- `SupportTicket` & `SupportMessage`: Customer support ticketing system.
- `AuditLog`: Immutable system audit trail (`actorId`, `action`, `entityType`, `entityId`, `metadata`, `ipAddress`, `requestId`).

---

## Indexing Strategy

- B-Tree indexes on all foreign key references (`userId`, `orderId`, `productId`, `vendorId`, `storeId`, `pharmacyId`, `categoryId`).
- Composite index on `OtpChallenge(destination, purpose)` for rapid authentication lookups.
- Index on `Order(orderNumber)`, `Order(status)`, `Order(paymentStatus)`, `Order(createdAt)`.
- Index on `Product(slug)`, `Product(sku)`, `Product(isActive)`, `Product(isMedicine)`.
