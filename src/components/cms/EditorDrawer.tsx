"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function EditorDrawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = originalOverflow; document.documentElement.style.overflow = originalHtmlOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="editor-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="editor-drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="editor-drawer-header"><h2>{title}</h2><button ref={closeRef} className="drawer-close" type="button" onClick={onClose} aria-label="סגירת חלון העריכה"><X size={20} /></button></header>
        <div className="editor-drawer-body">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
