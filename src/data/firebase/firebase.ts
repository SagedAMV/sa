/** تهيئة Firebase المشتركة لجميع المنصات. */
import './polyfills';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: 'AIzaSyBxgIwUTTaLKaukOzZIaRzSh8WU-1yUdIQ',
  authDomain: 'dool-4868b.firebaseapp.com',
  projectId: 'dool-4868b',
  storageBucket: 'dool-4868b.firebasestorage.app',
  messagingSenderId: '606141826171',
  appId: '1:606141826171:web:9a700d9c6c4f003b74cede',
  measurementId: 'G-D64LC286CR',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
