/**
 * مستودع الأصناف (منتجات المحلات)
 */

import {
  createData,
  updateData,
  deleteData,
  listByWorkspace,
  listenCollection,
} from '../firebase/firestore';
import { Product } from '../model/Product';
import { uid } from './authRepository';

export async function addProduct(workspaceId: string, data: Partial<Product>): Promise<Product> {
  const product: Product = {
    id: uid(),
    workspaceId,
    shopId: data.shopId || '',
    name: data.name,
    imageUrl: data.imageUrl || '',
    unit: data.unit || 'piece',
    buyPrice: data.buyPrice ?? 0,
    sellPrice: data.sellPrice ?? 0,
    buyCurrency: data.buyCurrency || 'YER',
    sellCurrency: data.sellCurrency || 'YER',
    size: data.size,
    color: data.color,
    model: data.model,
    createdAt: Date.now(),
  };
  await createData('products', product.id, product);
  return product;
}

export async function updateProduct(id: string, patch: Partial<Product>) {
  await updateData('products', id, patch);
}

export async function deleteProduct(id: string) {
  await deleteData('products', id);
}

export async function listProducts(workspaceId: string): Promise<Product[]> {
  return listByWorkspace<Product>('products', workspaceId);
}

export function listenProducts(workspaceId: string, onData: (items: Product[]) => void) {
  return listenCollection<Product>('products', workspaceId, onData);
}

/** أصناف محل معين */
export function productsOfShop(list: Product[], shopId: string): Product[] {
  return list.filter((p) => p.shopId === shopId);
}

/** الاقتراح التلقائي للأصناف */
export function searchProducts(list: Product[], queryText: string): Product[] {
  const q = queryText.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.model || '').toLowerCase().includes(q) ||
      (p.color || '').toLowerCase().includes(q),
  );
}
