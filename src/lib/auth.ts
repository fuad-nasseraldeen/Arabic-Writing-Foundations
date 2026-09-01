import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Request-memoized auth state: one Auth call and, only for signed-in users, one admin lookup. */
export const getAuthContext = cache(async () => { const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return {user:null,isAdmin:false}; const {data:isAdmin,error}=await supabase.rpc("is_admin"); return {user,isAdmin:!error&&isAdmin===true}; });
export async function getCurrentUser(){return (await getAuthContext()).user;}
export async function isAdmin(){return (await getAuthContext()).isAdmin;}
export async function requireUser(locale="he"){const user=await getCurrentUser();if(!user)redirect(`/${locale}/login`);return user;}
export async function requireAdmin(locale="he"){const context=await getAuthContext();if(!context.user)redirect(`/${locale}/login`);if(!context.isAdmin)redirect(`/${locale}`);return context.user;}
