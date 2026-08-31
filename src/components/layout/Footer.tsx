import { Brand } from "./Header";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dictionaries";
export function Footer({ locale }: { locale: Locale }) { const d=t(locale); return <footer className="footer"><div className="container footer-inner"><Brand locale={locale}/><p>{d.footer}</p><small>© {new Date().getFullYear()}</small></div></footer> }
