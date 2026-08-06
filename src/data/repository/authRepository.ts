/** مصادقة المستخدمين عبر Firebase Auth، وملفات الصلاحيات عبر Firestore. */
import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { auth, db, firebaseConfig } from '../firebase/firebase';
import { User, OWNER_PERMISSIONS, BUYER_PERMISSIONS } from '../model/User';
import { Workspace } from '../model/Workspace';

const SESSION_KEY = 'tatbiqi_session';
const MIN_PASSWORD_LENGTH = 8;

export function uid(): string {
  return Crypto.randomUUID();
}

function normalizeUsername(username: string): string {
  const value = username.trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,40}$/.test(value)) {
    throw new Error('اسم المستخدم يجب أن يكون 3–40 حرفًا إنجليزيًا أو رقمًا، ويمكن استخدام . _ -');
  }
  return value;
}

/** بريد داخلي حتمي؛ لا نضع اسم المستخدم نفسه أو بيانات حساسة في Firebase Auth. */
async function usernameEmail(username: string): Promise<string> {
  const normalized = normalizeUsername(username);
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, normalized);
  return `u-${digest}@tatbiqi.app`;
}

function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`);
  }
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const u = value as Partial<User>;
  return typeof u.id === 'string' && typeof u.workspaceId === 'string' &&
    typeof u.username === 'string' && (u.role === 'owner' || u.role === 'buyer') &&
    typeof u.isActive === 'boolean' && !!u.permissions;
}

async function readUser(id: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', id));
  if (!snap.exists()) return null;
  const value = { ...snap.data(), id: snap.id };
  return isUser(value) ? value : null;
}

export async function saveSession(user: User) {
  // ذاكرة واجهة فقط؛ Firebase Auth هو مصدر الثقة، ولا تُحفظ كلمات مرور أو hashes.
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  delete safeUser.passwordSalt;
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(safeUser));
}

export async function getSession(): Promise<User | null> {
  const firebaseUser = await new Promise<import('firebase/auth').User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (value) => {
      unsubscribe();
      resolve(value);
    });
  });
  if (!firebaseUser) {
    await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => undefined);
    return null;
  }
  const user = await readUser(firebaseUser.uid);
  if (!user?.isActive) {
    await clearSession();
    return null;
  }
  await saveSession(user);
  return user;
}

export async function clearSession() {
  await Promise.all([
    signOut(auth).catch(() => undefined),
    SecureStore.deleteItemAsync(SESSION_KEY).catch(() => undefined),
  ]);
}

export async function setupOwner(username: string, password: string, workspaceName: string) {
  const normalized = normalizeUsername(username);
  validatePassword(password);
  const credential = await createUserWithEmailAndPassword(auth, await usernameEmail(normalized), password);
  const workspaceId = uid();
  const now = Date.now();
  const owner: User = {
    id: credential.user.uid, workspaceId, username: normalized, role: 'owner',
    permissions: OWNER_PERMISSIONS, isActive: true, createdAt: now,
  };
  const workspace: Workspace = {
    id: workspaceId, name: workspaceName.trim(), ownerId: owner.id,
    defaultCurrency: 'YER', hidePrices: false, createdAt: now,
  };
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'workspaces', workspaceId), { ...workspace, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    batch.set(doc(db, 'users', owner.id), { ...owner, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    batch.set(doc(db, 'usernames', normalized), { userId: owner.id, workspaceId, createdAt: serverTimestamp() });
    await batch.commit();
    await saveSession(owner);
    return owner;
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}

export async function login(username: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, await usernameEmail(username), password);
  const user = await readUser(credential.user.uid);
  if (!user) {
    await signOut(auth);
    throw new Error('ملف المستخدم غير موجود');
  }
  if (!user.isActive) {
    await signOut(auth);
    throw new Error('الحساب معطّل');
  }
  await saveSession(user);
  return user;
}

export async function periodicSecurityCheck(user: User): Promise<User> {
  if (auth.currentUser?.uid !== user.id) {
    await clearSession();
    throw new Error('انتهت الجلسة، سجّل الدخول مجددًا');
  }
  const fresh = await readUser(user.id);
  if (!fresh?.isActive) {
    await clearSession();
    throw new Error('تم تعطيل حسابك');
  }
  await saveSession(fresh);
  return fresh;
}

export async function addUser(workspaceId: string, username: string, password: string, role: 'owner' | 'buyer') {
  const normalized = normalizeUsername(username);
  validatePassword(password);
  if (auth.currentUser == null) throw new Error('انتهت جلسة المالك');

  // تطبيق Firebase ثانوي يمنع تسجيل خروج المالك عند إنشاء الحساب الجديد.
  const secondaryApp = initializeApp(firebaseConfig, `provision-${uid()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, await usernameEmail(normalized), password);
    const user: User = {
      id: credential.user.uid, workspaceId, username: normalized, role,
      permissions: role === 'buyer' ? BUYER_PERMISSIONS : OWNER_PERMISSIONS,
      isActive: true, createdAt: Date.now(),
    };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', user.id), { ...user, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      batch.set(doc(db, 'usernames', normalized), { userId: user.id, workspaceId, createdAt: serverTimestamp() });
      await batch.commit();
      return user;
    } catch (error) {
      await deleteUser(credential.user).catch(() => undefined);
      throw error;
    }
  } finally {
    await signOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}
