"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Lightbulb, Settings } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useAuth } from "@/components/auth/AuthProvider";
import { setCmsEditMode } from "@/app/actions/cms-edit-mode";
import { useRouter } from "next/navigation";

type CmsAdminState = { isAdmin: boolean; editing: boolean };
const CmsAdminContext = createContext<CmsAdminState>({
  isAdmin: false,
  editing: false,
});
const editModeEvent = "cms-edit-mode-change";

export function useCmsAdmin() {
  return useContext(CmsAdminContext);
}

/** Works across the server-component boundary used by public pages. */
export function useCmsEditMode() {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const sync = () =>
      setEditing(document.documentElement.dataset.editMode === "on");
    sync();
    window.addEventListener(editModeEvent, sync);
    return () => window.removeEventListener(editModeEvent, sync);
  }, []);

  return editing;
}

/**
 * Keeps the verified server-side role available to every inline editor.
 * The edit switch is purely presentation; every write still calls requireAdmin.
 */
export function CmsAdminProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const applyEditMode = (next: boolean) => {
    setEditing(next);
    sessionStorage.setItem("cms-edit-mode", next ? "on" : "off");
    document.documentElement.dataset.editMode = next ? "on" : "off";
    window.dispatchEvent(new Event(editModeEvent));
  };

  useEffect(() => {
    if (!isAdmin) {
      setEditing(false);
      document.documentElement.dataset.editMode = "off";
      window.dispatchEvent(new Event(editModeEvent));
      return;
    }
    const initial = sessionStorage.getItem("cms-edit-mode") === "on";
    applyEditMode(initial);
  }, [isAdmin]);

  const toggle = () => {
    const next = !editing;
    applyEditMode(next);
    // This is the one intentional refresh: it swaps cached published CMS for
    // the verified admin/draft server view after an explicit mode change.
    startTransition(async () => {
      await setCmsEditMode(locale, next);
      router.refresh();
    });
  };

  return (
    <CmsAdminContext.Provider value={{ isAdmin, editing }}>
      {isAdmin && (
        <div className="admin-toolbar">
          <b>{locale === "he" ? "מצב עריכה" : "وضع التحرير"}</b>
          <button onClick={toggle}>{editing ? "ON" : "OFF"}</button>
          <Link href={`/${locale}/admin/tips`} className="admin-settings-link">
            <Lightbulb size={16} />
            {locale === "he" ? "ניהול טיפים" : "إدارة النصائح"}
          </Link>
          <Link href={`/${locale}/admin`} className="admin-settings-link">
            <Settings size={16} />
            {locale === "he" ? "הגדרות" : "الإعدادات"}
          </Link>
        </div>
      )}
      {children}
    </CmsAdminContext.Provider>
  );
}
