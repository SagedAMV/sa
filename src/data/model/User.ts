/**
 * نموذج المستخدم — مطابق للكيانات في «03-قاعدة البيانات»
 */

export type UserRole = 'owner' | 'buyer';

export interface Permissions {
  // الطلبات
  'orders.view': boolean;
  'orders.add': boolean;
  'orders.edit': boolean;
  'orders.delete': boolean;
  'orders.changeStatus': boolean;
  'orders.viewProfit': boolean;
  // الزبائن
  'customers.view': boolean;
  'customers.add': boolean;
  'customers.edit': boolean;
  'customers.delete': boolean;
  'customers.manageDebts': boolean;
  // المحلات والأصناف
  'shops.view': boolean;
  'shops.add': boolean;
  'shops.edit': boolean;
  'shops.delete': boolean;
  'shops.items.edit': boolean;
  // الأسعار (حساسة)
  'pricing.viewBuy': boolean;
  'pricing.editBuy': boolean;
  'pricing.editSell': boolean;
  // الشراء
  'purchase.viewTasks': boolean;
  'purchase.confirm': boolean;
  'purchase.recordPaid': boolean;
  // التسليم
  'delivery.view': boolean;
  'delivery.confirm': boolean;
  // المالية
  'finance.viewReports': boolean;
  'finance.export': boolean;
  'finance.viewDebts': boolean;
  // الإدارة (للمالك غالبًا)
  'admin.users': boolean;
  'admin.permissions': boolean;
  'admin.logs': boolean;
}

/** صلاحيات كاملة افتراضية (المالك) */
export const OWNER_PERMISSIONS: Permissions = {
  'orders.view': true,
  'orders.add': true,
  'orders.edit': true,
  'orders.delete': true,
  'orders.changeStatus': true,
  'orders.viewProfit': true,
  'customers.view': true,
  'customers.add': true,
  'customers.edit': true,
  'customers.delete': true,
  'customers.manageDebts': true,
  'shops.view': true,
  'shops.add': true,
  'shops.edit': true,
  'shops.delete': true,
  'shops.items.edit': true,
  'pricing.viewBuy': true,
  'pricing.editBuy': true,
  'pricing.editSell': true,
  'purchase.viewTasks': true,
  'purchase.confirm': true,
  'purchase.recordPaid': true,
  'delivery.view': true,
  'delivery.confirm': true,
  'finance.viewReports': true,
  'finance.export': true,
  'finance.viewDebts': true,
  'admin.users': true,
  'admin.permissions': true,
  'admin.logs': true,
};

/** صلاحيات افتراضية للمشتري (تأكيد فقط + رؤية) — حسب القرار 9 */
export const BUYER_PERMISSIONS: Permissions = {
  'orders.view': true,
  'orders.add': false,
  'orders.edit': false,
  'orders.delete': false,
  'orders.changeStatus': false,
  'orders.viewProfit': false,
  'customers.view': true,
  'customers.add': false,
  'customers.edit': false,
  'customers.delete': false,
  'customers.manageDebts': false,
  'shops.view': true,
  'shops.add': false,
  'shops.edit': false,
  'shops.delete': false,
  'shops.items.edit': false,
  'pricing.viewBuy': true,
  'pricing.editBuy': false,
  'pricing.editSell': false,
  'purchase.viewTasks': true,
  'purchase.confirm': true,
  'purchase.recordPaid': true,
  'delivery.view': false,
  'delivery.confirm': false,
  'finance.viewReports': false,
  'finance.export': false,
  'finance.viewDebts': false,
  'admin.users': false,
  'admin.permissions': false,
  'admin.logs': false,
};

export interface User {
  id: string;
  workspaceId: string;
  username: string;
  /** حقول قديمة فقط لترحيل الحسابات السابقة؛ الحسابات الجديدة تستخدم Firebase Auth. */
  passwordHash?: string;
  passwordSalt?: string;
  role: UserRole;
  permissions: Permissions;
  isActive: boolean;
  createdAt: number;
}
