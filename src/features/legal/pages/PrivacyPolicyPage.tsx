import { translate, useLanguage } from "@/lib/language";
import { Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const sections = [
  {
    id: "01",
    get title() { return translate("ข้อมูลที่เราเก็บ", "Information We Collect"); },
    get content() { return (
      <p>{translate("เราเก็บข้อมูลที่คุณให้โดยตรง เช่น ชื่อ อีเมล ที่อยู่จัดส่ง และรายละเอียดการชำระเงิน รวมถึงอาจเก็บข้อมูลอุปกรณ์และการใช้งาน เช่น ที่อยู่ IP และประเภทเบราว์เซอร์", "We collect information you provide directly, including your name, email address, shipping address, and payment details. We may also collect device and usage data such as IP address and browser type.")}</p>
    ); },
  },
  {
    id: "02",
    get title() { return translate("การใช้ข้อมูลของคุณ", "How We Use Your Information"); },
    get content() { return (
      <div className="space-y-2">
        <p>{translate("เราใช้ข้อมูลของคุณเพื่อ:", "We use your information to:")}</p>
        <ul className="list-inside space-y-1 text-muted-foreground">
          <li>{translate("• ดำเนินการและจัดส่งคำสั่งซื้อ", "• Process and fulfill orders")}</li>
          <li>{translate("• แจ้งความคืบหน้าการซื้อและข้อมูลบัญชี", "• Communicate purchase and account updates")}</li>
          <li>{translate("• ปรับปรุงบริการและประสบการณ์ใช้งาน", "• Improve our services and user experience")}</li>
          <li>{translate("• ป้องกันการฉ้อโกงและรักษาความปลอดภัยของระบบ", "• Prevent fraud and protect system security")}</li>
        </ul>
      </div>
    ); },
  },
  {
    id: "03",
    get title() { return translate("การเปิดเผยข้อมูล", "Information Sharing"); },
    get content() { return (
      <p>{translate("เราไม่ขายข้อมูลส่วนบุคคล เราเปิดเผยข้อมูลเฉพาะกับผู้ให้บริการที่เชื่อถือได้ เช่น ผู้ให้บริการชำระเงินและขนส่ง เมื่อจำเป็นต่อการให้บริการเท่านั้น", "We do not sell personal data. We share information only with trusted providers, such as payment gateways and shipping partners, when required to deliver our services.")}</p>
    ); },
  },
  {
    id: "04",
    get title() { return translate("ความปลอดภัยของข้อมูล", "Data Security"); },
    get content() { return (
      <p>{translate("เราใช้มาตรการป้องกันตามมาตรฐานอุตสาหกรรมเพื่อดูแลข้อมูลส่วนบุคคล อย่างไรก็ตาม ไม่มีการส่งข้อมูลผ่านอินเทอร์เน็ตหรือการจัดเก็บอิเล็กทรอนิกส์ใดปลอดภัยอย่างสมบูรณ์ จึงไม่สามารถรับประกันความปลอดภัยได้ทั้งหมด", "We use industry-standard safeguards to protect personal information. No internet transmission or electronic storage method is completely secure, so absolute security cannot be guaranteed.")}</p>
    ); },
  },
  {
    id: "05",
    get title() { return translate("สิทธิของคุณ", "Your Rights"); },
    get content() { return (
      <p>{translate("คุณอาจมีสิทธิขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณตามกฎหมายในพื้นที่ของคุณ โปรดติดต่อทีมสนับสนุนเพื่อใช้สิทธิเหล่านี้", "Depending on your location, you may request access to, correction of, or deletion of your personal data. Contact our support team to exercise these rights.")}</p>
    ); },
  },
  {
    id: "06",
    get title() { return translate("ติดต่อเรา", "Contact Us"); },
    get content() { return (
      <p>{translate("หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ ติดต่อเราได้ที่ support@pegasus-store.com", "Questions about this Privacy Policy? Contact us at support@pegasus-store.com.")}</p>
    ); },
  },
];

export function PrivacyPolicyPage() {
  useLanguage();
  const [activeId, setActiveId] = useState("01");
  const isManualScroll = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isManualScroll.current) return;

      const scrollPosition = window.scrollY + 140;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50;

      if (atBottom) {
        setActiveId(sections[sections.length - 1].id);
        return;
      }

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${sections[i].id}`);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveId(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-muted/30 pb-16 pt-8">
      <div className="mx-auto max-w-[1100px] px-6 md:px-12">
        {/* Header */}
        <div className="rounded-xl border border-border/50 bg-background p-8 md:p-10 shadow-sm">
          <div className="flex w-fit items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold tracking-wider text-foreground">
            <Shield className="size-4" />{translate("ศูนย์ข้อมูลทางกฎหมาย", "LEGAL CENTER")}</div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl">{translate("นโยบายความเป็นส่วนตัว", "Privacy Policy")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{translate("วิธีที่ PEGASUS เก็บ ใช้ ปกป้อง และเคารพข้อมูลส่วนบุคคลของคุณ", "How PEGASUS collects, uses, protects, and respects your personal information.")}</p>
          <div className="mt-8 text-sm text-muted-foreground">{translate("ปรับปรุงล่าสุด", "Last updated")}<span className="font-semibold text-primary">{translate("29 สิงหาคม 2569", "August 29, 2026")}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-6 flex flex-col items-start gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="sticky top-24 w-full shrink-0 lg:w-[280px]">
            <div className="rounded-xl border border-border/50 bg-background p-6 shadow-sm">
              <h3 className="font-semibold text-foreground">{translate("เนื้อหาในหน้านี้", "On this page")}</h3>
              <ul className="mt-5 space-y-4 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => handleScrollToSection(section.id)}
                      className="flex items-center gap-3 text-left transition-colors hover:text-foreground text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-medium"
                      data-active={section.id === activeId}
                    >
                      <span className="font-semibold text-primary">{section.id}</span>
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 rounded-xl border border-border/50 bg-background p-8 shadow-sm md:p-10">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <div key={section.id} id={`section-${section.id}`} className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
                    <span className="text-[15px] font-semibold text-primary">{section.id}</span>
                    {section.title}
                  </h2>
                  <div className="mt-4 leading-relaxed text-muted-foreground">
                    {section.content}
                  </div>
                  {index < sections.length - 1 && (
                    <hr className="mt-10 border-border/60" />
                  )}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
