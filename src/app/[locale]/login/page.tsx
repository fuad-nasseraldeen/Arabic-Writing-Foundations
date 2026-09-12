"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { t } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export default function Login({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = use(params);
  const { error: callbackError } = use(searchParams);
  const router = useRouter();
  const { user, ready } = useAuth();
  const [busy, setBusy] = useState(false);
  const [startError, setStartError] = useState(false);
  const d = t(locale);
  const failed = callbackError === "oauth_failed" || startError;
  useEffect(() => {
    if (ready && user) router.replace(`/${locale}`);
  }, [locale, ready, router, user]);
  const signIn = async () => {
    setBusy(true);
    setStartError(false);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback?next=/${locale}` },
      });
      if (error) setStartError(true);
    } catch {
      setStartError(true);
    } finally {
      setBusy(false);
    }
  };
  const message = locale === "he"
    ? "לא ניתן להשלים את ההתחברות עם Google. נסו חשבון מורשה או פנו למנהלי האתר."
    : "تعذر إكمال تسجيل الدخول عبر Google. استخدموا حساباً مصرحاً أو تواصلوا مع إدارة الموقع.";
  if (ready && user) return null;
  return <div className="login-page container"><section className="login-card"><span className="eyebrow">{d.brand}</span><h1>{d.auth.loginTitle}</h1><p>{d.auth.explanation}</p>{failed && <p className="login-error" role="alert">{message}</p>}<button className="google-button" onClick={signIn} disabled={busy}>{busy ? d.common.loading : <><b>G</b>{d.auth.continueGoogle}</>}</button></section></div>;
}
