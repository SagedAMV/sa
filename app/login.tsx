/**
 * شاشة تسجيل الدخول
 * أول مرة يتطلب إنترنت للتحقق — ثم يفتح دون إنترنت (القرار 8)
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../src/data/repository/authRepository';
import { useAppStore } from '../src/state/useAppStore';

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password) {
      Alert.alert('بيانات ناقصة', 'أدخل اليوزر وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      setUser(user);
      router.replace(user.role === 'owner' ? '/dashboard' : '/buyer-shops');
    } catch (e: any) {
      Alert.alert('تعذر الدخول', e.message || 'تحقق من بياناتك');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>📱</Text>
        <Text style={styles.title}>تطبيقي</Text>
        <Text style={styles.subtitle}>سجّل الدخول للمتابعة</Text>

        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="اسم المستخدم"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="كلمة المرور"
          secureTextEntry
        />

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'جارٍ الدخول…' : 'دخول'}</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/owner-setup')}>
          <Text style={styles.link}>ليس لديك حساب؟ الإعداد الأولي</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  link: { color: '#2563EB', textAlign: 'center', marginTop: 20, fontSize: 14 },
});
