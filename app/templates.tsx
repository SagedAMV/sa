/**
 * قوالب الطلبات الجاهزة — (فكرة القوالب — النسخة الكاملة)
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../src/state/useAppStore';

export default function TemplatesScreen() {
  const templates = useAppStore((s) => s.orders); // placeholder — القوالب كيان مستقل

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📋 قوالب الطلبات</Text>
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>
          قوالب الطلبات الجاهزة ستُضاف في المرحلة 10 (نسخة كاملة).
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#64748B', textAlign: 'center' },
});
