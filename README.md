# 📱 تطبيقي — هيكل المشروع (Expo SDK 57)

> هذا هو **الهيكل الكامل** للتطبيق — جاهز للبناء على جهازك.
> المستندات المرجعية في مجلد `البناء/` (خطة البناء، التسميات، الشاشات، قاعدة البيانات، البحث المرجعي).

---

## 📋 المتطلبات (المرحلة 0)

| الأداة | النسخة | لماذا؟ |
|--------|--------|--------|
| **Node.js** | **22.13+** (LTS) | مطلوب لتشغيل Expo SDK 57 |
| **Android Studio** | أحدث إصدار | أدوات أندرويد + Gradle |
| **Git** | أحدث | للنسخ المتتبع |
| **حساب Firebase** | مجاني | إنشاء المشروع والحصول على المفاتيح |

---

## 🚀 خطوات التشغيل على جهازك (بعد نقل المجلد)

```bash
# 1) انتقل إلى مجلد المشروع
cd تطبيقي

# 2) تثبيت الحزم (بأحدث إصدارات متوافقة مع SDK 57)
npm install

# 3) التحقق من صحة التوافق
npx expo-doctor

# 4) إنشاء مشروع Firebase:
#    - Firebase Console → إنشاء مشروع
#    - إضافة تطبيق Android بالحزمة: com.tatbiqi.retail
#    - تنزيل google-services.json ووضعه في جذر المشروع (بجانب app.json)

# 5) توليد مجلد الأندرويد (مرة واحدة)
npx expo prebuild

# 6) البناء والتثبيت على هاتفك (متصل بالكمبيوتر عبر USB مع تفعيل USB Debugging)
npx expo run:android
```

> ⚠️ **مهم:** `expo run:android` هو البناء عبر **Gradle** (كما كنت تريد) — يبني ويُثبّت على الهاتف مباشرة.
> بدون `google-services.json` سيفشل البناء (انظر أدناه).

---

## 🔥 تهيئة Firebase (خطوة إلزامية)

1. ادخل إلى [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. أضف تطبيقًا من نوع **Android**.
3. **Android package name** = `com.tatbiqi.retail` (مطابق لـ app.json).
4. حمّل ملف **google-services.json** وضعه في **جذر المشروع** (بجانب `app.json`).
5. في Firebase Console فعّل:
   - **Cloud Firestore** → Create database (وضع الإنتاج).
   - **Storage** → Get started.
   - **Cloud Messaging** (يُفعّل تلقائيًا مع android).

> 🔒 **الأمان:** اقرأ «03-قاعدة البيانات» قسم قواعد الأمان — اكتب القواعد بحذر قبل الإطلاق (تنبيه العيب 3).

---

## 📁 بنية المشروع (ما تم بناؤه)

```
app/                     ← الشاشات (expo-router)
  _layout.tsx            ← التنقل + تهيئة البيانات الحية
  index.tsx              ← التوجيه الذكي (مالك/مشتري)
  login.tsx              ← تسجيل الدخول
  owner-setup.tsx        ← الإعداد الأولي (المالك)
  dashboard.tsx          ← لوحة التحكم
  orders.tsx             ← قائمة الطلبات
  order-form.tsx         ← إنشاء طلب (صور + شرائح حسب المحل)
  order/[id].tsx         ← تفاصيل الطلب + الدفعات
  shops.tsx / shop/[id].tsx  ← المحلات وأصنافها
  customers.tsx / customer/[id].tsx  ← الزبائن وملفاتهم
  buyer-shops.tsx        ← المحلات الذكية (المشتري)
  buyer-shop-orders/[id].tsx  ← طلبات المحل (المشتري)
  delivery.tsx           ← التسليم
  debts.tsx              ← الديون
  reports.tsx            ← التقارير
  settings.tsx           ← الإعدادات
  users.tsx              ← إدارة المستخدمين (المالك)
  templates.tsx          ← قوالب الطلبات
android/                 ← ⭐ مشروع أندرويد (مُولّد بـ expo prebuild)
  app/build.gradle       ← build.gradle بتطبيق google-services plugin ✅
  app/google-services.json ← ⚠️ نسخة تجريبية — استبدلها بملفك الحقيقي
  app/src/main/AndroidManifest.xml ← الصلاحيات + الحزمة com.tatbiqi.retail
  app/src/main/java/com/tatbiqi/retail/ ← MainActivity + MainApplication (New Arch)
  gradle.properties      ← minSdk 24 / compileSdk 36 / targetSdk 36
src/
  data/model/            ← النماذج (User, Customer, Shop, Product, Order…)
  data/firebase/         ← Firebase (firestore.ts, storage.ts)
  data/repository/       ← المستودعات (المنطق)
  state/useAppStore.ts   ← الحالة المركزية (Zustand)
  utils/constants.ts     ← الثوابت (الحالات، العملات…)
```

---

## 🤖 مجلد android — معلومات مهمة

تم توليده **تلقائيًا** عبر `npx expo prebuild --platform android` (الطريقة الرسمية الصحيحة).

### ما يحتويه:
| الملف | الحالة |
|-------|--------|
| `app/build.gradle` | ✅ تطبيق `com.google.gms.google-services` + الحزمة `com.tatbiqi.retail` |
| `gradle.properties` | ✅ `minSdk 24` • `compileSdk 36` • `targetSdk 36` |
| `AndroidManifest.xml` | ✅ الصلاحيات (كاميرا، إشعارات، وسائط) + New Architecture |
| `google-services.json` | ⚠️ **نسخة تجريبية** — **يجب استبدالها بملفك الحقيقي** من Firebase Console |
| `MainActivity.kt` | ✅ New Architecture مفعّل (`fabricEnabled`) |

### ⚠️ أهم خطوة قبل البناء:
**استبدل `android/app/google-services.json` (والملف في الجذر) بملفك الحقيقي** من Firebase Console — وإلا سيفشل الاتصال بخدمات Firebase.

### ملاحظة البناء:
- البناء يتم على **جهازك** بـ: `npx expo run:android` (يحتاج Android Studio + Java 17).
- لا تحرّر ملفات `android/` يدويًا — أي تغيير في `app.json` يُعاد توليدها بـ prebuild.

---

## ✅ ما تم التحقق منه

- [x] الفحص الكامل بـ TypeScript: **0 أخطاء**
- [x] واجهات Firebase مؤكدة من الأنواع الرسمية لـ v26 (`getFirestore`, `putFile`, `exists()`…)
- [x] نمط Storage الصحيح: `getStorage → ref → putFile → getDownloadURL`
- [x] New Architecture مفعّل (مطلوب في v26)
- [x] التخزين المحلي (Offline) مفعّل افتراضيًا — يعمل بدون إنترنت

---

## 📌 ملاحظات قبل البناء

1. **Node 22.13+ إلزامي** — إن كان لديك إصدار أقدم، حدّثه أولًا.
2. **`expo run:android`** يحتاج هاتفًا متصلًا بـ USB (أو محاكيًا).
3. **المرحلة التالية** (من «00-خطة البناء»): المرحلة 2 (اختبار البيانات) ثم 3 (الحسابات والصلاحيات) — بالترتيب.
4. أي خطأ بناء؟ اكتب لي رسالة الخطأ وسأبحث الحل (لا تخمين).
