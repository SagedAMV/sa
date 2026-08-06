/**
 * تفاصيل المحل — الأصناف (بالصور والأسعار) + إضافة صنف
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
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../../src/state/useAppStore';
import { productsOfShop, addProduct, deleteProduct } from '../../src/data/repository/productRepository';
import { uploadImage } from '../../src/data/firebase/storage';
import { Currency } from '../../src/data/model/Product';

export default function ShopDetailScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const shops = useAppStore((s) => s.shops);
  const products = useAppStore((s) => s.products);
  const user = useAppStore((s) => s.user);

  const shop = shops.find((s) => s.id === shopId);
  const shopProducts = productsOfShop(products, shopId);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('YER');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
      if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
    } catch (e: any) {
      Alert.alert('تعذر اختيار الصورة', e.message || 'تحقق من إذن الوصول إلى الصور');
    }
  }

  async function handleAdd() {
    if (!user) {
      Alert.alert('تعذر الحفظ', 'سجّل الدخول أولًا');
      return;
    }
    if (!shop) {
      Alert.alert('تعذر الحفظ', 'المحل غير موجود');
      return;
    }
    if (!imageUri) {
      Alert.alert('تنبيه', 'الصورة أساسية — اختر صورة الصنف');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadImage(imageUri, user.workspaceId, 'products');
      await addProduct(user.workspaceId, {
        shopId,
        name: name.trim() || undefined,
        imageUrl,
        buyPrice: Number(buyPrice) || 0,
        sellPrice: Number(sellPrice) || 0,
        buyCurrency: currency,
        sellCurrency: currency,
        size: size.trim() || undefined,
        color: color.trim() || undefined,
      });
      setShowAdd(false);
      setName(''); setBuyPrice(''); setSellPrice(''); setSize(''); setColor(''); setImageUri(null);
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر حفظ الصنف');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🏪 {shop?.name || 'المحل'}</Text>
      <Text style={styles.subtitle}>{shopProducts.length} صنف</Text>

      <Pressable style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
        <Text style={styles.addBtnText}>{showAdd ? 'إغلاق' : '+ إضافة صنف'}</Text>
      </Pressable>

      {showAdd ? (
        <View style={styles.form}>
          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.pickedImage} />
            ) : (
              <Text style={styles.imagePickerText}>📷 اختر صورة الصنف (أساسية)</Text>
            )}
          </Pressable>
          <TextInput style={styles.input} placeholder="اسم الصنف (اختياري)" value={name} onChangeText={setName} />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="سعر الشراء" keyboardType="numeric" value={buyPrice} onChangeText={setBuyPrice} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="سعر البيع" keyboardType="numeric" value={sellPrice} onChangeText={setSellPrice} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="مقاس (اختياري)" value={size} onChangeText={setSize} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="لون (اختياري)" value={color} onChangeText={setColor} />
          </View>
          <Pressable style={[styles.saveBtn, saving && styles.disabled]} onPress={handleAdd} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'جارٍ الحفظ…' : 'حفظ الصنف'}</Text>
          </Pressable>
        </View>
      ) : null}

      {shopProducts.map((p) => (
        <View key={p.id} style={styles.productCard}>
          <Image source={{ uri: p.imageUrl }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{p.name || 'بدون اسم'}</Text>
            <Text style={styles.productMeta}>
              شراء: {p.buyPrice} {p.buyCurrency} • بيع: {p.sellPrice} {p.sellCurrency}
            </Text>
            {p.size || p.color ? (
              <Text style={styles.productAttrs}>{[p.size, p.color, p.model].filter(Boolean).join(' • ')}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 14 },
  addBtn: { backgroundColor: '#2563EB', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 14 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700' },
  form: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  imagePicker: { height: 120, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
  pickedImage: { width: '100%', height: '100%' },
  imagePickerText: { color: '#64748B', fontSize: 14 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 10, padding: 12, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  productCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  productImage: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#F1F5F9' },
  productInfo: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  productMeta: { fontSize: 13, color: '#64748B', marginTop: 4 },
  productAttrs: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
