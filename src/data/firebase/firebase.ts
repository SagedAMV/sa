/**
 * تهيئة Firebase — Firebase JS SDK (Web-compatible)
 * يعمل على Android + iOS + Web بدون google-services.json
 *
 * ✅ تم التحويل من @react-native-firebase إلى firebase JS SDK
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// إعدادات Firebase — من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBxgIwUTTaLKaukOzZIaRzSh8WU-1yUdIQ",
  authDomain: "dool-4868b.firebaseapp.com",
  projectId: "dool-4868b",
  storageBucket: "dool-4868b.firebasestorage.app",
  messagingSenderId: "606141826171",
  appId: "1:606141826171:web:9a700d9c6c4f003b74cede",
  measurementId: "G-D64LC286CR",
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// قاعدة البيانات (Firestore)
export const db = getFirestore(app);

// تخزين الصور (Storage)
export const storage = getStorage(app);

/**
 * ملاحظات:
 * - Firebase JS SDK يعمل على جميع المنصات (Android/iOS/Web)
 * - لا يحتاج google-services.json أو GoogleService-Info.plist
 * - Offline Persistence: يجب تفعيله يدوياً إذا لزم الأمر
 */
