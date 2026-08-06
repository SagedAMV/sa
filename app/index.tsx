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
  const isSessionReady = useAppStore((s) => s.isSessionReady);

  useEffect(() => {
    // تنتظر هذه الشاشة قراءة الجلسة غير المتزامنة قبل اتخاذ قرار التوجيه.
    if (!isSessionReady) return;

    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace(user.role === 'owner' ? '/dashboard' : '/buyer-shops');
  }, [isSessionReady, router, user?.id, user?.role]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={{ marginTop: 12, color: '#64748B' }}>
        {isSessionReady ? 'جارٍ الفتح…' : 'جارٍ استعادة الجلسة…'}
      </Text>
    </View>
  );
}
