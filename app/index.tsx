/**
 * الشاشة الافتتاحية — توجيه ذكي:
 * - لا جلسة محفوظة → تسجيل الدخول
 * - جلسة موجودة → حسب الدور (مالك: لوحة التحكم / مشتري: المحلات الذكية)
 */

import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/state/useAppStore';

export default function IndexScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace(user.role === 'owner' ? '/dashboard' : '/buyer-shops');
  }, [user?.id]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={{ marginTop: 12, color: '#64748B' }}>جارٍ الفتح…</Text>
    </View>
  );
}
