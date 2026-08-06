/**
 * الإعدادات — المالك
 * حالة الاتصال + المزامنة + النسخ الاحتياطي + إدارة المستخدمين + القوالب + تسجيل الخروج
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/state/useAppStore';
import { clearSession } from '../src/data/repository/authRepository';

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const hasPerm = useAppStore((s) => s.hasPermission);

  async function handleLogout() {
    await clearSession();
    setUser(null);
    router.replace('/login');
  }

  function handleBackup() {
    // المرحلة 11 — تصدير ملف كامل (سيُنفَّذ لاحقًا)
    Alert.alert('نسخ احتياطي', 'ستُضاف هذه الميزة في المرحلة 11 من خطة البناء.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>⚙️ الإعدادات</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الحساب</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>المستخدم</Text>
          <Text style={styles.rowValue}>{user?.username}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>الدور</Text>
          <Text style={styles.rowValue}>{user?.role === 'owner' ? 'مالك' : 'مشتري'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إدارة</Text>
        {hasPerm('admin.users') ? (
          <Pressable style={styles.menuBtn} onPress={() => router.push('/users')}>
            <Text style={styles.menuText}>👥 إدارة المستخدمين</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.menuBtn} onPress={() => router.push('/templates')}>
          <Text style={styles.menuText}>📋 قوالب الطلبات</Text>
        </Pressable>
        <Pressable style={styles.menuBtn} onPress={() => router.push('/reports')}>
          <Text style={styles.menuText}>📊 التقارير</Text>
        </Pressable>
        <Pressable style={styles.menuBtn} onPress={() => router.push('/debts')}>
          <Text style={styles.menuText}>💳 الديون</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>البيانات</Text>
        <Pressable style={styles.menuBtn} onPress={handleBackup}>
          <Text style={styles.menuText}>💾 نسخ احتياطي (تصدير)</Text>
        </Pressable>
        <Pressable style={styles.menuBtn} onPress={handleBackup}>
          <Text style={styles.menuText}>📥 استيراد نسخة</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 14, color: '#64748B' },
  rowValue: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  menuBtn: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuText: { fontSize: 15, color: '#334155' },
  logoutBtn: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
});
