/**
 * التنقل الرئيسي + تهيئة Firebase + تحميل البيانات الحية
 * (expo-router — ملف _layout يتحكم بكل الشاشات)
 */

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../src/state/useAppStore';
import { clearSession, getSession, periodicSecurityCheck } from '../src/data/repository/authRepository';
import { listenCustomers, listenShops } from '../src/data/repository/customerRepository';
import { listenProducts } from '../src/data/repository/productRepository';
import { listenOrders } from '../src/data/repository/orderRepository';

/** يمنع فتح شاشات البيانات من رابط مباشر قبل وجود جلسة جاهزة. */
function SessionNavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const user = useAppStore((s) => s.user);
  const isSessionReady = useAppStore((s) => s.isSessionReady);
  const currentRoute = segments[0] || 'index';
  const isPublicRoute = currentRoute === 'index' || currentRoute === 'login' || currentRoute === 'owner-setup';

  useEffect(() => {
    if (!isSessionReady) return;

    if (!user && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (user && (currentRoute === 'login' || currentRoute === 'owner-setup')) {
      router.replace(user.role === 'owner' ? '/dashboard' : '/buyer-shops');
    }
  }, [currentRoute, isPublicRoute, isSessionReady, router, user?.id, user?.role]);

  return null;
}

export default function RootLayout() {
  const setUser = useAppStore((s) => s.setUser);
  const setSessionReady = useAppStore((s) => s.setSessionReady);
  const user = useAppStore((s) => s.user);
  const setCustomers = useAppStore((s) => s.setCustomers);
  const setShops = useAppStore((s) => s.setShops);
  const setProducts = useAppStore((s) => s.setProducts);
  const setOrders = useAppStore((s) => s.setOrders);
  const clearWorkspaceData = useAppStore((s) => s.clearWorkspaceData);

  // لا نوجّه المستخدم قبل اكتمال قراءة SecureStore؛ هذا يمنع إرساله مؤقتًا
  // إلى شاشة الدخول رغم وجود جلسة محفوظة.
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const savedUser = await getSession();
        if (isMounted && savedUser) setUser(savedUser);
      } catch {
        // يتعامل getSession مع البيانات التالفة، وهذه حماية إضافية لخطأ التخزين نفسه.
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setSessionReady(true);
      }
    }

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, [setSessionReady, setUser]);

  // أعد التحقق من تعطيل الحساب والصلاحيات عند العودة للتطبيق، ودوريًا أثناء فتحه.
  useEffect(() => {
    if (!user) return;
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        setUser(await periodicSecurityCheck(user));
      } catch {
        await clearSession();
        setUser(null);
      } finally {
        checking = false;
      }
    };
    const interval = setInterval(() => void check(), 5 * 60 * 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [setUser, user?.id]);

  // تحميل البيانات الحية عند وجود مستخدم ومساحة عمل، ومسح بيانات المستخدم السابق
  // فور تسجيل الخروج أو تبديل مساحة العمل.
  useEffect(() => {
    if (!user?.workspaceId) {
      clearWorkspaceData();
      return;
    }

    const unsubCustomers = listenCustomers(user.workspaceId, setCustomers);
    const unsubShops = listenShops(user.workspaceId, setShops);
    const unsubProducts = listenProducts(user.workspaceId, setProducts);
    const unsubOrders = listenOrders(user.workspaceId, setOrders);

    return () => {
      unsubCustomers();
      unsubShops();
      unsubProducts();
      unsubOrders();
    };
  }, [clearWorkspaceData, setCustomers, setOrders, setProducts, setShops, user?.id, user?.workspaceId]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="owner-setup" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="order-form" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="shops" />
        <Stack.Screen name="shop/[id]" />
        <Stack.Screen name="buyer-shops" />
        <Stack.Screen name="buyer-shop-orders/[id]" />
        <Stack.Screen name="delivery" />
        <Stack.Screen name="debts" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="users" />
        <Stack.Screen name="templates" />
      </Stack>
      <SessionNavigationGuard />
    </>
  );
}
