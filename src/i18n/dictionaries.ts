import type { Locale } from "./config";

export const dictionaries = {
  he: {
    brand: "קדם־כתיבה בערבית", nav: { home:"דף הבית", letters:"אותיות בקבוצות", worksheets:"דפי עבודה", resources:"חומרי העשרה", weeklyTip:"טיפ השבוע", project:"על הפרויקט", about:"אודותיי", admin:"ניהול האתר" },
    auth: { login:"התחברות", loginTitle:"התחברות למדריך", continueGoogle:"המשך עם Google", explanation:"התחברות מאפשרת גישה לחשבון האישי. התוכן המקצועי באתר זמין גם ללא התחברות.", logout:"התנתקות" },
    common: { save:"שמירה", cancel:"ביטול", create:"יצירה", edit:"עריכה", delete:"מחיקה", publish:"פרסום", unpublish:"ביטול פרסום", loading:"טוען…", actions:"פעולות", visible:"מוצג", hidden:"מוסתר", close:"סגירה" },
    admin: { dashboard:"סקירה", content:"תוכן", categories:"קטגוריות", media:"קבצים", users:"משתמשים", admins:"מנהלים", welcome:"ניהול האתר", newCategory:"קטגוריה חדשה", newContent:"תוכן חדש", addAdmin:"הוספת מנהל", email:"דוא״ל", name:"שם", status:"סטטוס", category:"קטגוריה", translationMissing:"חסר תרגום לערבית", mediaUpload:"העלאת קובץ", adminOnly:"אזור זה זמין למנהלים בלבד" },
    home: { eyebrow:"מדריך דיגיטלי למרפאות ומרפאים בעיסוק", title:"קדם־כתיבה\nוכתיבת אותיות בערבית", description:"כלים מקצועיים לקידום מיומנויות קדם־כתיבה וכתיבת אותיות בערבית בגיל הרך", start:"התחילו כאן", guide:"המדריך המקצועי", threeWays:"שלוש דרכים להתחיל", threeDesc:"מבט מקצועי שמחבר בין האות, הילד והפעילות.", byLetter:"לפי אות", bySkill:"לפי מיומנות", byActivity:"לפי פעילות", view:"לצפייה" },
    footer:"פרויקט גמר | התואר השני בריפוי בעיסוק | אוניברסיטת תל־אביב"
  },
  ar: {
    brand: "الكتابة التمهيدية بالعربية", nav: { home:"الرئيسية", letters:"الحروف ضمن مجموعات", worksheets:"أوراق عمل", resources:"مواد إثرائية", weeklyTip:"نصيحة الأسبوع", project:"عن المشروع", about:"من أنا", admin:"إدارة الموقع" },
    auth: { login:"تسجيل الدخول", loginTitle:"تسجيل الدخول إلى الدليل", continueGoogle:"المتابعة باستخدام Google", explanation:"يتيح تسجيل الدخول الوصول إلى الحساب الشخصي. المحتوى المهني في الموقع متاح أيضاً دون تسجيل الدخول.", logout:"تسجيل الخروج" },
    common: { save:"حفظ", cancel:"إلغاء", create:"إنشاء", edit:"تعديل", delete:"حذف", publish:"نشر", unpublish:"إلغاء النشر", loading:"جارٍ التحميل…", actions:"إجراءات", visible:"ظاهر", hidden:"مخفي", close:"إغلاق" },
    admin: { dashboard:"نظرة عامة", content:"المحتوى", categories:"الفئات", media:"الملفات", users:"المستخدمون", admins:"المديرون", welcome:"إدارة الموقع", newCategory:"فئة جديدة", newContent:"محتوى جديد", addAdmin:"إضافة مدير", email:"البريد الإلكتروني", name:"الاسم", status:"الحالة", category:"الفئة", translationMissing:"الترجمة العربية غير مكتملة", mediaUpload:"رفع ملف", adminOnly:"هذه المنطقة متاحة للمديرين فقط" },
    home: { eyebrow:"دليل رقمي للمعالجين والمعالجات المهنيين", title:"الكتابة التمهيدية\nوكتابة الحروف العربية", description:"أدوات مهنية لتنمية مهارات ما قبل الكتابة وكتابة الحروف العربية في الطفولة المبكرة", start:"ابدأوا من هنا", guide:"الدليل المهني", threeWays:"ثلاث طرق للبدء", threeDesc:"منظور مهني يربط بين الحرف والطفل والنشاط.", byLetter:"حسب الحرف", bySkill:"حسب المهارة", byActivity:"حسب النشاط", view:"عرض" },
    footer:"مشروع تخرج | الماجستير في العلاج الوظيفي | جامعة تل أبيب"
  }
} as const;
export type Dictionary = (typeof dictionaries)[Locale];
export const t = (locale: Locale) => dictionaries[locale];
