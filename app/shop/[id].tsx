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
import { productsOfShop, addProduct, updateProduct, deleteProduct } from '../../src/data/repository/productRepository';
import { Product } from '../../src/data/model/Product';
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
      if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
    } catch (e: any) {
      Alert.alert('تعذر اختيار الصورة', e.message || 'تحقق من إذن الوصول إلى الصور');
    }
  }

  function resetForm() {
    setShowAdd(false);
    setEditingProduct(null);
    setName(''); setBuyPrice(''); setSellPrice(''); setSize(''); setColor(''); setImageUri(null);
  }

  function startEdit(product: Product) {
    setEditingProduct(product);
    setName(product.name || '');
    setBuyPrice(String(product.buyPrice));
    setSellPrice(String(product.sellPrice));
    setCurrency(product.sellCurrency);
    setSize(product.size || '');
    setColor(product.color || '');
    setImageUri(product.imageUrl);
    setShowAdd(true);
  }

  async function handleSave() {
    if (!user || !shop) {
      Alert.alert('تعذر الحفظ', 'تعذر العثور على بيانات المحل أو المستخدم');
      return;
    }
    if (!imageUri) {
      Alert.alert('تنبيه', 'الصورة أساسية — اختر صورة الصنف');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = imageUri === editingProduct?.imageUrl
        ? imageUri
        : await uploadImage(imageUri, user.workspaceId, 'products');
      const data = {
        shopId,
        name: name.trim() || undefined,
        imageUrl,
        buyPrice: Number(buyPrice) || 0,
        sellPrice: Number(sellPrice) || 0,
        buyCurrency: currency,
        sellCurrency: currency,
        size: size.trim() || undefined,
        color: color.trim() || undefined,
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await addProduct(user.workspaceId, data);
      }
      resetForm();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر حفظ الصنف');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(product: Product) {
    Alert.alert('حذف صنف', `حذف «${product.name || 'هذا الصنف'}»؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive', onPress: async () => {
          try {
            await deleteProduct(product.id);
          } catch (e: any) {
            Alert.alert('خطأ', e.message || 'تعذر حذف الصنف');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🏪 {shop?.name || 'المحل'}</Text>
      <Text style={styles.subtitle}>{shopProducts.length} صنف</Text>

      <Pressable style={styles.addBtn} onPress={() => showAdd ? resetForm() : setShowAdd(true)}>
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
          <Pressable style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'جارٍ الحفظ…' : editingProduct ? 'حفظ التعديلات' : 'حفظ الصنف'}</Text>
          </Pressable>
        </View>
      ) : null}

      {shopProducts.map((p) => (
        <View key={p.id} style={styles.productCard}>
          <Image source={{ uri: p.imageUrl }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <View style={styles.productHeader}>
              <Text style={styles.productName}>{p.name || 'بدون اسم'}</Text>
              <View style={styles.actions}>
                <Pressable onPress={() => startEdit(p)} hitSlop={8}><Text style={styles.editText}>تعديل</Text></Pressable>
                <Pressable onPress={() => handleDelete(p)} hitSlop={8}><Text style={styles.deleteText}>حذف</Text></Pressable>
              </View>
            </View>
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
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },
  actions: { flexDirection: 'row', gap: 10 },
  editText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  deleteText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  productMeta: { fontSize: 13, color: '#64748B', marginTop: 4 },
  productAttrs: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
