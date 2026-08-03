import { useState, type ReactNode } from "react";

export interface AccordionItem {
  title: ReactNode;
  content: ReactNode;
}

/** 기획안 슬라이드 11·31 — 아코디언 UI (프로세스/광고 유형 설명) */
export default function Accordion({
  items,
  light = false,
}: {
  items: AccordionItem[];
  light?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={`accordion ${light ? "accordion--light" : ""}`}>
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={i} className={`accordion__item ${open ? "is-open" : ""}`}>
            <button
              type="button"
              className="accordion__head"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : i)}
            >
              <span className="accordion__title">{item.title}</span>
              <svg
                className="accordion__chevron"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="accordion__body">
              <div className="accordion__content">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
