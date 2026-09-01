"use client";
import { useState } from "react";
import { LayoutGrid, LoaderCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Section } from "@/lib/cms";
import { saveSectionColumns } from "@/app/[locale]/admin/actions";
import { EditorDrawer } from "./EditorDrawer";
import { useCmsEditMode } from "./CmsAdminProvider";

export function GridSettings({locale,section}:{locale:Locale;section:Section}){const editing=useCmsEditMode();const [open,setOpen]=useState(false),[columns,setColumns]=useState(Math.min(4,Math.max(1,Number(section.settings.columns)||3))),[saving,setSaving]=useState(false);if(!editing||!['feature_grid','content','explore'].includes(section.section_type))return null;const save=async()=>{setSaving(true);try{const form=new FormData();form.set('id',section.id);form.set('columns',String(columns));await saveSectionColumns(locale,form);setOpen(false);}finally{setSaving(false)}};return <><button type="button" className="grid-settings-button" onClick={()=>setOpen(true)} aria-label={locale==='he'?'הגדרות גריד':'إعدادات الشبكة'}><LayoutGrid size={16}/></button>{open&&<EditorDrawer title={locale==='he'?'הגדרות כרטיסים':'إعدادات البطاقات'} onClose={()=>!saving&&setOpen(false)}><div className="grid-settings-panel"><b>{locale==='he'?'כרטיסים בשורה':'عدد البطاقات في الصف'}</b><div className="column-segments">{[1,2,3,4].map(n=><button key={n} disabled={saving} className={columns===n?'active':''} onClick={()=>setColumns(n)}>{n}</button>)}</div><div className="drawer-actions"><button type="button" className="outline-button" disabled={saving} onClick={()=>setOpen(false)}>{locale==='he'?'ביטול':'إلغاء'}</button><button type="button" className="button" disabled={saving} onClick={save}>{saving&&<LoaderCircle className="theme-spinner" size={16}/>} {locale==='he'?'שמור':'حفظ'}</button></div></div></EditorDrawer>}</>}
