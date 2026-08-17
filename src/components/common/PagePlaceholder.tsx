import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

type PagePlaceholderProps = {
  /** ชื่อหน้าตามที่ตั้งไว้ใน Figma */
  title: string;
  /** node id ใน Figma ไฟล์ 9qzrCLE9TaRMHV4WJSb3PF — เว้นว่างได้ถ้ายังไม่รู้ */
  figmaNode?: string;
};

/**
 * ตัวคั่นชั่วคราวสำหรับหน้าที่ยังไม่ได้ทำ
 * เมื่อลงมือทำหน้าไหนแล้ว ให้ลบ PagePlaceholder ออกจากไฟล์นั้นได้เลย
 */
export function PagePlaceholder({ title, figmaNode }: PagePlaceholderProps) {
  return (
    <Empty className="min-h-[60svh]">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          ยังไม่ได้ทำหน้านี้
          {figmaNode ? ` · Figma node ${figmaNode}` : null}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
