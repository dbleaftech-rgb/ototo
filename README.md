# אוטוטו — דוח חכם (Ototo Smart Report) 2.0

> מנהל העסקה של הקונה: כרטיס רכב חי, ציון שקוף, בדיקת עבר ביטוחי, ומנוע חוסמים עד סגירת עסקה בטוחה.

---

## 🏗️ ארכיטקטורת המערכת

המערכת נבנתה מחדש בארכיטקטורת **Monorepo** מודרנית ונקייה המבוססת על **Firebase** ו-**TypeScript**:

```
ototo/
├── firebase.json             # הגדרות Firebase: Functions, Firestore, Hosting, Storage & Emulators
├── firestore.rules           # כללי אבטחה מחמירים ל-Firestore (אפס PII, מניעת דליפת ת"ז)
├── storage.rules             # כללי אבטחה ל-Cloud Storage (תמונות, דוחות מכון, מסמכי חתימה)
│
├── shared/                   # חבילת לוגיקה משותפת (@ototo/shared)
│   ├── src/types/            # מודלי נתונים (Deal, Vehicle, Report, ScorePillars, MoU וכו')
│   ├── src/constants/        # מחירונים, Resource IDs ממשלתיים, מקדמי הפחתת שווי
│   ├── src/carNames.ts       # נרמול יצרנים ודגמים מקנוניים והסרת שמות מדינות
│   ├── src/scoringEngine.ts  # מנוע הציון 0-100 (6 עמודים, שקלול יחסי, אמצע טווח D-043)
│   ├── src/valuationEngine.ts# מודל שווי מותאם-היסטוריה (ליסינג D-102, מדרגות בעלויות, ק"מ)
│   └── src/findingsRules.ts  # קטלוג ממצאים, חומרות, והסברים
│
├── functions/                # Firebase Cloud Functions ב-TypeScript (@ototo/functions)
│   ├── src/services/
│   │   ├── govDataService.ts # חיבור ישיר ל-8 מאגרי data.gov.il הרשמיים
│   │   ├── checkIdService.ts # אינטגרציה עם CheckID / Tabu (טוקנים, בדיקת גניבה, ביטוח)
│   │   ├── growService.ts    # עיבוד וובהוק תשלומים מ-Grow (משולם) ומודל קרדיטים
│   │   └── dealService.ts    # ניהול מחזור חיי עסקה ובניית דוח אסינכרונית
│   └── src/index.ts          # נקודות קצה API ווובהוקים
│
└── frontend/                 # אפליקציית Web מודרנית ב-Vite (@ototo/frontend)
    ├── src/styles/theme.css  # טוקני עיצוב קנוניים (קליני-שמח, לוחית רישוי ישראלית, RTL)
    ├── src/components/
    │   ├── StoryView.ts      # סטורי 5 שקופיות אינטראקטיבי לשלב 1 (טיזר)
    │   ├── DealHubView.ts    # Deal Hub עם 5 טאבים (מבט על, מו"מ, צ'קליסט, מכון, זיכרון דברים)
    │   └── SellerApprovalView.ts # ממשק אישור מוכר והסכמת ביטוח לפי תיקון 13
    └── src/main.ts           # ראוטר לקוח
```

---

## 🚀 הרצה מקומית

### דרישות קדם
- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)

### התקנה
```bash
npm install
```

### בנייה (Build)
```bash
npm run build
```

### הרצת בדיקות יחידה (Unit Tests)
```bash
npm test
```

### הרצת ה-Frontend לפיתוח מקומי
```bash
npm run dev:frontend
```
האפליקציה תעלה בכתובת `http://localhost:3000` (עם תצוגת דמו של קיה ספורטג' 2019 מאומתת).

### הרצת אמולטורים של Firebase
```bash
npm run emulators
```
מפעיל את האמולטורים של Firestore, Functions, Hosting, Storage ו-Emulator UI בכתובת `http://localhost:4000`.

---

## 🔒 אבטחה, פרטיות ותיקון 13
1. **ללא PII בלוגים:** מספרי תעודות זהות לעולם אינם נשמרים כטקסט פתוח ואינם מהודהדים בלוגים. תצוגה ממוסכת בלבד (`*****462`).
2. **הסכמת מוכר כתנאי קיום:** שאילתת היסטוריית תביעות וביטוח ב-CheckID נחסמת בקוד עד לקבלת אישור מוכר מאומת דרך הלינק הייעודי (The Wedge).
3. **אידמפוטנטיות תשלומים:** וובהוק התשלומים של Grow בודק אסמכתא טרם כתיבה למניעת כפילות קרדיטים.
