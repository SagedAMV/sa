/**
 * الثوابت المشتركة — حالات الطلب والعملات والوحدات
 * مطابقة لـ «01-التسميات» القسم 3
 */

export const ORDER_STATUS_LABELS = {
  new: 'جديد',
  purchasing: 'قيد الشراء',
  purchased: 'تم الشراء',
  delivering: 'قيد التسليم',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
} as const;

export const SEGMENT_STATUS_LABELS = {
  pending: 'لم يُشترَ بعد',
  purchased: 'تم شراء الشريحة',
  unavailable: 'غير متوفر في المحل',
} as const;

export const CURRENCY_LABELS = {
  YER: 'ريال يمني',
  SAR: 'ريال سعودي',
} as const;

export const CURRENCY_SYMBOLS = {
  YER: 'ر.ي',
  SAR: 'ر.س',
} as const;

export const UNIT_LABELS = {
  piece: 'قطعة',
  kilo: 'كيلو',
  carton: 'كرتون',
  meter: 'متر',
  set: 'طقم',
  other: 'أخرى',
} as const;

export const CUSTOMER_LEVEL_LABELS = {
  normal: 'عادي',
  premium: 'مميز',
  wholesale: 'جملة',
} as const;

/** مسارات الشاشات (expo-router) — من «02-الشاشات» */
export const ROUTES = {
  index: '/',
  login: '/login',
  ownerSetup: '/owner-setup',
  dashboard: '/dashboard',
  orders: '/orders',
  orderForm: '/order-form',
  orderDetail: '/order/[id]',
  shops: '/shops',
  shopDetail: '/shop/[id]',
  customers: '/customers',
  customerProfile: '/customer/[id]',
  buyerShops: '/buyer-shops',
  buyerShopOrders: '/buyer-shop-orders/[id]',
  delivery: '/delivery',
  debts: '/debts',
  reports: '/reports',
  settings: '/settings',
  users: '/users',
  templates: '/templates',
} as const;
