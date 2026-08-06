/**
 * شاشة الديون — الزبائن المدينون (القرار 25)
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/state/useAppStore';
import { Order } from '../src/data/model/Order';

export default function DebtsScreen() {
  const router = useRouter();
  const customers = useAppStore((s) => s.customers);
  const orders = useAppStore((s) => s.orders);

  // تجميع المتبقي لكل زبون من طلباته
  const debtByCustomer = new Map<string, { total: number; count: number }>();
  orders.forEach((o: Order) => {
    if (o.remainingAmount > 0 && o.status !== 'cancelled') {
      const cur = debtByCustomer.get(o.customerId) || { total: 0, count: 0 };
      debtByCustomer.set(o.customerId, { total: cur.total + o.remainingAmount, count: cur.count + 1 });
    }
  });

  const debtors = customers
    .filter((c) => (debtByCustomer.get(c.id)?.total || 0) > 0)
    .map((c) => ({ customer: c, ...debtByCustomer.get(c.id)! }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = debtors.reduce((s, d) => s + d.total, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>💳 الديون</Text>
      <Text style={styles.subtitle}>إجمالي المستحقات: {grandTotal.toLocaleString()} ر.ي</Text>

      {debtors.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا توجد ديون 🎉</Text>
        </View>
      ) : (
        debtors.map(({ customer, total, count }) => (
          <Pressable
            key={customer.id}
            style={styles.card}
            onPress={() => router.push(`/customer/${customer.id}`)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.name}>{customer.name}</Text>
              <Text style={styles.amount}>{total.toLocaleString()} ر.ي</Text>
            </View>
            <Text style={styles.count}>{count} طلب عليه متبقي</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#F59E0B', fontWeight: '700', marginBottom: 16 },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#64748B' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  amount: { fontSize: 16, fontWeight: '800', color: '#DC2626' },
  count: { fontSize: 13, color: '#64748B', marginTop: 4 },
});
