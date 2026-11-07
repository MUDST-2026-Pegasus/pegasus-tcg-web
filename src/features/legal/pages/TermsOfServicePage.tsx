import { translate, useLanguage } from "@/lib/language";
import { FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type TermsSection = { id: string; title: string; content: string; rules?: string[] };

const sections: TermsSection[] = [
  {
    id: "01",
    get title() { return translate("บทนำ", "Introduction"); },
    get content() { return translate("ยินดีต้อนรับสู่ PEGASUS การเข้าถึงหรือใช้เว็บไซต์ของเราถือว่าคุณยอมรับเงื่อนไขการใช้บริการนี้ หากคุณไม่ยอมรับ คุณจะไม่สามารถเข้าถึงเว็บไซต์หรือใช้บริการของเราได้", "Welcome to PEGASUS. By accessing or using our website, you agree to these Terms of Service. If you do not agree to these terms, you may not access the website or use our services."); },
  },
  {
    id: "02",
    get title() { return translate("บัญชีและการสมัครสมาชิก", "Accounts and Registration"); },
    get content() { return translate("บางคุณสมบัติต้องมีบัญชี คุณมีหน้าที่รักษาข้อมูลเข้าสู่ระบบเป็นความลับและรับผิดชอบกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของคุณ", "Some features require an account. You are responsible for keeping your account credentials confidential and for all activity that occurs under your account."); },
  },
  {
    id: "03",
    get title() { return translate("สินค้าและราคา", "Products and Pricing"); },
    get content() { return translate("สินค้ามีจำนวนตามสต็อก เราอาจปรับราคา ยุติการขายสินค้า หรือยกเลิกคำสั่งซื้อที่ได้รับผลกระทบจากราคาที่ผิดพลาด ราคายังไม่รวมค่าจัดส่งและภาษี เว้นแต่จะระบุไว้เป็นอย่างอื่น", "Products are subject to availability. We may update prices, discontinue products, or cancel orders affected by pricing errors. Shipping fees and duties are excluded unless stated otherwise."); },
  },
  {
    id: "04",
    get title() { return translate("การชำระเงินและการเรียกเก็บเงิน", "Payment and Billing"); },
    get content() { return translate("เมื่อให้ข้อมูลวิธีชำระเงิน คุณยืนยันว่าคุณมีสิทธิใช้วิธีนั้น ธุรกรรมจะดำเนินการอย่างปลอดภัยโดยผู้ให้บริการชำระเงินภายนอก", "By providing a payment method, you confirm that you are authorized to use it. Transactions are handled securely by third-party payment processors."); },
  },
  {
    id: "05",
    get title() { return translate("การจัดส่งและการคืนสินค้า", "Shipping and Returns"); },
    get content() { return translate("ระยะเวลาจัดส่งเป็นเพียงการประมาณและไม่มีการรับประกัน หากไม่พอใจกับสินค้า โปรดตรวจสอบนโยบายการคืนสินค้าเพื่อดูเงื่อนไขการคืนเงินและการเปลี่ยนสินค้า", "Delivery timelines are estimates and are not guaranteed. If you are not satisfied with a purchase, review our Return Policy for refund and exchange eligibility."); },
  },
  {
    id: "06",
    get title() { return translate("การประมูล", "Auctions"); },
    get content() { return translate("การประมูลบน PEGASUS เป็นไปตามกติกาต่อไปนี้:", "Auctions on PEGASUS follow these rules:"); },
    // กติกาจาก Epic TCG-612 [TCG-636]
    get rules() { return [
      translate("ไม่สามารถถอนการบิดได้ คุณต้องยืนยันทุกครั้งก่อนส่งการบิด", "Bids cannot be withdrawn. You confirm every bid before it is placed."),
      translate("การต่อเวลา: การบิดใน 2 นาทีสุดท้ายจะตั้งเวลาคงเหลือใหม่เป็น 2 นาที โดยไม่จำกัดจำนวนครั้งที่ต่อเวลา", "Extended bidding: a bid in the last 2 minutes resets the timer to 2 minutes, with no limit on extensions."),
      translate("ซื้อทันที: ผู้ขายเปิดใช้หรือเปลี่ยนราคาได้จนกว่าจะมีการบิดครั้งแรก หลังจากนั้นตัวเลือกซื้อทันทีจะถูกนำออก", "Buy now: the seller can turn it on or change its price until the first bid. After that, the Buy now option is removed."),
      translate("ผู้ชนะต้องชำระเงินภายใน 24 ชั่วโมงผ่านขั้นตอนชำระเงินปกติในราคาที่ชนะประมูล", "The winner must pay within 24 hours through the regular checkout, at the winning price."),
      translate("หากผู้ชนะไม่ชำระเงินทันเวลา คำสั่งซื้อและการประมูลจะถูกยกเลิก การ์ดจะกลับเข้าสต็อกผู้ขาย และผู้ชนะจะได้รับบันทึกไม่ชำระเงินหนึ่งครั้ง", "If the winner does not pay in time, the order and the auction are cancelled, the card returns to the seller's stock, and the winner receives one non-payment strike."),
      translate("การไม่ชำระเงินสามครั้งทำให้ถูกห้ามบิดเป็นเวลา 30 วัน แต่ยังซื้อสินค้าปกติได้", "Three non-payment strikes ban the user from bidding for 30 days. Regular purchases are still allowed."),
    ]; },
  },
  {
    id: "07",
    get title() { return translate("การจำกัดความรับผิด", "Limitation of Liability"); },
    get content() { return translate("PEGASUS ไม่รับผิดชอบต่อความเสียหายทางอ้อม ความเสียหายที่เกิดขึ้นโดยบังเอิญ หรือความเสียหายสืบเนื่องจากการใช้บริการหรือสินค้าที่ซื้อผ่านแพลตฟอร์ม", "PEGASUS is not liable for indirect, incidental, or consequential damages arising from use of our services or products purchased through the platform."); },
  },
];

export function TermsOfServicePage() {
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
            <FileText className="size-4" />{translate("ศูนย์ข้อมูลทางกฎหมาย", "LEGAL CENTER")}</div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl">{translate("เงื่อนไขการใช้บริการ", "Terms of Service")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{translate("เงื่อนไขที่ชัดเจนสำหรับการใช้ PEGASUS การจัดการบัญชี และการซื้อสินค้า", "Clear, practical terms for using PEGASUS, managing your account, and purchasing products.")}</p>
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
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {section.content}
                  </p>
                  {section.rules ? (
                    <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-relaxed text-muted-foreground">
                      {section.rules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ol>
                  ) : null}
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
