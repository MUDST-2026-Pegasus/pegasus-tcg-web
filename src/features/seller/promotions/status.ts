export type PromotionStatus = "ACTIVE" | "SCHEDULED" | "PAUSED" | "EXPIRED" | "USED_UP";

export const PROMOTION_STATUS_LABEL: Record<PromotionStatus, string> = {
  ACTIVE: "ใช้งานอยู่",
  SCHEDULED: "ตั้งเวลาไว้",
  PAUSED: "หยุดชั่วคราว",
  EXPIRED: "หมดอายุ",
  USED_UP: "สิทธิ์เต็ม",
};

export const PROMOTION_STATUS_STYLE: Record<PromotionStatus, string> = {
  ACTIVE: "bg-[#e7f6ee] text-[#007a4a]",
  SCHEDULED: "bg-[#e8f1fc] text-[#0058bc]",
  PAUSED: "bg-[#fdf0dd] text-[#b45309]",
  EXPIRED: "bg-[#eef1f2] text-[#67787c]",
  USED_UP: "bg-[#fde8e8] text-[#b42318]",
};
