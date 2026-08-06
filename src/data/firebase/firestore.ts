/**
 * عمليات Firestore — Firebase JS SDK (Web-compatible)
 * ✅ تم التحويل من @react-native-firebase إلى firebase/firestore
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

/** تحويل قيمة التاريخ القادمة من Firestore إلى رقم milliseconds آمن للواجهات. */
export function toMillis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

const TIME_FIELDS = ['createdAt', 'updatedAt', 'timestamp'] as const;

/**
 * Firestore يعيد Timestamp بينما نماذج التطبيق تستخدم milliseconds.
 * نوحّد الشكل هنا مرة واحدة كي لا تتعطل الشاشات التي تستخدم Date أو الترتيب الزمني.
 */
function normalizeDocument<T>(id: string, data: Record<string, unknown>): T {
  const normalized: Record<string, unknown> = { ...data, id };
  for (const field of TIME_FIELDS) {
    if (normalized[field] !== undefined && normalized[field] !== null) {
      normalized[field] = toMillis(normalized[field]);
    }
  }
  return normalized as T;
}

/** حقل updatedAt للكتابة */
function nowTimestamp() {
  return Timestamp.now();
}

/** إنشاء أو تحديث كامل (set مع merge) — «آخر تعديل يكسب» */
export async function setData(
  coll: string,
  id: string,
  data: Record<string, any>,
) {
  await setDoc(doc(db, coll, id), { ...data, updatedAt: nowTimestamp() }, { merge: true });
}

/** إنشاء جديد */
export async function createData(
  coll: string,
  id: string,
  data: Record<string, any>,
) {
  await setDoc(doc(db, coll, id), {
    ...data,
    id,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  });
}

/** تحديث جزئي */
export async function updateData(
  coll: string,
  id: string,
  patch: Record<string, any>,
) {
  await updateDoc(doc(db, coll, id), { ...patch, updatedAt: nowTimestamp() });
}

/** حذف */
export async function deleteData(coll: string, id: string) {
  await deleteDoc(doc(db, coll, id));
}

/** قراءة واحدة */
export async function getData<T>(coll: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, coll, id));
  // exists() في Firebase JS SDK هي دالة.
  return snap.exists() ? normalizeDocument<T>(snap.id, snap.data()) : null;
}

/** قراءة مجموعة حسب مساحة العمل */
export async function listByWorkspace<T>(
  coll: string,
  workspaceId: string,
): Promise<T[]> {
  const q = query(
    collection(db, coll),
    where('workspaceId', '==', workspaceId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeDocument<T>(d.id, d.data()));
}

/** استماع مباشر (Live) — للتحديث الفوري بين الأجهزة */
export function listenCollection<T>(
  coll: string,
  workspaceId: string,
  onData: (items: T[]) => void,
) {
  const q = query(
    collection(db, coll),
    where('workspaceId', '==', workspaceId),
  );
  return onSnapshot(q, {
    next: (snapshot) => {
      onData(snapshot.docs.map((d) => normalizeDocument<T>(d.id, d.data())));
    },
    error: (err) => {
      console.warn(`listen ${coll} error:`, err);
    },
  });
}

/** استماع لوثيقة واحدة */
export function listenDoc<T>(
  coll: string,
  id: string,
  onData: (item: T | null) => void,
) {
  return onSnapshot(doc(db, coll, id), {
    next: (snap) => {
      onData(snap.exists() ? normalizeDocument<T>(snap.id, snap.data()) : null);
    },
    error: (err) => {
      console.warn(`listenDoc ${coll}/${id} error:`, err);
    },
  });
}
