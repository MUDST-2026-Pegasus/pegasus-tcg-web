/**
 * class ที่ตารางฟิลด์ ชุดการ์ด และหมวดหมู่ใช้ร่วมกัน — หน้าตาต้องเหมือนกันทั้งสามแท็บ
 */

/**
 * สวิตช์ในตารางเล็กกว่าไซซ์ sm ของ ui/switch อยู่นิดหน่อย (ดีไซน์ 32×18)
 * เลยบังคับขนาดของตัวรากกับหัวสวิตช์ทับค่าที่มาจาก data-size
 */
export const ROW_SWITCH =
  "h-[18px]! w-8! [&_[data-slot=switch-thumb]]:size-3.5! [&_[data-slot=switch-thumb]]:data-checked:translate-x-3.5!";

export const HEAD_CLASS =
  "h-auto py-2 text-[11px] font-medium text-muted-foreground";

export const HEAD_ROW_CLASS =
  "border-y border-[#eef1f2] bg-[#fafbfb] hover:bg-[#fafbfb]";

/** สถานะว่างที่วางต่อจากหัวการ์ด ไม่ใช่กล่องแยก */
export const CARD_EMPTY_CLASS =
  "min-h-0 rounded-none border-0 border-t border-[#eef1f2] py-10";
