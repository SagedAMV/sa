/**
 * متطلبات Firebase JavaScript SDK في React Native / Expo.
 * يجب تحميل هذا الملف قبل تهيئة Firebase Storage.
 */

import { decode } from 'base-64';

const globalWithAtob = globalThis as typeof globalThis & { atob?: (value: string) => string };
if (!globalWithAtob.atob) globalWithAtob.atob = decode;
