"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function EditorDrawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = originalOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="editor-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="editor-drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="editor-drawer-header"><h2>{title}</h2><button ref={closeRef} className="drawer-close" type="button" onClick={onClose} aria-label="סגירת חלון העריכה"><X size={20} /></button></header>
        {children}
      </aside>
    </div>,
    document.body,
  );
}
