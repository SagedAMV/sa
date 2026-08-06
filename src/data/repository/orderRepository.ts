/**
 * مستودع الطلبات — قلب التطبيق
 * يشمل: الشرائح حسب المحل (28)، المدفوع/المتبقي (25)، «آخر تعديل يكسب» (10)
 * وتحديث الحالة تلقائيًا عند اكتمال كل الشرائح (19)
 */

import {
  createData,
  updateData,
  deleteData,
  listByWorkspace,
  listenCollection,
  getData,
} from '../firebase/firestore';
import {
  Order,
  OrderSegment,
  SegmentItem,
  ORDER_STATUS,
  SEGMENT_STATUS,
  Payment,
  OrderLog,
  PAYMENT_TYPE,
} from '../model/Order';
import { uid } from './authRepository';

/** إنشاء طلب جديد — الحالة «جديد» */
export async function createOrder(
  workspaceId: string,
  data: Omit<Order, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'updatedBy'>,
  userId: string,
): Promise<Order> {
  const order: Order = {
    ...data,
    id: uid(),
    workspaceId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    updatedBy: userId,
  };
  await createData('orders', order.id, order);
  await logAction(order.id, userId, 'created', 'تم إنشاء الطلب');
  return order;
}

/** حساب إجمالي الطلب من شرائحه (البيع) */
export function computeTotals(order: Order) {
  const total = order.segments.reduce(
    (sum, seg) =>
      sum + seg.items.reduce((s, it) => s + it.price * it.quantity, 0),
    0,
  );
  return {
    totalAmount: total,
    remainingAmount: Math.max(0, total - order.paidAmount),
  };
}

/** هل اكتملت كل الشرائح شراءً؟ */
function allSegmentsPurchased(segments: OrderSegment[]): boolean {
  return segments.length > 0 && segments.every((s) => s.status === SEGMENT_STATUS.PURCHASED);
}

/** تحديث حالة الطلب تلقائيًا عند تغيير الشرائح */
export function deriveOrderStatus(order: Order): Order['status'] {
  // القواعد المنطقية للحالة
  const segs = order.segments;
  const hasUnavailable = segs.some((s) => s.status === SEGMENT_STATUS.UNAVAILABLE);
  const allPurchased = allSegmentsPurchased(segs);
  const nonePurchased = segs.every((s) => s.status === SEGMENT_STATUS.PENDING);

  if (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.DELIVERED) {
    return order.status; // لا نغيّر الحالات النهائية
  }
  if (hasUnavailable) {
    // «غير متوفر» — يبقى للمالك ليتصرف (بديل/إلغاء/إكمال)
    return order.status === ORDER_STATUS.PURCHASING ? order.status : ORDER_STATUS.PURCHASING;
  }
  if (allPurchased) {
    return order.status === ORDER_STATUS.PURCHASING ? ORDER_STATUS.PURCHASED : order.status;
  }
  if (nonePurchased && order.status === ORDER_STATUS.NEW) {
    return order.status;
  }
  return ORDER_STATUS.PURCHASING;
}

/** تحديث شريحة (المشتري: تم شراء / غير متوفر) — القرارات 9، 19، 28 */
export async function updateSegmentStatus(
  orderId: string,
  shopId: string,
  status: 'purchased' | 'unavailable',
  paidActualAmount: number,
  userId: string,
) {
  const order = await getData<Order>('orders', orderId);
  if (!order) throw new Error('الطلب غير موجود');

  const segments = order.segments.map((seg) =>
    seg.shopId === shopId
      ? { ...seg, status, paidActualAmount: status === 'purchased' ? paidActualAmount : seg.paidActualAmount }
      : seg,
  );

  const updated: Order = { ...order, segments, updatedBy: userId, updatedAt: Date.now() };
  const newStatus = deriveOrderStatus(updated);
  updated.status = newStatus;

  await updateData('orders', orderId, {
    segments: updated.segments,
    status: newStatus,
    updatedAt: Date.now(),
    updatedBy: userId,
  });

  await logAction(orderId, userId, 'segment_status', `${shopId}: ${status}، المدفوع ${paidActualAmount}`);
  return updated;
}

/** تسجيل دفعة من الزبون (مقدم/تسليم/سداد دين) — القرار 25 */
export async function recordPayment(
  workspaceId: string,
  orderId: string,
  customerId: string,
  amount: number,
  type: Payment['type'],
  userId: string,
) {
  // ✅ جلب العملة من الطلب بدلاً من hardcode
  const order = await getData<Order>('orders', orderId);
  const currency = order?.currency || 'YER';

  const payment: Payment = {
    id: uid(),
    orderId,
    customerId,
    amount,
    currency,
    type,
    createdAt: Date.now(),
  };
  await createData('payments', payment.id, payment);

  // تحديث المدفوع/المتبقي في الطلب
  if (order) {
    const paidAmount = order.paidAmount + amount;
    await updateData('orders', orderId, {
      paidAmount,
      remainingAmount: Math.max(0, order.totalAmount - paidAmount),
      updatedAt: Date.now(),
      updatedBy: userId,
    });
  }

  await logAction(orderId, userId, 'payment', `دفعة ${amount} ${currency}`);
  return payment;
}

/** تغيير حالة الطلب (المالك) */
export async function changeOrderStatus(orderId: string, status: Order['status'], userId: string) {
  await updateData('orders', orderId, {
    status,
    updatedAt: Date.now(),
    updatedBy: userId,
  });
  await logAction(orderId, userId, 'status_changed', status);
}

/** حذف طلب (النهائي — المالك) */
export async function deleteOrder(orderId: string) {
  await deleteData('orders', orderId);
}

/** سجل الحركات */
async function logAction(orderId: string, userId: string, action: string, details?: string) {
  const log: OrderLog = {
    id: uid(),
    orderId,
    userId,
    action,
    details,
    timestamp: Date.now(),
  };
  await createData('order_logs', log.id, log);
}

/* ===== الاستماع المباشر ===== */

export function listenOrders(workspaceId: string, onData: (items: Order[]) => void) {
  return listenCollection<Order>('orders', workspaceId, onData);
}

export async function listOrders(workspaceId: string): Promise<Order[]> {
  return listByWorkspace<Order>('orders', workspaceId);
}

export { PAYMENT_TYPE };
