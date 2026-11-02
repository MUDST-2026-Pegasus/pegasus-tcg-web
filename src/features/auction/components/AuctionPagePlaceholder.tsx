const FIGMA_FILE = "https://www.figma.com/design/9qzrCLE9TaRMHV4WJSb3PF/?node-id=";

type AuctionPagePlaceholderProps = {
  title: string;
  /** การ์ดที่จะมาทำหน้านี้ เช่น "FE-2" */
  card: string;
  /** node ใน Figma เช่น "2286-7677" */
  figmaNode: string;
};

/**
 * หน้าว่างชั่วคราวของระบบประมูล [TCG-627] — route เปิดได้ เมนูกดได้
 * การ์ด FE-2 ถึง FE-9 แทนที่ไฟล์หน้าของตัวเองแล้วลบการเรียก component นี้ออก
 */
export function AuctionPagePlaceholder({ title, card, figmaNode }: AuctionPagePlaceholderProps) {
  return (
    <section className="flex flex-col gap-2 py-8">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">
        หน้านี้อยู่ระหว่างทำในการ์ด {card} ·{" "}
        <a href={`${FIGMA_FILE}${figmaNode}`} target="_blank" rel="noreferrer" className="text-primary underline">
          ดูดีไซน์ใน Figma
        </a>
      </p>
    </section>
  );
}
