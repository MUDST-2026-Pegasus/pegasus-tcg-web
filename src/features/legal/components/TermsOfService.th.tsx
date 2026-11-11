import { useLegalScrollSpy } from "../use-legal-scroll-spy";

interface TermsSection {
  id: string;
  title: string;
  content: string;
  rules?: string[];
}

const sections: TermsSection[] = [
  {
    id: "01",
    title: "บทนำ",
    content:
      "ยินดีต้อนรับสู่ PEGASUS การเข้าถึงหรือใช้งานเว็บไซต์ของเราถือว่าท่านยอมรับข้อกำหนดการใช้บริการนี้ หากท่านไม่ยอมรับข้อกำหนดเหล่านี้ ท่านจะไม่สามารถเข้าถึงเว็บไซต์หรือใช้บริการของเราได้",
  },
  {
    id: "02",
    title: "บัญชีผู้ใช้และการลงทะเบียน",
    content:
      "ฟีเจอร์บางส่วนจำเป็นต้องมีบัญชีผู้ใช้ ท่านมีหน้าที่รักษาความลับของข้อมูลการเข้าสู่ระบบ และรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของท่าน",
  },
  {
    id: "03",
    title: "สินค้าและราคา",
    content:
      "สินค้าขึ้นอยู่กับจำนวนที่มีอยู่ เราอาจเปลี่ยนแปลงราคา ยุติการจำหน่ายสินค้า หรือยกเลิกคำสั่งซื้อที่ได้รับผลกระทบจากข้อผิดพลาดด้านราคา ค่าจัดส่งและภาษียังไม่รวมอยู่ในราคาสินค้า เว้นแต่จะระบุไว้เป็นอย่างอื่น",
  },
  {
    id: "04",
    title: "การชำระเงินและการเรียกเก็บเงิน",
    content:
      "การระบุวิธีการชำระเงินถือว่าท่านยืนยันว่ามีสิทธิ์ใช้งานวิธีชำระเงินดังกล่าว การทำธุรกรรมทั้งหมดได้รับการดูแลอย่างปลอดภัยผ่านผู้ให้บริการระบบชำระเงินบุคคลที่สาม",
  },
  {
    id: "05",
    title: "การจัดส่งและการคืนสินค้า",
    content:
      "ระยะเวลาการจัดส่งเป็นการประมาณการและไม่สามารถรับประกันได้ หากท่านไม่พึงพอใจในสินค้าที่สั่งซื้อ โปรดตรวจสอบนโยบายการคืนสินค้าของเราเพื่อดูเกณฑ์การขอคืนเงินและการเปลี่ยนสินค้า",
  },
  {
    id: "06",
    title: "การประมูล",
    content: "การประมูลบน PEGASUS มีกติกาปฏิบัติดังนี้:",
    // กติกาจาก Epic TCG-612 [TCG-636]
    rules: [
      "ไม่สามารถถอนการเสนอราคาได้ ท่านต้องยืนยันการเสนอราคาทุกครั้งก่อนส่ง",
      "การต่อเวลาประมูล: การเสนอราคาในช่วง 2 นาทีสุดท้ายจะรีเซ็ตเวลานับถอยหลังเป็น 2 นาที โดยไม่จำกัดจำนวนครั้งการต่อเวลา",
      "ซื้อทันที (Buy Now): ผู้ขายสามารถเปิดใช้งานหรือปรับราคาได้จนกว่าจะมีการเสนอราคาครั้งแรก หลังจากนั้นตัวเลือกซื้อทันทีจะถูกนำออก",
      "ผู้ชนะการประมูลต้องชำระเงินภายใน 24 ชั่วโมงผ่านขั้นตอนชำระเงินตามปกติ ในราคาที่ชนะการประมูล",
      "หากผู้ชนะไม่ชำระเงินตามกำหนด คำสั่งซื้อและการประมูลจะถูกยกเลิก การ์ดจะถูกนำกลับเข้าสต็อกของผู้ขาย และผู้ชนะจะได้รับสไตรก์ไม่ชำระเงิน 1 ครั้ง",
      "การได้รับสไตรก์ไม่ชำระเงินครบ 3 ครั้ง จะถูกระงับสิทธิ์การเสนอราคาประมูลเป็นเวลา 30 วัน ทั้งนี้ยังคงสามารถสั่งซื้อสินค้าตามปกติได้",
    ],
  },
  {
    id: "07",
    title: "ข้อจำกัดความรับผิด",
    content:
      "PEGASUS ไม่รับผิดชอบต่อความเสียหายทางอ้อม ความเสียหายสืบเนื่อง หรือความเสียหายพิเศษใด ๆ ที่เกิดขึ้นจากการใช้บริการหรือสินค้าที่ซื้อผ่านแพลตฟอร์มของเรา",
  },
  {
    id: "08",
    title: "ภาษาที่ใช้บังคับ",
    content:
      "ข้อกำหนดการใช้บริการนี้จัดทำขึ้นเป็นภาษาไทยและภาษาอังกฤษ หากฉบับภาษาไทยและภาษาอังกฤษขัดแย้งกัน ให้ถือฉบับภาษาไทยเป็นหลัก",
  },
];

const sectionIds = sections.map((s) => s.id);

export function TermsOfServiceTh() {
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
  );
}

export default TermsOfServiceTh;
