"use client";
import { use, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
export default function Login({params}:{params:Promise<{locale:Locale}>}) { const {locale}=use(params); const [busy,setBusy]=useState(false); const d=t(locale); const signIn=async()=>{setBusy(true); const supabase=createClient(); const origin=window.location.origin; const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${origin}/auth/callback?next=/${locale}`}}); if(error)setBusy(false);}; return <div className="login-page container"><section className="login-card"><span className="eyebrow">{d.brand}</span><h1>{d.auth.loginTitle}</h1><p>{d.auth.explanation}</p><button className="google-button" onClick={signIn} disabled={busy}>{busy?d.common.loading:<><b>G</b>{d.auth.continueGoogle}</>}</button></section></div>; }
