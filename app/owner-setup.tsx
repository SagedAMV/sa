/**
 * شاشة الإعداد الأولي — تظهر مرة واحدة لإنشاء حساب المالك + مساحة العمل
 * (القرار: لا تسجيل ذاتي — المالك وحده ينشئ)
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { setupOwner } from '../src/data/repository/authRepository';
import { useAppStore } from '../src/state/useAppStore';

export default function OwnerSetupScreen() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    if (!name.trim() || !username.trim() || !password || !workspaceName.trim()) {
      Alert.alert('بيانات ناقصة', 'أكمل جميع الحقول');
      return;
    }
    if (password !== confirm) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }
    setLoading(true);
    try {
      const owner = await setupOwner(username.trim(), password, workspaceName.trim());
      setUser(owner);
      router.replace('/dashboard');
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🏪 تطبيقي</Text>
      <Text style={styles.subtitle}>إنشاء حساب المالك ومساحة العمل</Text>

      <Text style={styles.label}>اسمك</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="الاسم" />

      <Text style={styles.label}>اسم المستخدم (يوزر)</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="youser" autoCapitalize="none" />

      <Text style={styles.label}>كلمة المرور</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" />

      <Text style={styles.label}>تأكيد كلمة المرور</Text>
      <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="••••••" />

      <Text style={styles.label}>اسم مساحة العمل</Text>
      <TextInput style={styles.input} value={workspaceName} onChangeText={setWorkspaceName} placeholder="مثال: متجر أحمد" />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSetup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'جارٍ الإنشاء…' : 'إنشاء الحساب'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 30, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 14, color: '#334155', marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
