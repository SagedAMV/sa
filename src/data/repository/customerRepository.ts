/**
 * مستودع الزبائن والمحلات — CRUD + الاقتراح التلقائي
 */

import {
  createData,
  updateData,
  deleteData,
  getData,
  listByWorkspace,
  listenCollection,
} from '../firebase/firestore';
import { db } from '../firebase/firebase';
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { Customer, Shop } from '../model/Customer';
import { uid } from './authRepository';

/* ===== الزبائن ===== */

export async function addCustomer(workspaceId: string, data: Partial<Customer>): Promise<Customer> {
  const customer: Customer = {
    id: uid(),
    workspaceId,
    name: data.name || '',
    phone: data.phone,
    level: data.level || 'normal',
    notes: data.notes,
    totalDebt: 0,
    createdAt: Date.now(),
  };
  await createData('customers', customer.id, customer);
  return customer;
}

export async function updateCustomer(id: string, patch: Partial<Customer>) {
  await updateData('customers', id, patch);
}

export async function deleteCustomer(id: string) {
  await deleteData('customers', id);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  return getData<Customer>('customers', id);
}

export async function listCustomers(workspaceId: string): Promise<Customer[]> {
  return listByWorkspace<Customer>('customers', workspaceId);
}

/** الاستماع المباشر — تحديث فوري عند أي تغيير */
export function listenCustomers(workspaceId: string, onData: (items: Customer[]) => void) {
  return listenCollection<Customer>('customers', workspaceId, onData);
}

/** الاقتراح التلقائي (القرار 29): بحث بجزء من الاسم */
export function searchCustomers(list: Customer[], queryText: string): Customer[] {
  const q = queryText.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (c) => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q),
  );
}

/* ===== المحلات ===== */

export async function addShop(workspaceId: string, data: Partial<Shop>): Promise<Shop> {
  const shop: Shop = {
    id: uid(),
    workspaceId,
    name: data.name || '',
    category: data.category,
    phone: data.phone,
    notes: data.notes,
    createdAt: Date.now(),
  };
  await createData('shops', shop.id, shop);
  return shop;
}

export async function updateShop(id: string, patch: Partial<Shop>) {
  await updateData('shops', id, patch);
}

/** حذف المحل مع أصنافه حتى لا تبقى منتجات يتيمة في مساحة العمل. */
export async function deleteShop(id: string) {
  const productSnapshot = await getDocs(
    query(collection(db, 'products'), where('shopId', '==', id)),
  );
  const batch = writeBatch(db);
  batch.delete(doc(db, 'shops', id));
  productSnapshot.docs.forEach((product) => batch.delete(product.ref));
  await batch.commit();
}

export async function listShops(workspaceId: string): Promise<Shop[]> {
  return listByWorkspace<Shop>('shops', workspaceId);
}

export function listenShops(workspaceId: string, onData: (items: Shop[]) => void) {
  return listenCollection<Shop>('shops', workspaceId, onData);
}

export function searchShops(list: Shop[], queryText: string): Shop[] {
  const q = queryText.trim().toLowerCase();
  if (!q) return list;
  return list.filter((s) => s.name.toLowerCase().includes(q));
}
