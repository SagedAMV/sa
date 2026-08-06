/**
 * التقارير — الأرباح/الخسارة، المبيعات/المشتريات، التصدير
 * ملاحظة: الربح يُحسب بنفس العملة فقط (القرار 8)
 */

import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useAppStore } from '../src/state/useAppStore';

export default function ReportsScreen() {
  const orders = useAppStore((s) => s.orders);
  const products = useAppStore((s) => s.products);

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'delivered');
    const totalSales = delivered.reduce((s, o) => s + o.totalAmount, 0);
    const totalPaid = delivered.reduce((s, o) => s + o.paidAmount, 0);
    // الربح التقريبي: قيمة البيع في الطلب ناقص ما سُجّل مدفوعًا فعليًا للمحلات.
    const totalProfit = delivered.reduce((s, o) => {
      const sell = o.totalAmount;
      const buy = o.segments.reduce(
        (sum, seg) => sum + (Number.isFinite(seg.paidActualAmount) ? seg.paidActualAmount : 0),
        0,
      );
      return s + (sell - buy);
    }, 0);

    return {
      totalSales,
      totalPaid,
      totalProfit,
      orderCount: delivered.length,
      productCount: products.length,
    };
  }, [orders, products]);

  function handleExport() {
    // المرحلة 10 — تصدير Excel/CSV
    Alert.alert('تصدير', 'تصدير Excel/CSV سيُضاف في المرحلة 10 من خطة البناء.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📊 التقارير</Text>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>إجمالي المبيعات (تم التسليم)</Text>
        <Text style={styles.statValue}>{stats.totalSales.toLocaleString()} ر.ي</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>إجمالي المقبوض</Text>
        <Text style={styles.statValue}>{stats.totalPaid.toLocaleString()} ر.ي</Text>
      </View>
      <View style={[styles.statCard, { borderColor: '#F59E0B' }]}>
        <Text style={styles.statLabel}>الربح التقريبي (نفس العملة)</Text>
        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.totalProfit.toLocaleString()} ر.ي</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>الطلبات المُسلَّمة</Text>
        <Text style={styles.statValue}>{stats.orderCount}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>عدد الأصناف</Text>
        <Text style={styles.statValue}>{stats.productCount}</Text>
      </View>

      <Pressable style={styles.exportBtn} onPress={handleExport}>
        <Text style={styles.exportText}>📥 تصدير تقرير (Excel/CSV)</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  statLabel: { fontSize: 14, color: '#64748B' },
  statValue: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  exportBtn: { backgroundColor: '#2563EB', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 },
  exportText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
