# 📱 تطبيقي — مشروع Expo / React Native

تطبيق لإدارة الطلبات، الزبائن، المحلات، الشراء والتسليم، مبني بـ **Expo SDK 57** وFirebase JavaScript SDK.

---

## المتطلبات

| الأداة | النسخة | الاستخدام |
|---|---:|---|
| Node.js | 22.13+ | تثبيت الحزم وتشغيل Expo |
| Java 17 + Android Studio | أحدث إصدار | بناء وتشغيل Android محليًا |
| Firebase | مشروع مفعّل | Firestore وStorage |

---

## التشغيل على Android

```bash
# 1) تثبيت الحزم من ملف القفل
npm ci

# 2) فحص توافق Expo
npm run doctor

# 3) مزامنة مشروع Android المولّد مع app.json والحزم
npm run prebuild:android

# 4) بناء وتشغيل التطبيق على هاتف أو محاكي Android
npm run run:android
```

لبناء APK تجريبي:

```bash
npm run build:android
```

> يتطلب البناء المحلي Java وAndroid SDK، وهاتفًا متصلًا أو محاكيًا عند استخدام `run:android`.

---

## Firebase

يستخدم المشروع **Firebase JavaScript SDK** للمصادقة وFirestore وStorage:

- إعداد Firebase موجود في: `src/data/firebase/firebase.ts`
- فعّل **Authentication > Email/Password** وCloud Firestore وFirebase Storage.
- تسجيل الدخول الحقيقي يتم عبر Firebase Auth؛ لا تُحفظ كلمات المرور أو تجزئاتها في Firestore أو SecureStore.
- لا يعتمد التطبيق على `google-services.json` أو إضافة Google Services Gradle.
- إذا أردت ربط مشروع Firebase آخر، استبدل قيم إعداد تطبيق الويب في `firebase.ts`.
- تُعزل الصور تحت مسار مساحة العمل، وتُرفع على الهاتف عبر base64 وعلى الويب عبر Blob.

انشر قواعد الحماية المرفقة قبل تشغيل التطبيق على بيانات حقيقية:

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

> إعداد Firebase في تطبيق العميل ليس سرًا. الحماية الفعلية في `firestore.rules` و`storage.rules`. الحسابات التي أنشأتها نسخة قديمة بنظام التجزئة المحلي تحتاج إلى إعادة إنشائها في Firebase Auth؛ لا يوجد fallback غير آمن لكلمات المرور القديمة.

---

## المزامنة مع Android

مجلد `android/` مولّد من `app.json` والحزم بواسطة Expo Prebuild. بعد أي تغيير في:

- `app.json`
- حزمة تحتوي على كود Native
- إصدار Expo أو React Native

شغّل:

```bash
npm run prebuild:android
```

يستخدم هذا الأمر `--clean` لضمان عدم بقاء إعدادات Native قديمة. لا تعدّل ملفات Android المولّدة يدويًا؛ استخدم `app.json` أو Expo config plugins حتى تبقى الإعدادات قابلة لإعادة التوليد.

---

## البنية

```text
app/                         شاشات Expo Router
  _layout.tsx                استعادة الجلسة والاشتراكات الحية
  dashboard.tsx              لوحة التحكم
  orders.tsx                 الطلبات والفلترة
  order-form.tsx             إنشاء طلب
  shops.tsx                  المحلات
  customers.tsx              الزبائن
  delivery.tsx               التسليم
  buyer-shops.tsx            مهام المشتري
src/
  data/firebase/             تهيئة Firebase وFirestore وStorage
  data/repository/           منطق البيانات
  data/model/                الأنواع والنماذج
  state/useAppStore.ts       حالة التطبيق المركزية
android/                     مشروع Android المولّد
```

---

## التحقق

نفّذ في هذا المشروع:

```bash
npm ci --ignore-scripts
npx tsc --noEmit
npx expo export --platform android --output-dir /tmp/tatbiqi-android-export
npx expo export --platform web --output-dir /tmp/tatbiqi-web-export
```

تتحقق أوامر التصدير من أن جميع مسارات الشاشات وملفات JavaScript/TypeScript قابلة للحزم. يبقى اختبار APK على هاتف فعلي أو محاكي ضروريًا للتحقق من الأذونات، Firebase Rules، وسلوك الواجهة على جهازك.
