/**
 * ملف الزبون — معلوماته + طلباته + ديونه
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../src/state/useAppStore';
import { CUSTOMER_LEVEL_LABELS } from '../../src/utils/constants';

export default function CustomerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const customers = useAppStore((s) => s.customers);
  const orders = useAppStore((s) => s.orders);

  const customer = customers.find((c) => c.id === id);
  const customerOrders = orders.filter((o) => o.customerId === id);

  if (!customer) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>الزبون غير موجود</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{customer.name}</Text>
      {customer.phone ? <Text style={styles.phone}>📞 {customer.phone}</Text> : null}
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>مستوى: {CUSTOMER_LEVEL_LABELS[customer.level]}</Text>
      </View>

      {customer.totalDebt > 0 ? (
        <View style={styles.debtBox}>
          <Text style={styles.debtText}>الدين الإجمالي: {customer.totalDebt.toLocaleString()} ر.ي</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>طلباته ({customerOrders.length})</Text>
      {customerOrders.map((o) => (
        <Pressable
          key={o.id}
          style={styles.orderCard}
          onPress={() => router.push(`/order/${o.id}`)}
        >
          <View style={styles.orderTop}>
            <Text style={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString('ar')}</Text>
            <Text style={styles.orderTotal}>{o.totalAmount.toLocaleString()} ر.ي</Text>
          </View>
          <Text style={styles.orderStatus}>{o.status}</Text>
          {o.remainingAmount > 0 ? (
            <Text style={styles.orderRemaining}>متبقي: {o.remainingAmount.toLocaleString()}</Text>
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: '#64748B' },
  name: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  phone: { fontSize: 14, color: '#64748B', marginTop: 4 },
  levelBadge: { alignSelf: 'flex-start', backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10 },
  levelText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  debtBox: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginTop: 14 },
  debtText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 24, marginBottom: 12 },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between' },
  orderDate: { fontSize: 13, color: '#64748B' },
  orderTotal: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  orderStatus: { fontSize: 13, color: '#2563EB', marginTop: 4 },
  orderRemaining: { fontSize: 13, color: '#F59E0B', marginTop: 4, fontWeight: '600' },
});
