/**
 * تهيئة Firebase — النمط الرسمي لـ @react-native-firebase v26
 * (Modular API — كما في الوثيقة الرسمية rnfirebase.io)
 *
 * ملاحظة: لا نحتاج استدعاء initializeApp() يدويًا —
 * التهيئة تتم تلقائيًا من google-services.json (أندرويد).
 */

import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';
import { getMessaging } from '@react-native-firebase/messaging';

// قاعدة البيانات (Offline Persistence مفعّل افتراضيًا على أندرويد)
export const db = getFirestore();

// تخزين الصور
export const storage = getStorage();

// الإشعارات
export const messaging = getMessaging();

/**
 * ملاحظات مؤكدة من الوثائق الرسمية (v26):
 * - New Architecture مطلوب — مُفعّل في app.json (newArchEnabled: true) ✅
 * - التخزين المحلي (Offline) مفعّل افتراضيًا على أندرويد — يعمل بدون إنترنت.
 * - حل التعارض الافتراضي: «آخر تعديل يكسب» — مطابق لقرارنا رقم 10. ✅
 */
