export const ROLE_CODES = [
  'CUSTOMER',
  'VENDOR_ADMIN',
  'PHARMACY_ADMIN',
  'DELIVERY_PARTNER',
  'SUPPORT_AGENT',
  'ADMIN',
  'SUPER_ADMIN',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const USER_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const AUTH_CHANNELS = ['PHONE', 'EMAIL'] as const;

export type AuthChannel = (typeof AUTH_CHANNELS)[number];

export const OTP_PURPOSES = ['LOGIN', 'VERIFY_CONTACT', 'RESET'] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const STORAGE_OBJECT_KINDS = [
  'PRODUCT_IMAGE',
  'PRESCRIPTION',
  'USER_DOCUMENT',
  'INVOICE',
] as const;

export type StorageObjectKind = (typeof STORAGE_OBJECT_KINDS)[number];

export const INVENTORY_TRANSACTION_TYPES = [
  'PURCHASE',
  'SALE',
  'ADJUSTMENT',
  'RETURN',
  'DAMAGE',
  'EXPIRED',
  'RESERVED',
  'RELEASED',
] as const;

export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PAYMENT_PENDING',
  'PAYMENT_CONFIRMED',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'FAILED',
  'REFUNDED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  'CARD',
  'UPI',
  'NET_BANKING',
  'WALLET',
  'CASH_ON_DELIVERY',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PRESCRIPTION_STATUSES = [
  'UPLOADED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
] as const;

export type PrescriptionStatus = (typeof PRESCRIPTION_STATUSES)[number];

export const DELIVERY_STATUSES = [
  'ASSIGNED',
  'ACCEPTED',
  'ARRIVED_AT_STORE',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'REJECTED',
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
