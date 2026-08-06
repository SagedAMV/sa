/**
 * رفع وتحميل الصور — Firebase JS SDK (Web-compatible)
 * ✅ تم التحويل من @react-native-firebase إلى firebase/storage
 *
 * في Android/iOS يُرفع الملف كـ base64 وفق إعداد Firebase الموثق لـ React Native/Expo.
 */

import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { storage } from './firebase';
import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

/**
 * رفع صورة من الجهاز وإرجاع رابطها العام.
 *
 * يدعم Firebase Storage رفع Blob في الويب. أما في React Native/Expo فنستخدم
 * base64 مع uploadString، وهو المسار الذي توثقه Firebase لهذه البيئة.
 * @param localUri مسار الصورة المحلي (من expo-image-picker)
 * @param folderName مجلد التخزين (مثل products / orders)
 */
export async function uploadImage(
  localUri: string,
  workspaceId: string,
  folderName: 'products' | 'orders',
): Promise<string> {
  const extension = extensionFromUri(localUri);
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const storageRef = ref(storage, `workspaces/${workspaceId}/${folderName}/${fileName}`);
  const metadata = { contentType: contentTypeFor(extension) };

  if (Platform.OS === 'web') {
    const response = await fetch(localUri);
    if (!response.ok) throw new Error('تعذر قراءة الصورة المحددة');
    await uploadBytes(storageRef, await response.blob(), metadata);
  } else {
    const localFile = new File(localUri);
    await uploadString(storageRef, await localFile.base64(), 'base64', metadata);
  }

  return getDownloadURL(storageRef);
}

function extensionFromUri(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:[?#].*)?$/.exec(uri);
  const extension = match?.[1]?.toLowerCase();
  return extension === 'png' || extension === 'webp' || extension === 'heic' ? extension : 'jpg';
}

function contentTypeFor(extension: string): string {
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
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
