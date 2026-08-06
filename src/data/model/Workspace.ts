/**
 * نموذجا مساحة العمل والقالب
 */

import type { Currency } from './Product';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  /** العملة الافتراضية للمالك */
  defaultCurrency: Currency;
  /** إظهار/إخفاء الأسعار */
  hidePrices: boolean;
  createdAt: number;
}

/** قالب طلب جاهز (فكرة القوالب) */
export interface Template {
  id: string;
  workspaceId: string;
  name: string;
  items: {
    name?: string;
    imageUrl?: string;
    quantity: number;
    price: number;
  }[];
  createdAt: number;
}
