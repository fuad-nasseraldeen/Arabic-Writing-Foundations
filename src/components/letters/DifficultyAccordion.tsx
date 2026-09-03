"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ArabicLetter } from "@/data/letters";
export function DifficultyAccordion({
  items,
}: {
  items: ArabicLetter["commonDifficulties"];
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="accordion">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div className="accordion-item" key={item.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`difficulty-${item.id}`}
              onClick={() => setOpen(isOpen ? null : item.id)}
            >
              {item.title}
              <ChevronDown className={isOpen ? "rotated" : ""} />
            </button>
            <div
              id={`difficulty-${item.id}`}
              className="accordion-panel"
              hidden={!isOpen}
            >
              <div className="accordion-content">
                <b>כיוון אפשרי לתרגול:</b> {item.strategy}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
