import { useEffect, useRef, type PropsWithChildren } from "react";

/** 스크롤 진입 시 페이드업되는 래퍼 */
export default function Reveal({
  children,
  className = "",
  as: Tag = "div",
  delay = 0,
}: PropsWithChildren<{ className?: string; as?: "div" | "section" | "li"; delay?: number }>) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
