/**
 * رفع وتحميل الصور — Firebase JS SDK (Web-compatible)
 * ✅ تم التحويل من @react-native-firebase إلى firebase/storage
 *
 * ملاحظة: في React Native، يجب تحويل localUri إلى Blob أولاً
 */

import { storage } from './firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

/**
 * رفع صورة من الجهاز وإرجاع رابطها العام
 * @param localUri مسار الصورة المحلي (من expo-image-picker)
 * @param folderName مجلد التخزين (مثل products / orders)
 */
export async function uploadImage(
  localUri: string,
  folderName: string,
): Promise<string> {
  // اسم فريد للملف
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.jpg`;
  const storageRef = ref(storage, `${folderName}/${fileName}`);

  // تحويل localUri إلى Blob للرفع
  const response = await fetch(localUri);
  const blob = await response.blob();

  // رفع الملف
  await uploadBytes(storageRef, blob);

  // الحصول على الرابط العام
  const url = await getDownloadURL(storageRef);
  return url;
}

/** حذف صورة من السحابة (عند حذف صنف) */
export async function deleteImage(url: string) {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (e) {
    // تجاهل الأخطاء — الصورة قد تكون محذوفة مسبقاً
    console.warn('deleteImage failed', e);
  }
}
