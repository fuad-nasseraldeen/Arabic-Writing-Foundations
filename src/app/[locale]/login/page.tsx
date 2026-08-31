"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
export default function Login({params}:{params:Promise<{locale:Locale}>}) { const [locale,setLocale]=useState<Locale>("he"); const [busy,setBusy]=useState(false); const router=useRouter(); params.then(({locale})=>setLocale(locale)); const d=t(locale); const signIn=async()=>{setBusy(true); const supabase=createClient(); await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback?next=/${locale}`}});}; return <div className="login-page container"><section className="login-card"><span className="eyebrow">{d.brand}</span><h1>{d.auth.loginTitle}</h1><p>{d.auth.explanation}</p><button className="google-button" onClick={signIn} disabled={busy}>{busy?d.common.loading:<><b>G</b>{d.auth.continueGoogle}</>}</button></section></div>; }
