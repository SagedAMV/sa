/**
 * حالة التطبيق المركزية (Zustand)
 * تحمل: الجلسة، الصلاحيات، والبيانات الحية (الزبائن/المحلات/الطلبات)
 */

import { create } from 'zustand';
import { User } from '../data/model/User';
import { Customer, Shop } from '../data/model/Customer';
import { Product } from '../data/model/Product';
import { Order } from '../data/model/Order';

interface AppState {
  // الجلسة
  user: User | null;
  /** يصبح true فقط بعد قراءة الجلسة من SecureStore عند بدء التطبيق. */
  isSessionReady: boolean;
  setUser: (user: User | null) => void;
  setSessionReady: (ready: boolean) => void;
  hasPermission: (perm: keyof User['permissions']) => boolean;

  // البيانات الحية
  customers: Customer[];
  shops: Shop[];
  products: Product[];
  orders: Order[];

  setCustomers: (items: Customer[]) => void;
  setShops: (items: Shop[]) => void;
  setProducts: (items: Product[]) => void;
  setOrders: (items: Order[]) => void;
  clearWorkspaceData: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isSessionReady: false,
  setUser: (user) => set({ user }),
  setSessionReady: (isSessionReady) => set({ isSessionReady }),

  hasPermission: (perm) => {
    const u = get().user;
    return u ? u.permissions[perm] === true : false;
  },

  customers: [],
  shops: [],
  products: [],
  orders: [],

  setCustomers: (customers) => set({ customers }),
  setShops: (shops) => set({ shops }),
  setProducts: (products) => set({ products }),
  setOrders: (orders) => set({ orders }),
  clearWorkspaceData: () => set({ customers: [], shops: [], products: [], orders: [] }),
}));
