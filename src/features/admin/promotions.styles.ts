import { cn } from "@/lib/utils";

/**
 * ปุ่มและช่องกรอกบนหน้า /admin/promotions (Figma PRM-A1 / A2): มุม 6px กรอบขาวเส้นเทา 1px
 * แทนพื้นเทามุมมนของ design system — ใส่ที่ root ของหน้า ช่องที่ปิดอยู่เป็นพื้นเทา
 */
export const PROMOTION_PAGE_CONTROLS = cn(
  "**:data-[slot=button]:rounded-sm",
  "**:data-[slot=input]:rounded-sm **:data-[slot=input]:border-border **:data-[slot=input]:bg-card",
  "**:data-[slot=input-group]:rounded-sm **:data-[slot=input-group]:border-border **:data-[slot=input-group]:bg-card",
  "**:data-[slot=input-group]:has-[input:disabled]:bg-muted",
);

/** แบบเดียวกันใน modal (Figma PRM-M1 / M2): มุม 8px ตัวอักษร 13px ปุ่มตัวหนา */
export const PROMOTION_DIALOG_CONTROLS = cn(
  "**:data-[slot=button]:rounded-md **:data-[slot=button]:text-[13px] **:data-[slot=button]:font-semibold",
  "**:data-[slot=input]:rounded-md **:data-[slot=input]:border-border **:data-[slot=input]:bg-card **:data-[slot=input]:text-[13px]",
  "**:data-[slot=textarea]:rounded-md **:data-[slot=textarea]:border-border **:data-[slot=textarea]:bg-card **:data-[slot=textarea]:text-[13px]",
  "**:data-[slot=native-select]:rounded-md **:data-[slot=native-select]:border-border **:data-[slot=native-select]:bg-card **:data-[slot=native-select]:text-[13px]",
);

/** ปุ่มยืนยันที่ทำลายข้อมูลใน modal เป็นแดงทึบ (Figma PRM-M1 / M2) ไม่ใช่แดงจางของ `variant="destructive"` */
export const PROMOTION_DANGER_BUTTON = "bg-destructive text-white hover:bg-destructive/90";
