"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";
import { startNavigationProgress } from "@/components/navigation/NavigationProgress";
import { useAuth, type HeaderUser } from "@/components/auth/AuthProvider";
export function Brand({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  const d = t(locale);
  return (
    <Link href={`/${locale}`} className="brand" aria-label={d.brand} onClick={onNavigate}>
      <span className="leaf">❧</span>
      <span>
        {locale === "he" ? (
          <>
            קדם־כתיבה
            <br />
            <b>בערבית</b>
          </>
        ) : (
          <>
            الكتابة التمهيدية
            <br />
            <b>بالعربية</b>
          </>
        )}
      </span>
    </Link>
  );
}
function Avatar({ user }: { user: NonNullable<HeaderUser> }) {
  const name = user.full_name || user.email || "?";
  return user.avatar_url ? (
    <img
      className="user-avatar"
      src={user.avatar_url}
      alt=""
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="avatar-fallback">
      {name
        .split(" ")
        .slice(0, 2)
        .map((x) => x[0])
        .join("")}
    </span>
  );
}
export function Header({
  locale,
}: {
  locale: Locale;
}) {
  const d = t(locale),
    path = usePathname(),
    router = useRouter();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false),
    [drop, setDrop] = useState(false),
    [isSigningOut, setIsSigningOut] = useState(false);
  const closeMobileNav = () => setOpen(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(closeMobileNav);
    return () => window.cancelAnimationFrame(frame);
  }, [path]);
  const switchTo = (to: Locale) => {
    closeMobileNav();
    const parts = path.split("/");
    parts[1] = to;
    startNavigationProgress();
    router.push(parts.join("/") || `/${to}`);
  };
  const links = [
      "home",
      "letters",
      "worksheets",
      "resources",
      "weeklyTip",
      "project",
      "about",
    ] as const,
    hrefs = [
      "",
      "letters",
      "worksheets",
      "resources",
      "weekly-tip",
      "project",
      "about",
    ];
  const isCurrent = (href: string) =>
    href ? path === `/${locale}/${href}` : path === `/${locale}`;
  const signOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const { error } = await createClient().auth.signOut();
    if (error) {
      setIsSigningOut(false);
      return;
    }
    // A hard navigation makes the next request read the cleared auth cookies.
    window.location.replace(`/${locale}`);
  };
  return (
    <header className="header">
      <div className="nav-wrap">
        <Brand locale={locale} onNavigate={closeMobileNav} />
        <nav
          className="desktop-nav"
          aria-label={locale === "he" ? "ניווט ראשי" : "التنقل الرئيسي"}
        >
          {links.map((key, i) => {
            const current = isCurrent(hrefs[i]);
            return (
              <Link
                key={key}
                href={`/${locale}/${hrefs[i]}`}
                prefetch={true}
                aria-current={current ? "page" : undefined}
              >
                {d.nav[key]}
              </Link>
            );
          })}
        </nav>
        <div className="nav-actions">
          <div className="language-switch">
            <button
              type="button"
              className={`nav-action-control ${locale === "he" ? "active" : ""}`}
              onClick={() => switchTo("he")}
            >
              עברית
            </button>
            <span>|</span>
            <button
              type="button"
              className={`nav-action-control ${locale === "ar" ? "active" : ""}`}
              onClick={() => switchTo("ar")}
            >
              العربية
            </button>
          </div>
          {user ? (
            <div className="user-menu">
              <button
                type="button"
                className="user-control nav-action-control"
                onClick={() => setDrop(!drop)}
                aria-expanded={drop}
              >
                <Avatar user={user} />
                <span>{user.full_name || user.email}</span>
              </button>
              {drop && (
                <div className="user-dropdown">
                  <b>{user.full_name}</b>
                  <small>{user.email}</small>
                  {isAdmin && (
                    <Link
                      href={`/${locale}/admin/users`}
                      onClick={() => setDrop(false)}
                    >
                      {locale === "he" ? "משתמשים" : "المستخدمون"}
                    </Link>
                  )}
                  <button
                    type="button"
                    className="logout-button"
                    onClick={signOut}
                    disabled={isSigningOut}
                    aria-busy={isSigningOut}
                  >
                    {d.auth.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link className="login-link nav-action-control" href={`/${locale}/login`}>
              {d.auth.login}
            </Link>
          )}
          <button
            type="button"
            className="icon-button menu nav-action-control"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={
              open
                ? locale === "he"
                  ? "סגירת תפריט"
                  : "إغلاق القائمة"
                : locale === "he"
                  ? "פתיחת תפריט"
                  : "فتح القائمة"
            }
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label={locale === "he" ? "ניווט בנייד" : "التنقل على الهاتف"}
        >
          {links.map((key, i) => {
            const current = isCurrent(hrefs[i]);
            return (
              <Link
                key={key}
                href={`/${locale}/${hrefs[i]}`}
                prefetch={true}
                aria-current={current ? "page" : undefined}
                onClick={closeMobileNav}
              >
                {d.nav[key]}
              </Link>
            );
          })}
          <div className="language-switch">
            <button type="button" onClick={() => switchTo("he")}>
              עברית
            </button>
            <span>|</span>
            <button type="button" onClick={() => switchTo("ar")}>
              العربية
            </button>
          </div>
          {isAdmin && (
            <Link
              href={`/${locale}/admin/users`}
                onClick={closeMobileNav}
            >
              {locale === "he" ? "משתמשים" : "المستخدمون"}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
