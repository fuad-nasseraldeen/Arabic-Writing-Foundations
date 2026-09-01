import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { addAdmin, removeAdmin } from "../actions";

export default async function Page({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  if(!isLocale(locale)) notFound();
  const supabase=await createClient();
  const {data:adminRows,error}=await supabase.from("admins").select("user_id,created_at").order("created_at");
  if(error) throw new Error(error.message);
  const ids=(adminRows??[]).map((admin)=>admin.user_id);
  const {data:profiles}=ids.length?await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id",ids):{data:[]};
  const profileById=new Map((profiles??[]).map((profile)=>[profile.id,profile]));
  const admins=adminRows??[];
  const d=t(locale);
  return <><h1>{d.admin.admins}</h1><form action={addAdmin.bind(null,locale)} className="inline-form"><label>{d.admin.email}<input name="email" type="email" required/></label><button className="button">{d.admin.addAdmin}</button></form><p className="muted-note">{locale==="he"?"ניתן להוסיף רק משתמשים שנכנסו לאתר לפחות פעם אחת.":"يمكن إضافة المستخدمين الذين سجلوا دخولهم إلى الموقع مرة واحدة على الأقل فقط."}</p><div className="admin-table">{admins.length===0?<p className="muted-note">{locale==="he"?"לא נמצאו מנהלים.":"لم يتم العثور على مديرين."}</p>:admins.map((admin)=>{const profile=profileById.get(admin.user_id);return <article key={admin.user_id}><div><b>{profile?.full_name||"—"}</b><small>{profile?.email||"—"}</small><small>{new Date(admin.created_at).toLocaleDateString(locale)}</small></div><form action={removeAdmin.bind(null,locale)}><input type="hidden" name="id" value={admin.user_id}/><button className="danger-button" disabled={admins.length<=1}>{d.common.delete}</button></form></article>})}</div></>;
}
