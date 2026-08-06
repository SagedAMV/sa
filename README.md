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

يستخدم المشروع **Firebase JavaScript SDK** لـ Firestore وStorage:

- إعداد Firebase موجود في: `src/data/firebase/firebase.ts`
- لا يعتمد التطبيق على `google-services.json` أو إضافة Google Services Gradle.
- فعّل **Cloud Firestore** و**Firebase Storage** في مشروع Firebase المطابق للإعدادات.
- إذا أردت ربط مشروع Firebase آخر، استبدل قيم إعداد تطبيق الويب من Firebase Console في `firebase.ts`.
- تُرفع الصور على Android وiOS عبر مسار base64 الموثق من Firebase لبيئة React Native/Expo، وعلى الويب عبر Blob.

> إعداد Firebase الظاهر في تطبيق العميل ليس سرًا بحد ذاته. الحماية الفعلية يجب أن تكون عبر **Firestore Security Rules** و**Storage Rules** المناسبة لمساحة العمل والمستخدم. لا تُطلق التطبيق بقواعد تسمح بالقراءة أو الكتابة العامة.

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
