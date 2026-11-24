"use client";

import Image from "next/image";
import { BookOpen, CloudRain, FilePenLine, Lightbulb, Maximize2, SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { rainLetters, rainMaterials, rainSkills, rainStages, type RainMaterial } from "./rain-materials";
import styles from "./RainMaterials.module.css";

const translations = {
  he: {
    guide: "חומר והנחיות", ideas: "רעיונות לפעילויות", worksheet: "דפי עבודה", story: "סיפור",
    stage: "שלב", letter: "אות", skill: "סוג תרגול",
    allStages: "כל השלבים", allLetters: "כל האותיות", allSkills: "כל סוגי התרגול",
    reset: "איפוס מסננים", empty: "אין דפי עבודה שמתאימים למסננים שנבחרו.",
    count: "דפי עבודה שנמצאו", open: "פתיחה בגודל מלא", instruction: "בחרו חומר לעיון או דף עבודה לפתיחה ולהדפסה.",
  },
  ar: {
    guide: "مواد وإرشادات", ideas: "أفكار للأنشطة", worksheet: "أوراق عمل", story: "القصة",
    stage: "المرحلة", letter: "الحرف", skill: "نوع التدريب",
    allStages: "كل المراحل", allLetters: "كل الحروف", allSkills: "كل أنواع التدريب",
    reset: "مسح عوامل التصفية", empty: "لا توجد أوراق عمل تطابق عوامل التصفية.",
    count: "أوراق العمل المطابقة", open: "عرض بالحجم الكامل", instruction: "اختاروا مادة للاطلاع عليها أو ورقة عمل لفتحها وطباعتها.",
  },
};

const sections = [
  ["guide", BookOpen],
  ["ideas", Lightbulb],
  ["worksheet", FilePenLine],
  ["story", CloudRain],
] as const;

function MaterialCard({ item, locale }: { item: RainMaterial; locale: Locale }) {
  const copy = translations[locale];
  const path = `/letter-groups/rain/${item.id}`;
  return (
    <li className={styles.card}>
      <a className={styles.cardLink} href={`${path}.webp`} target="_blank" rel="noreferrer">
        <div className={styles.preview}>
          <Image src={`${path}-preview.webp`} width={400} height={400} alt="" unoptimized />
        </div>
        <div className={styles.cardCopy}>
          {item.stage && <span className={styles.stage}>{copy.stage} {item.stage}</span>}
          <h4>{item[locale]}</h4>
          {item.kind === "worksheet" && (
            <p>{rainSkills[item.skill][locale]}{item.letters.length > 0 && <> · <bdi lang="ar">{item.letters.join(" · ")}</bdi></>}</p>
          )}
          <span className={styles.open}><Maximize2 size={15} aria-hidden="true" />{copy.open}</span>
        </div>
      </a>
    </li>
  );
}

export function RainGuides({ locale }: { locale: Locale }) {
  return (
    <div className={styles.library}>
      {locale === "ar" && <p className={styles.sourceLanguage}>تتضمّن المواد الأصلية تعليمات بالعبرية.</p>}
      <ul className={styles.grid}>
        {rainMaterials.filter((item) => item.kind === "guide").map((item) =>
          <MaterialCard key={item.id} item={item} locale={locale} />)}
      </ul>
    </div>
  );
}

export function RainMaterials({ locale, story }: { locale: Locale; story: ReactNode }) {
  const copy = translations[locale];
  const [active, setActive] = useState<(typeof sections)[number][0]>("guide");
  const [stage, setStage] = useState("");
  const [letter, setLetter] = useState("");
  const [skill, setSkill] = useState("");
  const visible = rainMaterials.filter((item) => item.kind === active &&
    (item.kind !== "worksheet" || (
      (!stage || String(item.stage) === stage) &&
      (!letter || item.letters.includes(letter)) &&
      (!skill || item.skill === skill)
    )));

  return (
    <div className={styles.library}>
      <p className={styles.instruction}>{copy.instruction}</p>
      <div className={styles.sections} role="group" aria-label={locale === "he" ? "סוג החומר" : "نوع المادة"}>
        {sections.map(([id, Icon]) => (
          <button key={id} type="button" className={`nav-action-control ${styles.section}`}
            aria-pressed={active === id} onClick={() => setActive(id)}>
            <Icon size={20} aria-hidden="true" />{copy[id]}
          </button>
        ))}
      </div>
      {active === "story" ? (
        <>
          {story}
          <ul className={`${styles.grid} ${styles.storySource}`}>
            <MaterialCard locale={locale} item={{
              id: "story", kind: "guide", he: "סיפורי הדמיה בעברית", ar: "قصص تخيّلية بالعبرية",
            }} />
          </ul>
        </>
      ) : (
        <section aria-labelledby="rain-material-heading">
          <h3 className={styles.heading} id="rain-material-heading">{copy[active]}</h3>
          {locale === "ar" && <p className={styles.sourceLanguage}>تتضمّن المواد الأصلية تعليمات بالعبرية.</p>}
          {active === "worksheet" && (
            <>
              <div className={styles.filters}>
                <SlidersHorizontal size={20} aria-hidden="true" />
                <label>{copy.stage}
                  <select value={stage} onChange={(event) => setStage(event.target.value)}>
                    <option value="">{copy.allStages}</option>
                    {rainStages.map((item, index) => <option key={index} value={index + 1}>{index + 1} · {item[locale]}</option>)}
                  </select>
                </label>
                <label>{copy.letter}
                  <select value={letter} onChange={(event) => setLetter(event.target.value)}>
                    <option value="">{copy.allLetters}</option>
                    {rainLetters.map((item) => <option key={item} value={item} lang="ar">{item}</option>)}
                  </select>
                </label>
                <label>{copy.skill}
                  <select value={skill} onChange={(event) => setSkill(event.target.value)}>
                    <option value="">{copy.allSkills}</option>
                    {Object.entries(rainSkills).map(([id, item]) => <option key={id} value={id}>{item[locale]}</option>)}
                  </select>
                </label>
                <button className={`text-nav-action ${styles.reset}`} type="button" disabled={!stage && !letter && !skill}
                  onClick={() => { setStage(""); setLetter(""); setSkill(""); }}>
                  {copy.reset}
                </button>
              </div>
              <p className={styles.result} role="status">{visible.length ? `${copy.count} · ${visible.length}` : copy.empty}</p>
            </>
          )}
          <ul className={styles.grid}>
            {visible.map((item) => <MaterialCard key={item.id} item={item} locale={locale} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
