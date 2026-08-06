/**
 * قائمة الطلبات — المالك
 * بحث فوري + ترشيح بالحالة + إضافة طلب
 *
 * ✅ تم الإصلاح: استخدام ORDER_STATUS_LABELS من constants.ts
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/state/useAppStore';
import { Order, ORDER_STATUS } from '../src/data/model/Order';
import { ORDER_STATUS_LABELS } from '../src/utils/constants';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: ORDER_STATUS.NEW, label: ORDER_STATUS_LABELS.new },
  { key: ORDER_STATUS.PURCHASING, label: ORDER_STATUS_LABELS.purchasing },
  { key: ORDER_STATUS.PURCHASED, label: ORDER_STATUS_LABELS.purchased },
  { key: ORDER_STATUS.DELIVERING, label: ORDER_STATUS_LABELS.delivering },
  { key: ORDER_STATUS.DELIVERED, label: ORDER_STATUS_LABELS.delivered },
];

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  purchasing: '#F59E0B',
  purchased: '#8B5CF6',
  delivering: '#F97316',
  delivered: '#10B981',
  cancelled: '#94A3B8',
};

export default function OrdersScreen() {
  const router = useRouter();
  const orders = useAppStore((s) => s.orders);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = orders.filter((o) => {
    const matchFilter = filter === 'all' || o.status === filter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      o.customerName.toLowerCase().includes(q) ||
      (o.customerPhone || '').includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 الطلبات</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/order-form')}>
          <Text style={styles.addBtnText}>+ جديد</Text>
        </Pressable>
      </View>

      {/* بحث */}
      <TextInput
        style={styles.search}
        placeholder="🔍 بحث بالاسم أو الهاتف…"
        value={search}
        onChangeText={setSearch}
      />

      {/* ترشيح بالحالة */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* القائمة */}
      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>لا توجد طلبات هنا</Text>
          </View>
        ) : (
          filtered.map((o) => (
            <Pressable
              key={o.id}
              style={styles.card}
              onPress={() => router.push(`/order/${o.id}`)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.customer}>{o.customerName}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[o.status] }]}>
                  <Text style={styles.badgeText}>{ORDER_STATUS_LABELS[o.status]}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {o.segments.length} محل • {o.totalAmount.toLocaleString()} {o.currency}
              </Text>
              <Text style={styles.cardDebt}>
                {o.remainingAmount > 0 ? `متبقي: ${o.remainingAmount.toLocaleString()}` : 'مدفوع ✓'}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  addBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  search: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 10 },
  // بدون هذه القيود يتمدّد الـ ScrollView الأفقي عموديًا داخل الحاوية المرنة،
  // فتتحول أزرار الحالات إلى أعمدة طويلة على بعض أجهزة Android.
  filtersRow: { flexGrow: 0, flexShrink: 0, height: 44, marginBottom: 10 },
  filtersContent: { alignItems: 'center', paddingHorizontal: 20 },
  filterChip: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { color: '#334155', fontSize: 13 },
  filterTextActive: { color: '#FFFFFF', fontWeight: '700' },
  list: { padding: 20, paddingBottom: 100 },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#64748B' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customer: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cardMeta: { fontSize: 13, color: '#64748B', marginTop: 8 },
  cardDebt: { fontSize: 13, color: '#F59E0B', marginTop: 4, fontWeight: '600' },
});
