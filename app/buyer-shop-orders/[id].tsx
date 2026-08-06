/**
 * طلبات المحل (المشتري) — القرار 28
 * يعرض الطلبات المتفرعة على الزبائن داخل هذا المحل، مع صور الأصناف
 * المشتري يؤكد كل شريحة: «تم شراء» / «غير متوفر» + المبلغ المدفوع
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
import { Order, SEGMENT_STATUS } from '../../src/data/model/Order';
import { updateSegmentStatus } from '../../src/data/repository/orderRepository';

export default function BuyerShopOrdersScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const orders = useAppStore((s) => s.orders);
  const shops = useAppStore((s) => s.shops);
  const user = useAppStore((s) => s.user);

  const shop = shops.find((s) => s.id === shopId);
  const [paidAmount, setPaidAmount] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled',
  );

  /** شرائح هذا المحل المتبقية */
  const pendingSegments = activeOrders.flatMap((order) =>
    order.segments
      .filter((seg) => seg.shopId === shopId && seg.status === SEGMENT_STATUS.PENDING)
      .map((seg) => ({ order, seg })),
  );

  async function handleSegment(order: Order, status: 'purchased' | 'unavailable') {
    if (!user) return;
    const key = `${order.id}_${shopId}`;
    const amount = status === 'purchased' ? Number(paidAmount[key] || 0) : 0;

    if (status === 'purchased' && amount <= 0) {
      Alert.alert('تنبيه', 'أدخل المبلغ المدفوع فعليًا للمحل');
      return;
    }

    setLoadingId(key);
    try {
      await updateSegmentStatus(order.id, shopId, status, amount, user.id);
      setPaidAmount((prev) => ({ ...prev, [key]: '' }));
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر الحفظ');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🏪 {shop?.name || 'المحل'}</Text>
      <Text style={styles.subtitle}>طلبات هذا المحل (متفرعة على الزبائن)</Text>

      {pendingSegments.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>انتهت طلبات هذا المحل ✅</Text>
        </View>
      ) : (
        pendingSegments.map(({ order, seg }) => {
          const key = `${order.id}_${shopId}`;
          const loading = loadingId === key;
          return (
            <View key={key} style={styles.orderCard}>
              {/* رأس الطلب */}
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.customerName}>👤 {order.customerName}</Text>
                  {order.customerPhone ? (
                    <Text style={styles.customerPhone}>{order.customerPhone}</Text>
                  ) : null}
                </View>
                <Text style={styles.expected}>متوقع: {seg.expectedAmount.toLocaleString()} ر.ي</Text>
              </View>

              {/* أصناف هذه الشريحة بصورها — لعرضها على صاحب المحل */}
              <View style={styles.itemsRow}>
                {seg.items.map((item, idx) => (
                  <View key={idx} style={styles.itemBox}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                    ) : (
                      <View style={[styles.itemImage, styles.noImage]}>
                        <Text style={styles.noImageText}>لا صورة</Text>
                      </View>
                    )}
                    <Text style={styles.itemQty}>
                      {item.quantity} × {(item.price * item.quantity).toLocaleString()}
                    </Text>
                    {item.size ? <Text style={styles.itemAttr}>{item.size}</Text> : null}
                    {item.color ? <Text style={styles.itemAttr}>{item.color}</Text> : null}
                  </View>
                ))}
              </View>

              {/* حقل المبلغ المدفوع */}
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="المبلغ المدفوع فعليًا (ر.ي)"
                value={paidAmount[key] || ''}
                onChangeText={(v) => setPaidAmount((prev) => ({ ...prev, [key]: v }))}
              />

              {/* أزرار الشريحة */}
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.btn, styles.btnPurchased, loading && styles.btnDisabled]}
                  onPress={() => handleSegment(order, 'purchased')}
                  disabled={loading}
                >
                  <Text style={styles.btnText}>✅ تم شراء</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnUnavailable, loading && styles.btnDisabled]}
                  onPress={() => handleSegment(order, 'unavailable')}
                  disabled={loading}
                >
                  <Text style={styles.btnText}>⚠️ غير متوفر</Text>
                </Pressable>
              </View>
            </View>
          );
        })
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
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  customerName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  customerPhone: { fontSize: 13, color: '#64748B' },
  expected: { fontSize: 13, color: '#F59E0B', fontWeight: '700' },
  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemBox: { width: 90, alignItems: 'center' },
  itemImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#F1F5F9' },
  noImage: { justifyContent: 'center', alignItems: 'center' },
  noImageText: { fontSize: 10, color: '#94A3B8' },
  itemQty: { fontSize: 12, color: '#334155', marginTop: 4, fontWeight: '600' },
  itemAttr: { fontSize: 11, color: '#64748B' },
  amountInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginTop: 12,
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  btnPurchased: { backgroundColor: '#10B981' },
  btnUnavailable: { backgroundColor: '#F59E0B' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
