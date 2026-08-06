/**
 * نموذجا الزبون والمحل — مطابقان لـ «03-قاعدة البيانات»
 */

/** مستويات الزبائن — القرار من النقاش */
export type CustomerLevel = 'normal' | 'premium' | 'wholesale';

export interface Customer {
  id: string;
  workspaceId: string;
  name: string;
  phone?: string;
  level: CustomerLevel;
  notes?: string;
  /** رصيد الدين الإجمالي — يُحدَّث تلقائيًا */
  totalDebt: number;
  createdAt: number;
}

export interface Shop {
  id: string;
  workspaceId: string;
  name: string;
  category?: string;
  phone?: string;
  notes?: string;
  createdAt: number;
}
