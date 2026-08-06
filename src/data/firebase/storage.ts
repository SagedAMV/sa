/**
 * رفع وتحميل الصور — Firebase Storage
 * النمط الرسمي لـ @react-native-firebase v26:
 * getStorage → ref → putFile → getDownloadURL
 */

import { getStorage, ref, putFile, getDownloadURL, deleteObject } from '@react-native-firebase/storage';

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
  const reference = ref(getStorage(), `${folderName}/${fileName}`);

  // رفع الملف (putFile — النمط الأصلي لأجهزة Android/iOS)
  await putFile(reference, localUri);

  // الحصول على الرابط العام
  const url = await getDownloadURL(reference);
  return url;
}

/** حذف صورة من السحابة (عند حذف صنف) */
export async function deleteImage(url: string) {
  try {
    const reference = ref(getStorage(), url);
    await deleteObject(reference);
  } catch (e) {
    // تجاهل الأخطاء — الصورة قد تكون محذوفة مسبقًا
    console.warn('deleteImage failed', e);
  }
}
