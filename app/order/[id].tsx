/**
 * تفاصيل الطلب — المالك
 * الشرائح حسب المحل + الأسعار + المدفوع/المتبقي + تسجيل دفعة + سجل الحركات
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../src/state/useAppStore';
import { recordPayment, changeOrderStatus, deleteOrder } from '../../src/data/repository/orderRepository';
import { ORDER_STATUS, SEGMENT_STATUS, Order } from '../../src/data/model/Order';

const STATUS_LABELS: Record<string, string> = {
  new: 'جديد',
  purchasing: 'قيد الشراء',
  purchased: 'تم الشراء',
  delivering: 'قيد التسليم',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const SEG_LABELS: Record<string, string> = {
  pending: 'لم يُشترَ بعد',
  purchased: 'تم شراء الشريحة',
  unavailable: 'غير متوفر في المحل',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orders = useAppStore((s) => s.orders);
  const user = useAppStore((s) => s.user);
  const hasPerm = useAppStore((s) => s.hasPermission);

  const order = orders.find((o) => o.id === id);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [busy, setBusy] = useState(false);

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>الطلب غير موجود</Text>
      </View>
    );
  }
  // مرجع غير nullable للاستخدام داخل الدوال المغلقة
  const currentOrder: Order = order;

  async function handlePayment() {
    if (!user) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      Alert.alert('تنبيه', 'أدخل مبلغًا صحيحًا');
      return;
    }
    setBusy(true);
    try {
      await recordPayment(user.workspaceId, currentOrder.id, currentOrder.customerId, amount, 'delivery', user.id);
      setPaymentAmount('');
      Alert.alert('تم', 'تم تسجيل الدفعة');
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStatus(next: string) {
    if (!user) return;
    setBusy(true);
    try {
      await changeOrderStatus(currentOrder.id, next as any, user.id);
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    Alert.alert('حذف نهائي', 'هل أنت متأكد؟ لا يمكن التراجع.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await deleteOrder(currentOrder.id);
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.customer}>{order.customerName}</Text>
        {order.customerPhone ? <Text style={styles.phone}>{order.customerPhone}</Text> : null}
        <View style={[styles.statusBadge, { backgroundColor: statusColor(order.status) }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[order.status]}</Text>
        </View>
      </View>

      {/* الشرائح حسب المحل */}
      {order.segments.map((seg, si) => (
        <View key={si} style={styles.segment}>
          <View style={styles.segmentHeader}>
            <Text style={styles.shopName}>🏪 {seg.shopName}</Text>
            <Text style={[styles.segStatus, { color: segColor(seg.status) }]}>
              {SEG_LABELS[seg.status]}
            </Text>
          </View>
          {seg.paidActualAmount > 0 ? (
            <Text style={styles.paidInfo}>مدفوع فعليًا: {seg.paidActualAmount.toLocaleString()} ر.ي</Text>
          ) : null}

          {seg.items.map((item, ii) => (
            <View key={ii} style={styles.itemRow}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              ) : null}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.name || 'بدون اسم'}
                  {item.size ? ` • ${item.size}` : ''}
                  {item.color ? ` • ${item.color}` : ''}
                </Text>
                <Text style={styles.itemQty}>
                  {item.quantity} × {item.price.toLocaleString()} = {(item.quantity * item.price).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* المبالغ */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.totalValue}>{order.totalAmount.toLocaleString()} {order.currency}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>المدفوع</Text>
          <Text style={[styles.totalValue, { color: '#10B981' }]}>{order.paidAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>المتبقي</Text>
          <Text style={[styles.totalValue, { color: order.remainingAmount > 0 ? '#F59E0B' : '#10B981' }]}>
            {order.remainingAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* تسجيل دفعة */}
      {order.remainingAmount > 0 && hasPerm('customers.manageDebts') ? (
        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>تسجيل دفعة من الزبون</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.paymentInput}
              placeholder="المبلغ (ر.ي)"
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
            />
            <Pressable style={[styles.paymentBtn, busy && styles.disabled]} onPress={handlePayment} disabled={busy}>
              <Text style={styles.paymentBtnText}>تسجيل</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* تغيير الحالة */}
      <View style={styles.statusActions}>
        {order.status === ORDER_STATUS.PURCHASED && hasPerm('orders.changeStatus') ? (
          <Pressable style={[styles.actionBtn, { backgroundColor: '#F97316' }]} onPress={() => handleStatus(ORDER_STATUS.DELIVERING)}>
            <Text style={styles.actionText}>→ قيد التسليم</Text>
          </Pressable>
        ) : null}
        {order.status === ORDER_STATUS.DELIVERING && hasPerm('delivery.confirm') ? (
          <Pressable style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => handleStatus(ORDER_STATUS.DELIVERED)}>
            <Text style={styles.actionText}>✓ تم التسليم</Text>
          </Pressable>
        ) : null}
        {order.status === ORDER_STATUS.NEW && hasPerm('orders.changeStatus') ? (
          <Pressable style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]} onPress={() => handleStatus(ORDER_STATUS.PURCHASING)}>
            <Text style={styles.actionText}>→ إرسال للشراء</Text>
          </Pressable>
        ) : null}
      </View>

      {/* حذف (نهائي — مالك) */}
      {hasPerm('orders.delete') ? (
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>🗑 حذف الطلب نهائيًا</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function statusColor(s: string): string {
  const map: Record<string, string> = {
    new: '#3B82F6',
    purchasing: '#F59E0B',
    purchased: '#8B5CF6',
    delivering: '#F97316',
    delivered: '#10B981',
    cancelled: '#94A3B8',
  };
  return map[s] || '#94A3B8';
}

function segColor(s: string): string {
  return s === SEGMENT_STATUS.PURCHASED ? '#10B981' : s === SEGMENT_STATUS.UNAVAILABLE ? '#F59E0B' : '#94A3B8';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 16, color: '#64748B' },
  header: { marginBottom: 16 },
  customer: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  phone: { fontSize: 14, color: '#64748B', marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8 },
  statusText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  segment: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  segmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  shopName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  segStatus: { fontSize: 12, fontWeight: '600' },
  paidInfo: { fontSize: 12, color: '#10B981', marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  itemImage: { width: 44, height: 44, borderRadius: 8, marginRight: 10, backgroundColor: '#F1F5F9' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  itemQty: { fontSize: 13, color: '#64748B' },
  totals: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalLabel: { fontSize: 15, color: '#334155' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  paymentBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  paymentTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  paymentInput: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 15 },
  paymentBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center' },
  paymentBtnText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  statusActions: { gap: 10, marginBottom: 14 },
  actionBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteBtn: { borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#FEE2E2' },
  deleteText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },
});
