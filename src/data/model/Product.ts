/**
 * نموذج الصنف — المطابق للقرارات: الصورة أساسية، الاسم اختياري، صفات اختيارية
 */

export type Currency = 'YER' | 'SAR';
export type Unit = 'piece' | 'kilo' | 'carton' | 'meter' | 'set' | 'other';

export interface Product {
  id: string;
  workspaceId: string;
  shopId: string;
  /** الاسم اختياري (التسمية ثانوية — القرار 21) */
  name?: string;
  /** الصورة أساسية إلزامية (القرار 21) */
  imageUrl: string;
  unit: Unit;
  buyPrice: number;
  sellPrice: number;
  buyCurrency: Currency;
  sellCurrency: Currency;
  /** صفات اختيارية (القرار 7) */
  size?: string;
  color?: string;
  model?: string;
  createdAt: number;
}
