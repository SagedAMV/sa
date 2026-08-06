/**
 * عمليات Firestore — قراءة وكتابة عامة لكل الكيانات
 * النمط الرسمي لـ @react-native-firebase v26 (Modular API)
 * تعمل دون إنترنت (Offline Persistence) وتتزامن تلقائيًا
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
} from '@react-native-firebase/firestore';

/** تحويل Timestamp إلى رقم (وقت ميللي) */
export function toMillis(t: any): number {
  return t && typeof t.toMillis === 'function' ? t.toMillis() : (t as number);
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
  // ملاحظة: في v26، exists() دالة (ليست خاصية)
  return snap.exists() ? (snap.data() as T) : null;
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
  return snap.docs.map((d) => d.data() as T);
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
      onData(snapshot.docs.map((d) => d.data() as T));
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
      onData(snap.exists() ? (snap.data() as T) : null);
    },
    error: (err) => {
      console.warn(`listenDoc ${coll}/${id} error:`, err);
    },
  });
}
