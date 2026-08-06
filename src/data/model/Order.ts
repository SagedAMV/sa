/**
 * نماذج الطلب والشريحة والدفعات والسجل — قلب التطبيق
 * مطابقة للقرارات: شرائح حسب المحل (28) + المدفوع/المتبقي (25) + الحالات
 */

import type { Currency } from './Product';

/** حالات الطلب — ثوابت موحدة من «01-التسميات» */
export const ORDER_STATUS = {
  NEW: 'new',
  PURCHASING: 'purchasing',
  PURCHASED: 'purchased',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/** حالات الشريحة */
export const SEGMENT_STATUS = {
  PENDING: 'pending',
  PURCHASED: 'purchased',
  UNAVAILABLE: 'unavailable',
} as const;
export type SegmentStatus = (typeof SEGMENT_STATUS)[keyof typeof SEGMENT_STATUS];

/** صنف داخل شريحة (SegmentItem) */
export interface SegmentItem {
  productId: string;
  imageUrl: string;
  name?: string;
  quantity: number;
  price: number;
  currency: Currency;
  size?: string;
  color?: string;
  model?: string;
}

/** شريحة طلب = مجموعة أصناف من محل واحد (القرار 28) */
export interface OrderSegment {
  shopId: string;
  shopName: string;
  status: SegmentStatus;
  items: SegmentItem[];
  /** المبلغ المدفوع فعليًا للمحل (القرار 12) */
  paidActualAmount: number;
  /** المبلغ المتوقع دفعه */
  expectedAmount: number;
}

export interface Order {
  id: string;
  workspaceId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  status: OrderStatus;
  segments: OrderSegment[];
  totalAmount: number;
  currency: Currency;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  updatedBy: string;
}

/** أنواع الدفعات */
export const PAYMENT_TYPE = {
  ADVANCE: 'advance',
  DELIVERY: 'delivery',
  DEBT: 'debt',
} as const;
export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: Currency;
  type: PaymentType;
  note?: string;
  createdAt: number;
}

/** سجل حركات الطلب */
export interface OrderLog {
  id: string;
  orderId: string;
  userId: string;
  action: string;
  details?: string;
  timestamp: number;
}
