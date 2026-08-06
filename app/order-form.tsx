/**
 * إنشاء/تعديل طلب — المالك
 * اختيار الزبون (اقتراح تلقائي) + شرائح حسب المحل + أصناف بصورها
 * (القرارات: الصور أساسية 21، الشرائح حسب المحل 28، الاقتراح التلقائي 29)
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
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../src/state/useAppStore';
import { createOrder } from '../src/data/repository/orderRepository';
import { uploadImage } from '../src/data/firebase/storage';
import { OrderSegment, SegmentItem } from '../src/data/model/Order';

/** صنف جديد في نموذج الإنشاء (بصورة محلية مؤقتة) */
interface DraftItem extends SegmentItem {
  localUri?: string;
}

export default function OrderFormScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const customers = useAppStore((s) => s.customers);
  const shops = useAppStore((s) => s.shops);

  const [customerText, setCustomerText] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [segments, setSegments] = useState<{ shopId: string; items: DraftItem[] }[]>([]);
  const [saving, setSaving] = useState(false);

  // الاقتراح التلقائي للزبائن
  const suggestions = customers
    .filter((c) => c.name.toLowerCase().includes(customerText.trim().toLowerCase()))
    .slice(0, 5);

  function pickCustomer(id: string, name: string) {
    setSelectedCustomerId(id);
    setCustomerText(name);
    setShowSuggestions(false);
  }

  /** إضافة شريحة (محل) */
  function addSegment(shopId: string) {
    if (!segments.some((s) => s.shopId === shopId)) {
      setSegments([...segments, { shopId, items: [] }]);
    }
  }

  /** اختيار صورة وإضافتها كصنف داخل شريحة */
  async function pickImageForSegment(shopId: string) {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSegments((prev) =>
          prev.map((seg) =>
            seg.shopId === shopId
              ? {
                  ...seg,
                  items: [
                    ...seg.items,
                    {
                      productId: `new_${Date.now()}`,
                      imageUrl: '',
                      localUri: asset.uri,
                      name: '',
                      quantity: 1,
                      price: 0,
                      currency: 'YER',
                    },
                  ],
                }
              : seg,
          ),
        );
      }
    } catch (e: any) {
      Alert.alert('تعذر اختيار الصورة', e.message || 'تحقق من إذن الوصول إلى الصور');
    }
  }

  /** تعديل حقل صنف */
  function updateItem(shopId: string, index: number, patch: Partial<DraftItem>) {
    setSegments((prev) =>
      prev.map((seg) =>
        seg.shopId === shopId
          ? {
              ...seg,
              items: seg.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
            }
          : seg,
      ),
    );
  }

  /** رفع الصور وإنشاء الطلب */
  async function handleSave() {
    if (!user) return;
    if (!selectedCustomerId) {
      Alert.alert('تنبيه', 'اختر الزبون');
      return;
    }
    if (segments.length === 0 || segments.every((s) => s.items.length === 0)) {
      Alert.alert('تنبيه', 'أضف على الأقل صنفًا واحدًا');
      return;
    }

    setSaving(true);
    try {
      // رفع الصور المحلية إلى السحابة
      const finalSegments: OrderSegment[] = [];
      for (const seg of segments) {
        const items: SegmentItem[] = [];
        for (const it of seg.items) {
          let imageUrl = it.imageUrl;
          if (it.localUri) {
            imageUrl = await uploadImage(it.localUri, user.workspaceId, 'orders');
          }
          items.push({ ...it, imageUrl });
        }
        const shop = shops.find((s) => s.id === seg.shopId);
        finalSegments.push({
          shopId: seg.shopId,
          shopName: shop?.name || '',
          status: 'pending',
          items,
          paidActualAmount: 0,
          expectedAmount: items.reduce((s, it) => s + it.price * it.quantity, 0),
        });
      }

      const total = finalSegments.reduce(
        (s, seg) => s + seg.items.reduce((ss, it) => ss + it.price * it.quantity, 0),
        0,
      );

      await createOrder(
        user.workspaceId,
        {
          customerId: selectedCustomerId,
          customerName: customerText,
          status: 'new',
          segments: finalSegments,
          totalAmount: total,
          currency: 'YER',
          paidAmount: 0,
          remainingAmount: total,
        },
        user.id,
      );

      Alert.alert('تم', 'تم إنشاء الطلب بنجاح ✅');
      router.back();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر حفظ الطلب');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>➕ طلب جديد</Text>

      {/* الزبون + الاقتراح التلقائي */}
      <Text style={styles.label}>الزبون (اكتب للبحث)</Text>
      <TextInput
        style={styles.input}
        value={customerText}
        onChangeText={(v) => {
          setCustomerText(v);
          setSelectedCustomerId(null);
          setShowSuggestions(true);
        }}
        placeholder="اسم الزبون…"
        onFocus={() => setShowSuggestions(true)}
      />
      {customers.length === 0 ? (
        <Pressable style={styles.setupHint} onPress={() => router.push('/customers')}>
          <Text style={styles.setupHintText}>لا يوجد زبائن بعد — أضف زبونًا أولًا</Text>
        </Pressable>
      ) : (
        showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((c) => (
              <Pressable key={c.id} style={styles.suggestion} onPress={() => pickCustomer(c.id, c.name)}>
                <Text style={styles.suggestionText}>{c.name}</Text>
                {c.phone ? <Text style={styles.suggestionPhone}>{c.phone}</Text> : null}
              </Pressable>
            ))}
          </View>
        )
      )}

      {/* إضافة شريحة حسب المحل */}
      <Text style={styles.label}>الشرائح (حسب المحل)</Text>
      {shops.length === 0 ? (
        <Pressable style={styles.setupHint} onPress={() => router.push('/shops')}>
          <Text style={styles.setupHintText}>لا توجد محلات بعد — أضف محلاً أولًا</Text>
        </Pressable>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.shopsRow}
          contentContainerStyle={styles.shopsContent}
        >
          {shops.map((shop) => {
            const active = segments.some((s) => s.shopId === shop.id);
            return (
              <Pressable
                key={shop.id}
                style={[styles.shopChip, active && styles.shopChipActive]}
                onPress={() => addSegment(shop.id)}
              >
                <Text style={[styles.shopChipText, active && styles.shopChipTextActive]}>
                  {active ? '✓ ' : '+ '}
                  {shop.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* الشرائح والأصناف */}
      {segments.map((seg) => {
        const shop = shops.find((s) => s.id === seg.shopId);
        return (
          <View key={seg.shopId} style={styles.segmentCard}>
            <Text style={styles.segmentTitle}>🏪 {shop?.name}</Text>
            <Pressable style={styles.addItemBtn} onPress={() => pickImageForSegment(seg.shopId)}>
              <Text style={styles.addItemText}>+ إضافة صنف (صورة)</Text>
            </Pressable>

            {seg.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                {item.localUri || item.imageUrl ? (
                  <Image
                    source={{ uri: item.localUri || item.imageUrl }}
                    style={styles.itemThumb}
                  />
                ) : null}
                <View style={styles.itemFields}>
                  <TextInput
                    style={styles.smallInput}
                    placeholder="اسم (اختياري)"
                    value={item.name}
                    onChangeText={(v) => updateItem(seg.shopId, idx, { name: v })}
                  />
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.smallInput, styles.flex1]}
                      placeholder="كمية"
                      keyboardType="numeric"
                      value={String(item.quantity)}
                      onChangeText={(v) => updateItem(seg.shopId, idx, { quantity: Number(v) || 0 })}
                    />
                    <TextInput
                      style={[styles.smallInput, styles.flex1]}
                      placeholder="سعر البيع"
                      keyboardType="numeric"
                      value={String(item.price)}
                      onChangeText={(v) => updateItem(seg.shopId, idx, { price: Number(v) || 0 })}
                    />
                  </View>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.smallInput, styles.flex1]}
                      placeholder="مقاس (اختياري)"
                      value={item.size}
                      onChangeText={(v) => updateItem(seg.shopId, idx, { size: v })}
                    />
                    <TextInput
                      style={[styles.smallInput, styles.flex1]}
                      placeholder="لون (اختياري)"
                      value={item.color}
                      onChangeText={(v) => updateItem(seg.shopId, idx, { color: v })}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        );
      })}

      <Pressable
        style={[styles.saveBtn, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>{saving ? 'جارٍ الحفظ…' : 'حفظ الطلب'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  label: { fontSize: 14, color: '#334155', marginTop: 16, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 15 },
  suggestionsBox: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  suggestion: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  suggestionText: { fontSize: 15, color: '#0F172A' },
  suggestionPhone: { fontSize: 12, color: '#64748B' },
  setupHint: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginTop: 6, borderWidth: 1, borderColor: '#BFDBFE' },
  setupHintText: { color: '#1D4ED8', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  // تثبيت ارتفاع شريط الاختيار الأفقي يمنع تمدده عموديًا على Android.
  shopsRow: { flexGrow: 0, flexShrink: 0, height: 44 },
  shopsContent: { alignItems: 'center', paddingHorizontal: 2 },
  shopChip: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  shopChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  shopChipText: { color: '#334155', fontSize: 13 },
  shopChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  segmentCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  segmentTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  addItemBtn: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 10 },
  addItemText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  itemRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, marginBottom: 10 },
  itemThumb: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  itemFields: { flex: 1 },
  smallInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, fontSize: 13, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.6 },
});
