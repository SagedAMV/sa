/**
 * شاشة المحلات الذكية (المشتري) — القرار 30
 * كل محل يعرض: عدد الطلبات المتبقية + عدد الزبائن + المبلغ المتوقع دفعه
 * (يمكّن المشتري من معرفة مسار حركته فور فتح التطبيق)
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/state/useAppStore';
import { Order, SEGMENT_STATUS } from '../src/data/model/Order';

export default function BuyerShopsScreen() {
  const router = useRouter();
  const shops = useAppStore((s) => s.shops);
  const orders = useAppStore((s) => s.orders);

  /** الطلبات النشطة (لم تُسلَّم ولم تُلغَ) */
  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled',
  );

  /** تجميع الطلبات لكل محل (حسب الشرائح المتبقية) */
  const shopStats = shops.map((shop) => {
    const pendingSegments = activeOrders.flatMap((order) =>
      order.segments
        .filter((seg) => seg.shopId === shop.id && seg.status === SEGMENT_STATUS.PENDING)
        .map((seg) => ({ order, seg })),
    );
    const uniqueCustomers = new Set(pendingSegments.map((p) => p.order.customerId));
    const expectedAmount = pendingSegments.reduce((sum, p) => sum + p.seg.expectedAmount, 0);
    return {
      shop,
      count: pendingSegments.length,
      customers: uniqueCustomers.size,
      expectedAmount,
    };
  }).filter((s) => s.count > 0);

  // ترتيب: الأكثر طلبات أولًا (يسهّل حركة المشتري)
  shopStats.sort((a, b) => b.count - a.count);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🛍️ المحلات الذكية</Text>
      <Text style={styles.subtitle}>حرّك بين المحلات حسب عدد الطلبات</Text>

      {shopStats.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا توجد مهام شراء الآن 🎉</Text>
        </View>
      ) : (
        shopStats.map(({ shop, count, customers, expectedAmount }) => (
          <Pressable
            key={shop.id}
            style={styles.shopCard}
            onPress={() => router.push(`/buyer-shop-orders/${shop.id}`)}
          >
            <View style={styles.shopHeader}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{count} طلب</Text>
              </View>
            </View>
            <View style={styles.shopMeta}>
              <Text style={styles.metaText}>👥 {customers} زبون</Text>
              <Text style={styles.metaText}>💰 {expectedAmount.toLocaleString()} ر.ي</Text>
            </View>
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
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#64748B', fontSize: 15 },
  shopCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  shopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopName: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  countBadge: { backgroundColor: '#2563EB', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  countBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  shopMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  metaText: { fontSize: 14, color: '#64748B' },
});
