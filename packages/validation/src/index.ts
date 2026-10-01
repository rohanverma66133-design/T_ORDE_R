import {
  AUTH_CHANNELS,
  OTP_PURPOSES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PRESCRIPTION_STATUSES,
} from '@tord/types';
import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const requestOtpSchema = z.object({
  channel: z.enum(AUTH_CHANNELS),
  destination: z.string().min(5).max(254),
  purpose: z.enum(OTP_PURPOSES).default('LOGIN'),
});

export const verifyOtpSchema = z.object({
  channel: z.enum(AUTH_CHANNELS),
  destination: z.string().min(5).max(254),
  purpose: z.enum(OTP_PURPOSES).default('LOGIN'),
  code: z.string().regex(/^\d{4,8}$/),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20),
});

export const loginWithPasswordSchema = z.object({
  emailOrPhone: z.string().min(3).max(254),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
});

export const resetPasswordSchema = z.object({
  channel: z.enum(AUTH_CHANNELS).default('PHONE'),
  destination: z.string().min(5).max(254),
  code: z.string().regex(/^\d{4,8}$/),
  newPassword: z.string().min(8).max(128),
});

export const createAddressSchema = z.object({
  label: z.string().optional(),
  line1: z.string().min(3).max(255),
  line2: z.string().optional(),
  city: z.string().min(2).max(100),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('IN'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().default(false),
});

export const createOrderSchema = z.object({
  storeId: z.string().optional(),
  pharmacyId: z.string().optional(),
  deliveryAddressId: z.string().min(1),
  paymentMethod: z.enum(PAYMENT_METHODS),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1).max(100),
      })
    )
    .min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  reason: z.string().optional(),
});

export const prescriptionUploadSchema = z.object({
  fileKey: z.string().min(1),
  orderId: z.string().optional(),
});

export const verifyPrescriptionSchema = z.object({
  status: z.enum(PRESCRIPTION_STATUSES),
  rejectionReason: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isMedicine: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const productVariantSchema = z.object({
  id: z.string().optional(),
  variantSku: z.string().min(2).max(100),
  name: z.string().min(1).max(100),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  unit: z.string().default('pcs'),
  quantity: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().min(2).max(100),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  storeId: z.string().optional(),
  pharmacyId: z.string().optional(),
  unit: z.string().default('pcs'),
  price: z.number().min(0),
  comparePrice: z.number().min(0).optional(),
  compareAtPrice: z.number().min(0).optional(),
  tax: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0).default(0),
  minimumOrderQuantity: z.number().int().min(1).default(1),
  maximumOrderQuantity: z.number().int().min(1).optional(),
  active: z.boolean().default(true),
  isActive: z.boolean().optional(),
  featured: z.boolean().default(false),
  isFeatured: z.boolean().optional(),
  isMedicine: z.boolean().default(false),
  isPrescriptionRequired: z.boolean().default(false),
  images: z.array(z.string()).default([]),
  variants: z.array(productVariantSchema).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkProductStatusSchema = z.object({
  productIds: z.array(z.string()).min(1),
  active: z.boolean(),
});

export const bulkProductDeleteSchema = z.object({
  productIds: z.array(z.string()).min(1),
});

export const adjustStockSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  storeId: z.string().optional(),
  pharmacyId: z.string().optional(),
  quantityChange: z.number().int(),
  type: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'EXPIRED', 'RESERVED', 'RELEASED']).default('ADJUSTMENT'),
  notes: z.string().optional(),
});

export const updateStoreSettingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  isOpen: z.boolean().optional(),
  isActive: z.boolean().optional(),
  deliveryArea: z.string().optional(),
  estimatedDeliveryTime: z.string().optional(),
  minimumOrder: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  phone: z.string().optional(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LoginWithPasswordInput = z.infer<typeof loginWithPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type PrescriptionUploadInput = z.infer<typeof prescriptionUploadSchema>;
export type VerifyPrescriptionInput = z.infer<typeof verifyPrescriptionSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;

