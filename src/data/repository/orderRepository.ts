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
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
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
    // قد يبدأ المشتري العمل على طلب «جديد»، لذلك لا نعتمد على تغيير يدوي سابق
    // للحالة كي يصل الطلب إلى «تم الشراء» بعد اكتمال كل الشرائح.
    return ORDER_STATUS.PURCHASED;
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
  if (!Number.isFinite(paidActualAmount) || paidActualAmount < 0) {
    throw new Error('المبلغ المدفوع غير صالح');
  }
  if (status === SEGMENT_STATUS.PURCHASED && paidActualAmount <= 0) {
    throw new Error('أدخل مبلغًا مدفوعًا صحيحًا للمحل');
  }

  return runTransaction(db, async (transaction) => {
    const orderRef = doc(db, 'orders', orderId);
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists()) throw new Error('الطلب غير موجود');
    const order = { ...snapshot.data(), id: snapshot.id } as Order;
    if (!order.segments.some((segment) => segment.shopId === shopId)) {
      throw new Error('المحل غير موجود في الطلب');
    }
    const segments = order.segments.map((segment) => segment.shopId === shopId
      ? { ...segment, status, paidActualAmount: status === SEGMENT_STATUS.PURCHASED ? paidActualAmount : segment.paidActualAmount }
      : segment);
    const updated = { ...order, segments, updatedBy: userId, updatedAt: Date.now() } as Order;
    updated.status = deriveOrderStatus(updated);
    transaction.update(orderRef, {
      segments, status: updated.status, updatedAt: serverTimestamp(), updatedBy: userId,
    });
    const logId = uid();
    transaction.set(doc(db, 'order_logs', logId), {
      id: logId, workspaceId: order.workspaceId, orderId, userId,
      action: 'segment_status', details: `${shopId}: ${status}، المدفوع ${paidActualAmount}`,
      timestamp: serverTimestamp(), createdAt: serverTimestamp(),
    });
    return updated;
  });
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
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('أدخل مبلغًا صحيحًا أكبر من صفر');

  return runTransaction(db, async (transaction) => {
    const orderRef = doc(db, 'orders', orderId);
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists()) throw new Error('الطلب غير موجود');
    const order = { ...snapshot.data(), id: snapshot.id } as Order;
    if (order.workspaceId !== workspaceId || order.customerId !== customerId) {
      throw new Error('بيانات الدفعة لا تطابق الطلب');
    }
    const outstanding = Math.max(0, order.totalAmount - order.paidAmount);
    if (outstanding === 0) throw new Error('الطلب مدفوع بالكامل');
    if (amount > outstanding) throw new Error(`المبلغ أكبر من المتبقي (${outstanding} ${order.currency})`);

    const payment: Payment = {
      id: uid(), orderId, customerId, amount, currency: order.currency,
      type, createdAt: Date.now(),
    };
    const paidAmount = order.paidAmount + amount;
    transaction.set(doc(db, 'payments', payment.id), {
      ...payment, workspaceId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    transaction.update(orderRef, {
      paidAmount, remainingAmount: Math.max(0, order.totalAmount - paidAmount),
      updatedAt: serverTimestamp(), updatedBy: userId,
    });
    const logId = uid();
    transaction.set(doc(db, 'order_logs', logId), {
      id: logId, workspaceId, orderId, userId, action: 'payment',
      details: `دفعة ${amount} ${order.currency}`,
      timestamp: serverTimestamp(), createdAt: serverTimestamp(),
    });
    return payment;
  });
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
  const order = await getData<Order>('orders', orderId);
  if (!order) throw new Error('الطلب غير موجود عند تسجيل الحركة');
  const log: OrderLog = {
    id: uid(), orderId, userId, action, details, timestamp: Date.now(),
  };
  await createData('order_logs', log.id, { ...log, workspaceId: order.workspaceId });
}

/* ===== الاستماع المباشر ===== */

export function listenOrders(workspaceId: string, onData: (items: Order[]) => void) {
  return listenCollection<Order>('orders', workspaceId, onData);
}

export async function listOrders(workspaceId: string): Promise<Order[]> {
  return listByWorkspace<Order>('orders', workspaceId);
}

export { PAYMENT_TYPE };
