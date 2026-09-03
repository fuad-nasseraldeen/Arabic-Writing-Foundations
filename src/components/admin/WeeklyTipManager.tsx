"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { WeeklyTip } from "@/lib/weekly-tips";
import {
  deleteWeeklyTip,
  moveWeeklyTip,
  saveWeeklyTip,
  toggleWeeklyTipActive,
} from "@/app/[locale]/admin/actions";
import { EditorDrawer } from "@/components/cms/EditorDrawer";

const icons = [
  ["lightbulb", "רעיון"],
  ["leaf", "טבע"],
  ["brain", "חשיבה"],
  ["star", "כוכב"],
  ["pencil", "כתיבה"],
  ["book", "ספר"],
] as const;

export function WeeklyTipManager({
  locale,
  tips,
}: {
  locale: Locale;
  tips: WeeklyTip[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<WeeklyTip | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pending, startTransition] = useTransition();
  const isHe = locale === "he";
  const filtered = tips.filter((tip) => {
    const matchesText = [tip.title_he, tip.title_ar, tip.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    return (
      matchesText &&
      (status === "all" || status === (tip.is_active ? "active" : "inactive"))
    );
  });
  const execute = (
    action: (formData: FormData) => Promise<void>,
    formData: FormData,
    close = false,
  ) =>
    startTransition(async () => {
      await action(formData);
      if (close) setEditing(null);
      router.refresh();
    });
  const move = (id: string, direction: "up" | "down") => {
    const data = new FormData();
    data.set("id", id);
    data.set("direction", direction);
    execute(moveWeeklyTip.bind(null, locale), data);
  };
  return (
    <>
      <div className="tips-toolbar">
        <label className="tips-search">
          <span className="sr-only">
            {isHe ? "חיפוש טיפ" : "البحث عن نصيحة"}
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              isHe ? "חיפוש טיפ או קטגוריה" : "البحث عن نصيحة أو فئة"
            }
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          aria-label={isHe ? "סינון סטטוס" : "تصفية الحالة"}
        >
          <option value="all">{isHe ? "כל הסטטוסים" : "كل الحالات"}</option>
          <option value="active">{isHe ? "פעילים" : "نشط"}</option>
          <option value="inactive">{isHe ? "לא פעילים" : "غير نشط"}</option>
        </select>
        <button
          type="button"
          className="button"
          onClick={() => setEditing("new")}
        >
          <Plus size={17} />
          {isHe ? "הוספת טיפ" : "إضافة نصيحة"}
        </button>
      </div>
      <div
        className="weekly-tips-table"
        role="region"
        aria-label={isHe ? "ניהול טיפים" : "إدارة النصائح"}
      >
        <div className="weekly-tips-head">
          <span>{isHe ? "טיפ" : "النصيحة"}</span>
          <span>{isHe ? "קטגוריה" : "الفئة"}</span>
          <span>{isHe ? "סטטוס" : "الحالة"}</span>
          <span>{isHe ? "נוצר" : "أُنشئ"}</span>
          <span>{isHe ? "פעולות" : "إجراءات"}</span>
        </div>
        {filtered.map((tip) => (
          <div className="weekly-tips-row" key={tip.id}>
            <div>
              <b>{isHe ? tip.title_he : tip.title_ar || tip.title_he}</b>
              <small>
                {isHe
                  ? tip.description_he
                  : tip.description_ar || tip.description_he}
              </small>
            </div>
            <span>{tip.category || "—"}</span>
            <span
              className={`tip-status ${tip.is_active ? "active" : "inactive"}`}
            >
              {tip.is_active
                ? isHe
                  ? "פעיל"
                  : "نشط"
                : isHe
                  ? "לא פעיל"
                  : "غير نشط"}
            </span>
            <time dateTime={tip.created_at}>
              {new Intl.DateTimeFormat(isHe ? "he-IL" : "ar", {
                dateStyle: "medium",
              }).format(new Date(tip.created_at))}
            </time>
            <div className="tip-actions">
              <button
                type="button"
                onClick={() => setEditing(tip)}
                aria-label={
                  isHe
                    ? `עריכת ${tip.title_he}`
                    : `تعديل ${tip.title_ar || tip.title_he}`
                }
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => move(tip.id, "up")}
                aria-label={isHe ? "הזזה למעלה" : "نقل لأعلى"}
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => move(tip.id, "down")}
                aria-label={isHe ? "הזזה למטה" : "نقل لأسفل"}
              >
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const data = new FormData();
                  data.set("id", tip.id);
                  execute(toggleWeeklyTipActive.bind(null, locale), data);
                }}
                aria-label={
                  tip.is_active
                    ? isHe
                      ? "השבתת טיפ"
                      : "تعطيل النصيحة"
                    : isHe
                      ? "הפעלת טיפ"
                      : "تفعيل النصيحة"
                }
              >
                <Power size={16} />
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  if (
                    window.confirm(
                      isHe ? "האם למחוק את הטיפ?" : "هل تريد حذف النصيحة؟",
                    )
                  ) {
                    const data = new FormData();
                    data.set("id", tip.id);
                    execute(deleteWeeklyTip.bind(null, locale), data);
                  }
                }}
                aria-label={
                  isHe
                    ? `מחיקת ${tip.title_he}`
                    : `حذف ${tip.title_ar || tip.title_he}`
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <p className="weekly-tips-empty">
            {isHe ? "לא נמצאו טיפים מתאימים." : "لا توجد نصائح مطابقة."}
          </p>
        )}
      </div>
      {editing && (
        <EditorDrawer
          title={
            editing === "new"
              ? isHe
                ? "הוספת טיפ"
                : "إضافة نصيحة"
              : isHe
                ? "עריכת טיפ"
                : "تعديل النصيحة"
          }
          onClose={() => setEditing(null)}
        >
          <form
            className="cms-form weekly-tip-form"
            action={(formData) =>
              execute(saveWeeklyTip.bind(null, locale), formData, true)
            }
          >
            <input
              type="hidden"
              name="id"
              value={editing === "new" ? "" : editing.id}
            />
            <div className="bilingual-grid">
              <label>
                כותרת בעברית
                <input
                  name="title_he"
                  required
                  defaultValue={editing === "new" ? "" : editing.title_he}
                />
              </label>
              <label>
                العنوان بالعربية
                <input
                  name="title_ar"
                  defaultValue={editing === "new" ? "" : editing.title_ar || ""}
                />
              </label>
            </div>
            <div className="bilingual-grid">
              <label>
                תיאור בעברית
                <textarea
                  name="description_he"
                  required
                  defaultValue={editing === "new" ? "" : editing.description_he}
                />
              </label>
              <label>
                الوصف بالعربية
                <textarea
                  name="description_ar"
                  defaultValue={
                    editing === "new" ? "" : editing.description_ar || ""
                  }
                />
              </label>
            </div>
            <div className="bilingual-grid">
              <label>
                {isHe ? "קטגוריה" : "الفئة"}
                <input
                  name="category"
                  defaultValue={editing === "new" ? "" : editing.category || ""}
                />
              </label>
              <label>
                {isHe ? "אייקון" : "الأيقونة"}
                <select
                  name="icon_key"
                  defaultValue={
                    editing === "new" ? "lightbulb" : editing.icon_key
                  }
                >
                  {icons.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="check">
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editing === "new" || editing.is_active}
              />
              {isHe
                ? "הטיפ פעיל ומשתתף ברוטציה"
                : "النصيحة نشطة وتشارك في التدوير"}
            </label>
            <div className="drawer-actions">
              <button
                type="button"
                className="outline-button"
                onClick={() => setEditing(null)}
              >
                {isHe ? "ביטול" : "إلغاء"}
              </button>
              <button className="button" disabled={pending}>
                {pending
                  ? isHe
                    ? "שומר…"
                    : "جارٍ الحفظ…"
                  : isHe
                    ? "שמור"
                    : "حفظ"}
              </button>
            </div>
          </form>
        </EditorDrawer>
      )}
    </>
  );
}
