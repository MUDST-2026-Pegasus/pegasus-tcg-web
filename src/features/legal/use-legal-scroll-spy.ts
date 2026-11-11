import { useEffect, useRef, useState } from "react";

export function useLegalScrollSpy(sectionIds: string[]) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "01");
  const isManualScroll = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const handleScroll = () => {
      if (isManualScroll.current) return;

      const scrollPosition = window.scrollY + 140;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50;

      if (atBottom) {
        setActiveId(sectionIds[sectionIds.length - 1]);
        return;
      }

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${sectionIds[i]}`);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveId(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [sectionIds]);

  const handleScrollToSection = (id: string) => {
    setActiveId(id);
    isManualScroll.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isManualScroll.current = false;
    }, 800);

    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return { activeId, handleScrollToSection };
}
