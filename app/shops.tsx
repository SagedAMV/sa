/**
 * قائمة المحلات + تفاصيل المحل (الأصناف) — المالك
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/state/useAppStore';
import { listShops, addShop, deleteShop } from '../src/data/repository/customerRepository';
import { productsOfShop } from '../src/data/repository/productRepository';

export default function ShopsScreen() {
  const router = useRouter();
  const shops = useAppStore((s) => s.shops);
  const products = useAppStore((s) => s.products);
  const user = useAppStore((s) => s.user);
  const hasPerm = useAppStore((s) => s.hasPermission);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  async function handleAdd() {
    if (!user || !name.trim()) return;
    await addShop(user.workspaceId, { name: name.trim(), category: category.trim() || undefined });
    setName('');
    setCategory('');
    setShowAdd(false);
  }

  async function handleDelete(shopId: string, shopName: string) {
    Alert.alert('حذف محل', `حذف «${shopName}»؟ ستُحذف أصنافه.`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteShop(shopId) },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🏪 المحلات</Text>
        {hasPerm('shops.add') ? (
          <Pressable style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
            <Text style={styles.addBtnText}>{showAdd ? 'إغلاق' : '+ محل'}</Text>
          </Pressable>
        ) : null}
      </View>

      {showAdd ? (
        <View style={styles.addBox}>
          <TextInput style={styles.input} placeholder="اسم المحل" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="نوع البضاعة (اختياري)" value={category} onChangeText={setCategory} />
          <Pressable style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveText}>إضافة</Text>
          </Pressable>
        </View>
      ) : null}

      {shops.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا توجد محلات بعد — أضف أول محل</Text>
        </View>
      ) : (
        shops.map((shop) => {
          const count = productsOfShop(products, shop.id).length;
          return (
            <Pressable key={shop.id} style={styles.card} onPress={() => router.push(`/shop/${shop.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.shopName}>{shop.name}</Text>
                {hasPerm('shops.delete') ? (
                  <Pressable onPress={() => handleDelete(shop.id, shop.name)} hitSlop={10}>
                    <Text style={styles.deleteIcon}>🗑</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.cardMeta}>
                {category ? `${category} • ` : ''}{count} صنف
              </Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  addBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700' },
  addBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 8 },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 10, padding: 12, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#64748B' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopName: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  deleteIcon: { fontSize: 16 },
  cardMeta: { fontSize: 13, color: '#64748B', marginTop: 6 },
});
