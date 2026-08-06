/**
 * مستودع الحسابات: تسجيل الدخول، الإعداد الأولي، الفحص الأمني الدوري
 * القرارات: المالك يدير الحسابات (لا تسجيل ذاتي) + تشفير كلمات المرور
 */

import { createData, getData, updateData, listByWorkspace } from '../firebase/firestore';
import { User, OWNER_PERMISSIONS, BUYER_PERMISSIONS } from '../model/User';
import { Workspace } from '../model/Workspace';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

/** توليد معرف فريد */
export function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** تشفير كلمة المرور (SHA-256) */
export async function hashPassword(password: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return digest;
}

const SESSION_KEY = 'tatbiqi_session';
const WORKSPACE_KEY = 'tatbiqi_workspace';

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
  const workspaceId = uid();
  const owner: User = {
    id: uid(),
    workspaceId,
    username,
    passwordHash: await hashPassword(password),
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
  await saveSession(owner);
  return owner;
}

/** تسجيل الدخول — أول مرة يتطلب إنترنت للتحقق */
export async function login(username: string, password: string): Promise<User> {
  const users = await listByWorkspace<User>('users', ''); // placeholder — يُستبدل ببحث فعلي
  // ملاحظة: البحث باليوزر يتم عبر استعلام (سيُنفّذ في المرحلة 3)
  const found = users.find((u) => u.username === username);
  if (!found) throw new Error('مستخدم غير موجود');
  const hash = await hashPassword(password);
  if (found.passwordHash !== hash) throw new Error('كلمة المرور غير صحيحة');
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
  const user: User = {
    id: uid(),
    workspaceId,
    username,
    passwordHash: await hashPassword(password),
    role,
    permissions: role === 'buyer' ? BUYER_PERMISSIONS : OWNER_PERMISSIONS,
    isActive: true,
    createdAt: Date.now(),
  };
  await createData('users', user.id, user);
  return user;
}
