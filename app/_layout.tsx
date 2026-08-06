/**
 * التنقل الرئيسي + تهيئة Firebase + تحميل البيانات الحية
 * (expo-router — ملف _layout يتحكم بكل الشاشات)
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../src/state/useAppStore';
import { getSession } from '../src/data/repository/authRepository';
import { listenCustomers, listenShops } from '../src/data/repository/customerRepository';
import { listenProducts } from '../src/data/repository/productRepository';
import { listenOrders } from '../src/data/repository/orderRepository';

export default function RootLayout() {
  const setUser = useAppStore((s) => s.setUser);
  const user = useAppStore((s) => s.user);
  const setCustomers = useAppStore((s) => s.setCustomers);
  const setShops = useAppStore((s) => s.setShops);
  const setProducts = useAppStore((s) => s.setProducts);
  const setOrders = useAppStore((s) => s.setOrders);

  // استرجاع الجلسة المحفوظة (يفتح دون إنترنت — القرار 8)
  useEffect(() => {
    getSession().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  // تحميل البيانات الحية عند وجود مستخدم ومساحة عمل
  useEffect(() => {
    if (!user) return;

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
  }, [user?.id]);

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
    </>
  );
}
