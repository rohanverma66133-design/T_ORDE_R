import type {
  RoleCode,
  UserStatus,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  PrescriptionStatus,
  DeliveryStatus,
  InventoryTransactionType,
} from './roles';

export interface PublicUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  roles: RoleCode[];
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  environment?: string;
  checks: Record<string, 'up' | 'down'>;
}

export interface DomainVendor {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
}

export interface DomainCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  isMedicine: boolean;
  displayOrder: number;
  productCount?: number;
}

export interface DomainStore {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  isGrocery: boolean;
  isActive: boolean;
  isOpen: boolean;
  deliveryArea?: string | null;
  estimatedDeliveryTime?: string | null;
  minimumOrder: number;
  deliveryFee: number;
  phone?: string | null;
  address?: string | null;
  productCount?: number;
}

export interface DomainPharmacy {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  licenseNumber?: string | null;
  isActive: boolean;
}

export interface DomainProductVariant {
  id: string;
  productId: string;
  variantSku: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  unit: string;
  quantity?: number;
  isAvailable: boolean;
}

export interface DomainProduct {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  unit: string;
  price: number;
  compareAtPrice?: number | null;
  taxRate: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity?: number | null;
  isFeatured: boolean;
  isActive: boolean;
  isMedicine: boolean;
  isPrescriptionRequired: boolean;
  isAgeRestricted: boolean;
  categoryId?: string | null;
  categoryName?: string | null;
  images?: string[];
  imageUrl?: string | null;
  stockQuantity?: number;
  variants?: DomainProductVariant[];
}

export interface DomainOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
}

export interface DomainPayment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  provider: string;
  createdAt: string;
}

export interface DomainDeliveryAssignment {
  id: string;
  orderId: string;
  deliveryPartnerId: string;
  status: DeliveryStatus;
  assignedAt: string;
}

export interface DomainPrescription {
  id: string;
  customerId: string;
  orderId?: string | null;
  fileKey: string;
  fileUrl?: string | null;
  status: PrescriptionStatus;
  uploadedAt: string;
}

export interface DomainInventoryTransaction {
  id: string;
  inventoryItemId: string;
  type: InventoryTransactionType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  actorUserId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface BulkOperationResult {
  success: boolean;
  affectedCount: number;
  message?: string;
}

