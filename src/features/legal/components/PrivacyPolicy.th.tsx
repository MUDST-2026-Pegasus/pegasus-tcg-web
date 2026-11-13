import type { ReactNode } from "react";
import { useLegalScrollSpy } from "../use-legal-scroll-spy";

interface PolicySection {
  id: string;
  title: string;
  content: ReactNode;
}

const sections: PolicySection[] = [
  {
    id: "01",
    title: "ข้อมูลที่เราจัดเก็บ",
    content: (
      <p>
        เราเก็บรวบรวมข้อมูลที่ท่านระบุโดยตรง รวมถึงชื่อ ที่อยู่อีเมล ที่อยู่จัดส่ง และรายละเอียดการชำระเงิน นอกจากนี้เราอาจเก็บรวบรวมข้อมูลอุปกรณ์และการใช้งาน เช่น ที่อยู่ IP และประเภทเบราว์เซอร์
      </p>
    ),
  },
  {
    id: "02",
    title: "วิธีการใช้ข้อมูลของคุณ",
    content: (
      <div className="space-y-2">
        <p>เราใช้ข้อมูลของท่านเพื่อ:</p>
        <ul className="list-inside space-y-1 text-muted-foreground">
          <li>• ดำเนินการและจัดส่งคำสั่งซื้อ</li>
          <li>• แจ้งข้อมูลอัปเดตเกี่ยวกับการสั่งซื้อและบัญชีผู้ใช้</li>
          <li>• ปรับปรุงบริการและประสบการณ์การใช้งานของท่าน</li>
          <li>• ป้องกันการฉ้อโกงและรักษาความปลอดภัยของระบบ</li>
        </ul>
      </div>
    ),
  },
  {
    id: "03",
    title: "การเปิดเผยข้อมูล",
    content: (
      <p>
        เราไม่ขายข้อมูลส่วนบุคคลของท่าน เราแบ่งปันข้อมูลกับผู้ให้บริการที่เชื่อถือได้เท่านั้น เช่น ผู้ให้บริการระบบชำระเงินและพันธมิตรด้านการขนส่ง เมื่อจำเป็นต่อการส่งมอบบริการของเรา
      </p>
    ),
  },
  {
    id: "04",
    title: "ความปลอดภัยของข้อมูล",
    content: (
      <p>
        เราใช้มาตรการคุ้มครองความปลอดภัยตามมาตรฐานอุตสาหกรรมเพื่อปกป้องข้อมูลส่วนบุคคล อย่างไรก็ตาม ไม่มีวิธีการส่งข้อมูลผ่านอินเทอร์เน็ตหรือระบบจัดเก็บข้อมูลอิเล็กทรอนิกส์ใดที่มีความปลอดภัย 100% จึงไม่สามารถรับประกันความปลอดภัยโดยสมบูรณ์ได้
      </p>
    ),
  },
  {
    id: "05",
    title: "สิทธิของคุณ",
    content: (
      <p>
        ท่านอาจมีสิทธิขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของท่านได้ตามที่กฎหมายกำหนด โปรดติดต่อทีมสนับสนุนของเราเพื่อใช้สิทธิดังกล่าว
      </p>
    ),
  },
  {
    id: "06",
    title: "ติดต่อเรา",
    content: (
      <p>
        หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ สามารถติดต่อเราได้ที่ support@pegasus-store.com
      </p>
    ),
  },
  {
    id: "07",
    title: "ภาษาที่ใช้บังคับ",
    content: (
      <p>
        นโยบายความเป็นส่วนตัวนี้จัดทำขึ้นเป็นภาษาไทยและภาษาอังกฤษ หากฉบับภาษาไทยและภาษาอังกฤษขัดแย้งกัน ให้ถือฉบับภาษาไทยเป็นหลัก
      </p>
    ),
  },
];

const sectionIds = sections.map((s) => s.id);

export function PrivacyPolicyTh() {
  const { activeId, handleScrollToSection } = useLegalScrollSpy(sectionIds);

  return (
    <div className="mt-6 flex flex-col items-start gap-6 lg:flex-row">
      {/* Sidebar */}
      <aside className="sticky top-24 w-full shrink-0 lg:w-[280px]">
        <div className="rounded-xl border border-border/50 bg-background p-6 shadow-sm">
          <h3 className="font-semibold text-foreground">ในหน้านี้</h3>
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
  );
}

export default PrivacyPolicyTh;
