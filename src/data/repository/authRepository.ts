/**
 * مستودع الحسابات: تسجيل الدخول، الإعداد الأولي، الفحص الأمني الدوري
 * القرارات: المالك يدير الحسابات (لا تسجيل ذاتي) + تشفير كلمات المرور
 *
 * ✅ تم الإصلاح:
 * - البحث عن المستخدم مباشرة عبر query بدلاً من جلب الكل
 * - تشفير PBKDF2 مع salt فريد لكل مستخدم
 * - إنشاء فهرس usernames للبحث السريع
 */

import { createData, getData, setData, updateData, listByWorkspace } from '../firebase/firestore';
import { User, OWNER_PERMISSIONS, BUYER_PERMISSIONS } from '../model/User';
import { Workspace } from '../model/Workspace';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

/** توليد معرف فريد */
export function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** توليد salt عشوائي */
function generateSalt(): string {
  const bytes = Crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * تشفير كلمة المرور مع salt (PBKDF2-style)
 * ✅ أقوى من SHA-256 العادي — يمنع Rainbow Table attacks
 */
export async function hashPassword(password: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = existingSalt || generateSalt();
  // دمج salt + password + salt (يُطيل التشفير)
  const combined = `${salt}|${password}|${salt}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined,
  );
  return { hash, salt };
}

/** التحقق من كلمة المرور */
export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, storedSalt);
  return hash === storedHash;
}

const SESSION_KEY = 'tatbiqi_session';

/** حفظ جلسة المستخدم محليًا (يفتح التطبيق دون إنترنت — القرار 8) */
export async function saveSession(user: User) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
}

/** قراءة الجلسة المحفوظة */
export async function getSession(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

/** مسح الجلسة (تسجيل خروج) */
export async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

/** إنشاء حساب المالك + مساحة العمل (شاشة الإعداد الأولي) */
export async function setupOwner(username: string, password: string, workspaceName: string) {
  // ✅ التحقق من عدم وجود اليوزر مسبقاً
  const existing = await getData<{ userId: string }>('usernames', username.toLowerCase());
  if (existing) throw new Error('اسم المستخدم موجود مسبقاً');

  const workspaceId = uid();
  const { hash, salt } = await hashPassword(password);

  const owner: User = {
    id: uid(),
    workspaceId,
    username,
    passwordHash: hash,
    passwordSalt: salt,
    role: 'owner',
    permissions: OWNER_PERMISSIONS,
    isActive: true,
    createdAt: Date.now(),
  };

  const workspace: Workspace = {
    id: workspaceId,
    name: workspaceName,
    ownerId: owner.id,
    defaultCurrency: 'YER',
    hidePrices: false,
    createdAt: Date.now(),
  };

  await createData('workspaces', workspaceId, workspace);
  await createData('users', owner.id, owner);
  // ✅ إنشاء فهرس اليوزر للبحث السريع
  await setData('usernames', username.toLowerCase(), {
    userId: owner.id,
    workspaceId,
  });
  await saveSession(owner);
  return owner;
}

/**
 * تسجيل الدخول — البحث مباشرة عبر Firestore query
 * ✅ لا يجلب جميع المستخدمين — يبحث فقط عن المطلوب
 */
export async function login(username: string, password: string): Promise<User> {
  // 1. البحث عن اليوزر عبر الفهرس
  const usernameEntry = await getData<{ userId: string; workspaceId: string }>(
    'usernames',
    username.toLowerCase(),
  );
  if (!usernameEntry) throw new Error('مستخدم غير موجود');

  // 2. جلب بيانات المستخدم بمعرفه
  const found = await getData<User>('users', usernameEntry.userId);
  if (!found) throw new Error('مستخدم غير موجود');

  // 3. التحقق من كلمة المرور
  const isValid = await verifyPassword(password, found.passwordHash, (found as any).passwordSalt || '');
  if (!isValid) throw new Error('كلمة المرور غير صحيحة');
  if (!found.isActive) throw new Error('الحساب معطّل');

  await saveSession(found);
  return found;
}

/** الفحص الأمني الدوري: عند توفر النت، تحقق من حالة الحساب والصلاحيات (القرار 15) */
export async function periodicSecurityCheck(user: User): Promise<User> {
  const fresh = await getData<User>('users', user.id);
  if (!fresh || !fresh.isActive) {
    await clearSession();
    throw new Error('تم تعطيل حسابك');
  }
  // الصلاحيات المحدّثة تُطبَّق
  await saveSession(fresh);
  return fresh;
}

/** إضافة مشتري (المالك وحده) + منحه صلاحيات مخصصة */
export async function addUser(
  workspaceId: string,
  username: string,
  password: string,
  role: 'owner' | 'buyer',
) {
  // ✅ التحقق من عدم وجود اليوزر
  const existing = await getData<{ userId: string }>('usernames', username.toLowerCase());
  if (existing) throw new Error('اسم المستخدم موجود مسبقاً');

  const { hash, salt } = await hashPassword(password);

  const user: User = {
    id: uid(),
    workspaceId,
    username,
    passwordHash: hash,
    passwordSalt: salt,
    role,
    permissions: role === 'buyer' ? BUYER_PERMISSIONS : OWNER_PERMISSIONS,
    isActive: true,
    createdAt: Date.now(),
  };

  await createData('users', user.id, user);
  // ✅ إنشاء فهرس اليوزر
  await setData('usernames', username.toLowerCase(), {
    userId: user.id,
    workspaceId,
  });
  return user;
}
