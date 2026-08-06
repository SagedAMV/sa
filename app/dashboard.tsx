/**
 * لوحة التحكم — شاشة المالك الرئيسية
 * بطاقات إحصائية ملونة + أزرار سريعة + أحدث الطلبات + حالة الاتصال
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/state/useAppStore';
import { ORDER_STATUS, Order } from '../src/data/model/Order';

function countByStatus(orders: Order[], status: string): number {
  return orders.filter((o) => o.status === status).length;
}

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const orders = useAppStore((s) => s.orders);
  const customers = useAppStore((s) => s.customers);

  const stats = [
    { label: 'طلبات جديدة', value: countByStatus(orders, ORDER_STATUS.NEW), color: '#3B82F6' },
    { label: 'قيد الشراء', value: countByStatus(orders, ORDER_STATUS.PURCHASING), color: '#F59E0B' },
    { label: 'قيد التسليم', value: countByStatus(orders, ORDER_STATUS.DELIVERING), color: '#8B5CF6' },
    { label: 'تم اليوم', value: countByStatus(orders, ORDER_STATUS.DELIVERED), color: '#10B981' },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>مرحبًا 👋</Text>
          <Text style={styles.subGreeting}>{user?.username}</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      {/* البطاقات الإحصائية */}
      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.color }]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* الأزرار السريعة */}
      <View style={styles.quickRow}>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/order-form')}>
          <Text style={styles.quickIcon}>➕</Text>
          <Text style={styles.quickText}>طلب جديد</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/orders')}>
          <Text style={styles.quickIcon}>📋</Text>
          <Text style={styles.quickText}>الطلبات</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/delivery')}>
          <Text style={styles.quickIcon}>📦</Text>
          <Text style={styles.quickText}>التسليم</Text>
        </Pressable>
      </View>

      {/* أحدث الطلبات */}
      <Text style={styles.sectionTitle}>أحدث الطلبات</Text>
      {recentOrders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا توجد طلبات بعد — أنشئ أول طلب 🚀</Text>
        </View>
      ) : (
        recentOrders.map((o) => (
          <Pressable
            key={o.id}
            style={styles.orderCard}
            onPress={() => router.push(`/order/${o.id}`)}
          >
            <View style={styles.orderRow}>
              <Text style={styles.orderName}>{o.customerName}</Text>
              <Text style={styles.orderStatus}>{statusLabel(o.status)}</Text>
            </View>
            <Text style={styles.orderMeta}>
              {o.segments.length} محل • {o.totalAmount.toLocaleString()} {o.currency}
            </Text>
          </Pressable>
        ))
      )}

      <Text style={styles.sectionTitle}>الزبائن</Text>
      <Text style={styles.customerCount}>{customers.length} زبون مسجّل</Text>
    </ScrollView>
  );
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    new: 'جديد',
    purchasing: 'قيد الشراء',
    purchased: 'تم الشراء',
    delivering: 'قيد التسليم',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
  };
  return map[s] || s;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subGreeting: { fontSize: 14, color: '#64748B' },
  onlineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '47%', borderRadius: 16, padding: 18, paddingTop: 24 },
  statValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  statLabel: { color: '#FFFFFF', fontSize: 14, opacity: 0.9, marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickBtn: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  quickIcon: { fontSize: 26 },
  quickText: { fontSize: 13, color: '#334155', marginTop: 6, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12, marginTop: 8 },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#64748B', fontSize: 14 },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  orderName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  orderStatus: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  orderMeta: { fontSize: 13, color: '#64748B', marginTop: 6 },
  customerCount: { fontSize: 15, color: '#334155' },
});
