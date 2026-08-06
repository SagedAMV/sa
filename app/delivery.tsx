/**
 * شاشة التسليم — الطلبات «قيد التسليم»
 * تأكيد «تم التسليم» (صلاحية المالك، ويمكن منحها للمشتري — القرار 23)
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/state/useAppStore';
import { changeOrderStatus, recordPayment } from '../src/data/repository/orderRepository';
import { ORDER_STATUS } from '../src/data/model/Order';

export default function DeliveryScreen() {
  const router = useRouter();
  const orders = useAppStore((s) => s.orders);
  const user = useAppStore((s) => s.user);
  const hasPerm = useAppStore((s) => s.hasPermission);

  const delivering = orders.filter((o) => o.status === ORDER_STATUS.DELIVERING);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!hasPerm('delivery.view')) {
    return (
      <View style={styles.center}>
        <Text style={styles.noAccess}>لا تملك صلاحية عرض التسليم</Text>
      </View>
    );
  }

  async function handleDeliver(orderId: string) {
    if (!user || !hasPerm('delivery.confirm')) return;
    const amount = Number(amounts[orderId] || 0);
    setBusyId(orderId);
    try {
      // تسجيل الدفعة عند التسليم إن وُجدت
      if (amount > 0) {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          await recordPayment(user.workspaceId, orderId, order.customerId, amount, 'delivery', user.id);
        }
      }
      await changeOrderStatus(orderId, ORDER_STATUS.DELIVERED, user.id);
      Alert.alert('تم', 'تم تسليم الطلب ✅');
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📦 التسليم</Text>
      <Text style={styles.subtitle}>الطلبات الجاهزة للتسليم</Text>

      {delivering.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا توجد طلبات قيد التسليم</Text>
        </View>
      ) : (
        delivering.map((o) => (
          <View key={o.id} style={styles.card}>
            <Pressable onPress={() => router.push(`/order/${o.id}`)}>
              <Text style={styles.customer}>{o.customerName}</Text>
              <Text style={styles.meta}>
                {o.segments.length} محل • {o.totalAmount.toLocaleString()} {o.currency}
              </Text>
              {o.remainingAmount > 0 ? (
                <Text style={styles.remaining}>المتبقي على الزبون: {o.remainingAmount.toLocaleString()}</Text>
              ) : null}
            </Pressable>

            {o.remainingAmount > 0 ? (
              <TextInput
                style={styles.amountInput}
                placeholder="المبلغ المقبوض الآن (ر.ي)"
                keyboardType="numeric"
                value={amounts[o.id] || ''}
                onChangeText={(v) => setAmounts((prev) => ({ ...prev, [o.id]: v }))}
              />
            ) : null}

            {hasPerm('delivery.confirm') ? (
              <Pressable
                style={[styles.deliverBtn, busyId === o.id && styles.disabled]}
                onPress={() => handleDeliver(o.id)}
                disabled={busyId === o.id}
              >
                <Text style={styles.deliverText}>✓ تأكيد التسليم</Text>
              </Pressable>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noAccess: { color: '#DC2626', fontSize: 15 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#64748B' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  customer: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  meta: { fontSize: 13, color: '#64748B', marginTop: 4 },
  remaining: { fontSize: 13, color: '#F59E0B', marginTop: 4, fontWeight: '600' },
  amountInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, marginTop: 10 },
  deliverBtn: { backgroundColor: '#10B981', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  deliverText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
