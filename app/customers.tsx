/**
 * قائمة الزبائن — بحث فوري + إضافة + الاقتراح التلقائي
 *
 * ✅ تم الإصلاح: إضافة معالجة أخطاء في handleAdd
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/state/useAppStore';
import { addCustomer, searchCustomers } from '../src/data/repository/customerRepository';
import { CUSTOMER_LEVEL_LABELS } from '../src/utils/constants';

export default function CustomersScreen() {
  const router = useRouter();
  const customers = useAppStore((s) => s.customers);
  const user = useAppStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const filtered = searchCustomers(customers, search);

  async function handleAdd() {
    if (!user || !name.trim()) return;
    try {
      await addCustomer(user.workspaceId, { name: name.trim(), phone: phone.trim() || undefined });
      setName('');
      setPhone('');
      setShowAdd(false);
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر إضافة الزبون');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 الزبائن</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnText}>{showAdd ? 'إغلاق' : '+ زبون'}</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="🔍 بحث فوري…"
        value={search}
        onChangeText={setSearch}
      />

      {showAdd ? (
        <View style={styles.addBox}>
          <TextInput style={styles.input} placeholder="اسم الزبون" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="رقم الهاتف (اختياري)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Pressable style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveText}>إضافة</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>لا يوجد زبائن بعد</Text>
          </View>
        ) : (
          filtered.map((c) => (
            <Pressable key={c.id} style={styles.card} onPress={() => router.push(`/customer/${c.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.level}>{CUSTOMER_LEVEL_LABELS[c.level]}</Text>
              </View>
              {c.phone ? <Text style={styles.phone}>{c.phone}</Text> : null}
              {c.totalDebt > 0 ? (
                <Text style={styles.debt}>دين: {c.totalDebt.toLocaleString()} ر.ي</Text>
              ) : null}
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
  addBtnText: { color: '#FFFFFF', fontWeight: '700' },
  search: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 10 },
  addBox: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 8 },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 10, padding: 12, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  list: { padding: 20, paddingBottom: 100 },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#64748B' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  level: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  phone: { fontSize: 13, color: '#64748B', marginTop: 4 },
  debt: { fontSize: 13, color: '#F59E0B', marginTop: 4, fontWeight: '600' },
});
