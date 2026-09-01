"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";

type CmsAdminState = { isAdmin: boolean; editing: boolean };
const CmsAdminContext = createContext<CmsAdminState>({ isAdmin: false, editing: false });
const editModeEvent = "cms-edit-mode-change";

export function useCmsAdmin() {
  return useContext(CmsAdminContext);
}

/** Works across the server-component boundary used by public pages. */
export function useCmsEditMode() {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const sync = () => setEditing(document.documentElement.dataset.editMode === "on");
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
  isAdmin,
  locale,
  children,
}: {
  isAdmin: boolean;
  locale: Locale;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  const applyEditMode = (next: boolean) => {
    setEditing(next);
    sessionStorage.setItem("cms-edit-mode", next ? "on" : "off");
    document.documentElement.dataset.editMode = next ? "on" : "off";
    window.dispatchEvent(new Event(editModeEvent));
  };

  useEffect(() => {
    if (!isAdmin) return;
    const initial = sessionStorage.getItem("cms-edit-mode") === "on";
    applyEditMode(initial);
  }, [isAdmin]);

  const toggle = () => {
    const next = !editing;
    applyEditMode(next);
  };

  return (
    <CmsAdminContext.Provider value={{ isAdmin, editing }}>
      {isAdmin && (
        <div className="admin-toolbar">
          <b>{locale === "he" ? "מצב עריכה" : "وضع التحرير"}</b>
          <button onClick={toggle}>{editing ? "ON" : "OFF"}</button>
          <Link href={`/${locale}/admin/media`}>{locale === "he" ? "קבצים" : "الملفات"}</Link>
          <Link href={`/${locale}/admin/users`}>{locale === "he" ? "משתמשים" : "المستخدمون"}</Link>
          <Link href={`/${locale}/admin/admins`}>{locale === "he" ? "מנהלים" : "المديرون"}</Link>
        </div>
      )}
      {children}
    </CmsAdminContext.Provider>
  );
}
