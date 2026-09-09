# QC Login 3D Background — Astro

نسخة Astro من خلفية QC ثلاثية الأبعاد. المكوّن يحتوي **الخلفية فقط** بدون login form أو buttons أو UI.

## الملفات

```text
src/components/QCLogin3DBackground.astro
public/assets/qc-medical-hero.glb
```

## 1) ثبّت Three.js

```bash
npm install three
```

## 2) انسخ الملفات إلى مشروع Astro

- انسخ `QCLogin3DBackground.astro` إلى `src/components/`.
- انسخ `qc-medical-hero.glb` إلى `public/assets/`.

## 3) الاستخدام

```astro
---
import QCLogin3DBackground from '../components/QCLogin3DBackground.astro';
---

<QCLogin3DBackground />
```

يمكن تغيير مسار الموديل:

```astro
<QCLogin3DBackground modelUrl="/models/qc-medical-hero.glb" />
```

إذا وضعت واجهة تسجيل الدخول فوق الخلفية، اجعل حاوية الواجهة في طبقة أعلى، مثلاً:

```css
.login-content {
  position: relative;
  z-index: 1;
}
```

## سلوك Astro

المكوّن يتعامل مع:

- `astro:page-load`
- `astro:before-swap`
- Astro ClientRouter / View Transitions
- تنظيف WebGL والـ event listeners عند مغادرة الصفحة
- منع إنشاء Renderer مكرر
- `prefers-reduced-motion`
- WebGL context loss/restoration
- CSS fallback عند فشل WebGL أو تحميل GLB
- Responsive desktop/tablet/mobile
- pointer parallax للأجهزة التي تدعم hover + fine pointer فقط

## ملاحظة

لم يعد المكوّن يعتمد على CDN أو Base64 للموديل. Three.js يتم bundling له عن طريق Astro/Vite، والـ GLB يُخدم كـ static asset من مجلد `public`.
