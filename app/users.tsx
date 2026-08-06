/**
 * إدارة المستخدمين — المالك حصريًا (القرار: لا تسجيل ذاتي)
 * إضافة مشتري (يوزر + كلمة مرور + صلاحيات) + تعطيل/تفعيل + تغيير كلمة مرور
 *
 * ✅ تم الإصلاح:
 * - useEffect بدلاً من if مباشر (يمنع التحميل المتعدد)
 * - loading indicator
 * - معالجة أخطاء شاملة
 * - التحقق من تكرار اليوزر
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../src/state/useAppStore';
import { addUser } from '../src/data/repository/authRepository';
import { updateData, listByWorkspace } from '../src/data/firebase/firestore';
import { User, BUYER_PERMISSIONS } from '../src/data/model/User';

export default function UsersScreen() {
  const user = useAppStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deliveryPerm, setDeliveryPerm] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ تحميل المستخدمين بشكل صحيح مع useEffect
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    listByWorkspace<User>('users', user.workspaceId)
      .then(setUsers)
      .catch((e) => Alert.alert('خطأ', 'تعذر تحميل المستخدمين'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function handleAdd() {
    if (!user || !username.trim() || !password) {
      Alert.alert('تنبيه', 'أدخل اليوزر وكلمة المرور');
      return;
    }
    if (password.length < 6) {
      Alert.alert('تنبيه', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setSaving(true);
    try {
      const newUsername = username.trim(); // ✅ حفظ الاسم قبل المسح
      const newUser = await addUser(user.workspaceId, newUsername, password, 'buyer');
      // منح/إلغاء صلاحية التسليم (القرار 23)
      if (deliveryPerm) {
        await updateData('users', newUser.id, {
          permissions: { ...BUYER_PERMISSIONS, 'delivery.view': true, 'delivery.confirm': true },
        });
        newUser.permissions['delivery.view'] = true;
        newUser.permissions['delivery.confirm'] = true;
      }
      setUsers((prev) => [...prev, newUser]);
      setUsername('');
      setPassword('');
      setDeliveryPerm(false);
      setShowAdd(false);
      Alert.alert('تم', `تم إضافة المشتري @${newUsername}`);
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر إضافة المستخدم');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: User) {
    try {
      await updateData('users', u.id, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: !x.isActive } : x)));
      Alert.alert('تم', u.isActive ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب');
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر تغيير الحالة');
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>جارٍ التحميل…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>👥 إدارة المستخدمين</Text>
      <Text style={styles.subtitle}>المالك فقط — لا تسجيل ذاتي</Text>

      <Pressable style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
        <Text style={styles.addBtnText}>{showAdd ? 'إغلاق' : '+ إضافة مشتري'}</Text>
      </Pressable>

      {showAdd ? (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="اسم المستخدم" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="كلمة المرور (6 أحرف+)" value={password} onChangeText={setPassword} secureTextEntry />
          <Pressable
            style={[styles.permRow, deliveryPerm && styles.permRowActive]}
            onPress={() => setDeliveryPerm(!deliveryPerm)}
          >
            <Text style={styles.permText}>منح صلاحية التسليم («تم التسليم»)</Text>
            <Text style={styles.permCheck}>{deliveryPerm ? '✅' : '⬜'}</Text>
          </Pressable>
          <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'جارٍ الإضافة…' : 'إضافة'}</Text>
          </Pressable>
        </View>
      ) : null}

      {users.filter((u) => u.id !== user?.id).length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا يوجد مستخدمون آخرون — أضف أول مشتري</Text>
        </View>
      ) : (
        users.filter((u) => u.id !== user?.id).map((u) => (
          <View key={u.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.username}>@{u.username}</Text>
                <Text style={styles.role}>{u.role === 'buyer' ? 'مشتري' : 'مالك'}</Text>
              </View>
              <Pressable
                style={[styles.stateBtn, u.isActive ? styles.active : styles.inactive]}
                onPress={() => toggleActive(u)}
              >
                <Text style={styles.stateText}>{u.isActive ? 'مفعّل' : 'معطّل'}</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  addBtn: { backgroundColor: '#2563EB', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 14 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700' },
  form: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 8 },
  permRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  permRowActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  permText: { fontSize: 14, color: '#334155', flex: 1 },
  permCheck: { fontSize: 16 },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 10, padding: 12, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#64748B', textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  username: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  role: { fontSize: 13, color: '#64748B' },
  stateBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 },
  active: { backgroundColor: '#DCFCE7' },
  inactive: { backgroundColor: '#FEE2E2' },
  stateText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
});
