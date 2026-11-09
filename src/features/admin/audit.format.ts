import { differenceInCalendarDays, format, formatDistanceStrict } from "date-fns";
import { th } from "date-fns/locale";

import type { SellerAvatarAccent } from "./admin.types";
import type { AuditLogEntry } from "./audit.types";

/**
 * แปลง audit log จาก backend → ข้อความ ป้าย และลิงก์ที่หน้าใช้แสดง
 * ใช้ร่วมกันทั้งหน้าบันทึกกิจกรรม การ์ด "กิจกรรมล่าสุด" ในหน้าภาพรวม
 * และประวัติการแก้ไขในหน้าค่าคอมมิชชั่น
 */

// ---------- ระดับของเหตุการณ์ ----------

/**
 * `normal` ปกติ · `attention` ปฏิเสธ/ล้มเหลว (ยังนับเป็นงานปกติ แค่ต้องสังเกต)
 * `important` เปลี่ยนสิทธิ์ เงิน หรือการตั้งค่า · `auto` ระบบทำเอง
 */
export type AuditTone = "normal" | "attention" | "important" | "auto";

export type AuditToneMeta = {
  label: string;
  dotClass: string;
  badgeClass: string;
};

/** สีเดียวกับป้ายสถานะใน `verification.format.ts` ให้ทั้งหลังบ้านดูเป็นชุดเดียว */
export const AUDIT_TONE_META: Record<AuditTone, AuditToneMeta> = {
  normal: {
    label: "ปกติ",
    dotClass: "bg-[#0d9488]",
    badgeClass: "bg-[#e6f6f4] text-[#0d9488]",
  },
  attention: {
    label: "ปกติ",
    dotClass: "bg-[#b45309]",
    badgeClass: "bg-[#fdf3e7] text-[#b45309]",
  },
  important: {
    label: "สำคัญ",
    dotClass: "bg-[#d0342c]",
    badgeClass: "bg-[#fbe9e8] text-[#d0342c]",
  },
  auto: {
    label: "อัตโนมัติ",
    dotClass: "bg-[#9aa5ad]",
    badgeClass: "bg-[#eef1f3] text-[#5b6670]",
  },
};

// ---------- action ----------

type ActionMeta = { label: string; tone: AuditTone };

/** ทุก action ที่ `AuditAction.java` มีตอนนี้ — ตัวที่ไม่อยู่ในนี้จะใช้ป้าย fallback */
export const AUDIT_ACTION_META: Record<string, ActionMeta> = {
  SELLER_VERIFICATION_SUBMITTED: { label: "ส่งคำขอเปิดร้าน", tone: "normal" },
  SELLER_VERIFICATION_REVIEW_STARTED: { label: "รับตรวจคำขอเปิดร้าน", tone: "normal" },
  SELLER_VERIFICATION_APPROVED: { label: "อนุมัติคำขอเปิดร้าน", tone: "normal" },
  SELLER_VERIFICATION_REJECTED: { label: "ปฏิเสธคำขอเปิดร้าน", tone: "attention" },

  CATALOG_PRODUCT_CREATED: { label: "เพิ่มสินค้าในแคตตาล็อก", tone: "normal" },
  CATALOG_PRODUCT_UPDATED: { label: "แก้ไขสินค้า", tone: "normal" },
  CATALOG_PRODUCT_DELETED: { label: "ลบสินค้า", tone: "important" },
  CATALOG_PRODUCT_EFFECTS_REPLACED: { label: "แก้ไขความสามารถและท่าโจมตี", tone: "normal" },
  CATALOG_IMAGE_ADDED: { label: "เพิ่มรูปสินค้า", tone: "normal" },
  CATALOG_IMAGE_PRIMARY_SET: { label: "ตั้งรูปหลักของสินค้า", tone: "normal" },
  CATALOG_IMAGE_DELETED: { label: "ลบรูปสินค้า", tone: "normal" },
  CATALOG_VARIANT_CREATED: { label: "เพิ่มรุ่นย่อยของสินค้า", tone: "normal" },
  CATALOG_VARIANT_UPDATED: { label: "แก้ไขรุ่นย่อยของสินค้า", tone: "normal" },

  GAME_CREATED: { label: "เพิ่มเกม", tone: "normal" },
  GAME_UPDATED: { label: "แก้ไขเกม", tone: "normal" },
  GAME_ATTRIBUTE_CREATED: { label: "เพิ่มฟิลด์ในสคีมา", tone: "normal" },
  GAME_ATTRIBUTE_UPDATED: { label: "แก้ไขฟิลด์ในสคีมา", tone: "normal" },
  GAME_ATTRIBUTE_DELETED: { label: "ลบฟิลด์ในสคีมา", tone: "important" },
  CATALOG_CATEGORY_CREATED: { label: "เพิ่มหมวดหมู่", tone: "normal" },
  CATALOG_CATEGORY_UPDATED: { label: "แก้ไขหมวดหมู่", tone: "normal" },
  CARD_SET_CREATED: { label: "เพิ่มชุดการ์ด", tone: "normal" },
  CARD_SET_UPDATED: { label: "แก้ไขชุดการ์ด", tone: "normal" },
  CARD_SET_DELETED: { label: "ลบชุดการ์ด", tone: "important" },

  SETTING_UPDATED: { label: "แก้ไขการตั้งค่าระบบ", tone: "important" },

  USER_ROLE_GRANTED: { label: "ให้บทบาทผู้ใช้", tone: "important" },
  USER_ROLE_REVOKED: { label: "ถอนบทบาทผู้ใช้", tone: "important" },
  USER_STATUS_CHANGED: { label: "เปลี่ยนสถานะบัญชีผู้ใช้", tone: "important" },

  MARKET_PRICING_RUN: { label: "สั่งคำนวณราคาตลาด", tone: "normal" },

  COMMISSION_RULE_CREATED: { label: "เพิ่มกฎค่าคอมมิชชั่น", tone: "important" },
  COMMISSION_RULE_UPDATED: { label: "แก้ไขกฎค่าคอมมิชชั่น", tone: "important" },
  COMMISSION_RULE_DEACTIVATED: { label: "ปิดใช้กฎค่าคอมมิชชั่น", tone: "important" },
  COMMISSION_RULE_DELETED: { label: "ลบกฎค่าคอมมิชชั่น", tone: "important" },

  PAYMENT_APPROVED: { label: "อนุมัติสลิปโอนเงิน", tone: "normal" },
  PAYMENT_REJECTED: { label: "ปฏิเสธสลิปโอนเงิน", tone: "attention" },

  PAYOUT_APPROVED: { label: "อนุมัติคำขอถอนเงิน", tone: "normal" },
  PAYOUT_PROCESSING: { label: "เริ่มโอนเงินให้ผู้ขาย", tone: "normal" },
  PAYOUT_PAID: { label: "บันทึกการโอนเงินให้ผู้ขาย", tone: "normal" },
  PAYOUT_REJECTED: { label: "ปฏิเสธคำขอถอนเงิน", tone: "attention" },
  PAYOUT_FAILED: { label: "บันทึกการโอนเงินให้ผู้ขายล้มเหลว", tone: "important" },

  REFUND_PROCESSING: { label: "เริ่มโอนเงินคืนผู้ซื้อ", tone: "normal" },
  REFUND_PROCESSED: { label: "โอนเงินคืนผู้ซื้อแล้ว", tone: "normal" },
  REFUND_FAILED: { label: "บันทึกการคืนเงินล้มเหลว", tone: "important" },

  UNPAID_ORDERS_EXPIRED: { label: "ยกเลิกคำสั่งซื้อค้างชำระอัตโนมัติ", tone: "auto" },
  ORDERS_AUTO_RELEASED: { label: "ปิดคำสั่งซื้อและปล่อยเงินอัตโนมัติ", tone: "auto" },
};

const USER_STATUS_ACTION: Record<string, string> = {
  SUSPENDED: "ระงับบัญชีผู้ใช้",
  ACTIVE: "คืนสถานะบัญชีผู้ใช้",
  DEACTIVATED: "ปิดบัญชีผู้ใช้",
};

/** "SOME_NEW_ACTION" → "Some new action" — ใช้กับ action ที่หน้ายังไม่รู้จัก */
function humanize(code: string): string {
  const words = code.toLowerCase().replace(/_/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "กิจกรรม";
}

/** ข้อความกริยาของแถว เช่น "อนุมัติคำขอเปิดร้าน" */
export function actionLabel(entry: Pick<AuditLogEntry, "action" | "metadata">): string {
  if (entry.action === "USER_STATUS_CHANGED") {
    const after = changeOf(entry.metadata)?.after;
    if (typeof after === "string" && USER_STATUS_ACTION[after]) {
      return USER_STATUS_ACTION[after];
    }
  }
  return AUDIT_ACTION_META[entry.action]?.label ?? humanize(entry.action);
}

/** แถวที่ไม่มีผู้ทำ (งานตามเวลา) นับเป็น "อัตโนมัติ" เสมอ */
export function actionTone(entry: Pick<AuditLogEntry, "action" | "actor">): AuditTone {
  if (entry.actor === null) return "auto";
  return AUDIT_ACTION_META[entry.action]?.tone ?? "normal";
}

/** action ที่การ์ด "สรุปวันนี้" นับเป็น "เหตุการณ์สำคัญ" */
export const IMPORTANT_ACTIONS: readonly string[] = Object.entries(AUDIT_ACTION_META)
  .filter(([, meta]) => meta.tone === "important")
  .map(([action]) => action);

/** รวมจำนวนจาก `summary.byAction` เฉพาะ action สำคัญ */
export function countImportant(byAction: Record<string, number>): number {
  return IMPORTANT_ACTIONS.reduce((sum, action) => sum + (byAction[action] ?? 0), 0);
}

// ---------- ผู้ทำ ----------

export const SYSTEM_ACTOR_LABEL = "ระบบ";

export function actorName(entry: Pick<AuditLogEntry, "actor">): string {
  return entry.actor?.username ?? SYSTEM_ACTOR_LABEL;
}

/** "admin_kant" → "AK", "Somchai Jaidee" → "SJ", ระบบ → "SY" ตามดีไซน์ */
export function actorInitials(entry: Pick<AuditLogEntry, "actor">): string {
  if (!entry.actor) return "SY";
  const source = entry.actor.displayName?.trim() || entry.actor.username;
  const words = source.split(/[\s_.-]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : source.slice(0, 2);
  return letters.toUpperCase() || "?";
}

const ACTOR_ACCENTS: SellerAvatarAccent[] = ["primary", "teal", "amber", "red"];

/** สีวงกลมวนตาม id ให้แต่ละคนต่างกันพอแยกออก — ระบบเป็นสีเทาเสมอ */
export function actorAccent(entry: Pick<AuditLogEntry, "actor">): SellerAvatarAccent {
  if (!entry.actor) return "slate";
  return ACTOR_ACCENTS[entry.actor.userId % ACTOR_ACCENTS.length];
}

// ---------- เป้าหมาย ----------

export const TARGET_TYPE_LABEL: Record<string, string> = {
  SELLER_VERIFICATION: "คำขอเปิดร้าน",
  CATALOG_PRODUCT: "สินค้า",
  CATALOG_VARIANT: "รุ่นย่อย",
  GAME: "เกม",
  CATALOG_CATEGORY: "หมวดหมู่",
  CARD_SET: "ชุดการ์ด",
  SETTING: "การตั้งค่า",
  USER: "ผู้ใช้",
  MARKET_PRICING: "ราคาตลาด",
  COMMISSION_RULE: "กฎค่าคอมมิชชั่น",
  PAYMENT: "การชำระเงิน",
  PAYOUT: "การถอนเงิน",
  REFUND: "การคืนเงิน",
  JOB: "งานอัตโนมัติ",
};

/** ชื่อการตั้งค่าที่แอดมินคุ้น แทน key ภายใน */
const SETTING_LABEL: Record<string, string> = {
  "commission.default_rate": "ค่าคอมมิชชั่นพื้นฐาน",
  "escrow.auto_release_days": "วันปล่อยเงินอัตโนมัติ",
  "order.cancel_window_hours": "ชั่วโมงที่ยกเลิกคำสั่งซื้อได้",
  "order.payment_timeout_minutes": "นาทีที่รอชำระเงิน",
  "payment.slip_auto_approve": "อนุมัติสลิปอัตโนมัติ",
  "payment.transfer_account": "บัญชีรับโอนของแพลตฟอร์ม",
  "payout.minimum_amount": "ยอดถอนขั้นต่ำ",
};

/** ชื่อในเครื่องหมายคำพูดที่ backend ใส่ไว้ใน summary เช่น `Updated product "Pikachu ex"` */
function quotedName(summary: string): string | null {
  const match = /"([^"]+)"/.exec(summary);
  return match ? match[1] : null;
}

/** ป้ายชื่อเป้าหมายใต้ข้อความ เช่น "Pikachu ex", "ค่าคอมมิชชั่นพื้นฐาน", "ผู้ใช้ #42" */
export function targetLabel(entry: Pick<AuditLogEntry, "targetType" | "targetId" | "summary">): string {
  if (entry.targetType === "SETTING") {
    return SETTING_LABEL[entry.targetId] ?? entry.targetId;
  }
  if (entry.targetType === "JOB" || entry.targetType === "MARKET_PRICING") {
    return TARGET_TYPE_LABEL[entry.targetType];
  }
  const name = quotedName(entry.summary);
  if (name) return name;
  const type = TARGET_TYPE_LABEL[entry.targetType] ?? humanize(entry.targetType);
  return `${type} #${entry.targetId}`;
}

/** หน้าที่เปิดดูเป้าหมายได้ — `null` ถ้าไม่มีหน้าไหนเหมาะ (เช่น ของที่ถูกลบไปแล้ว) */
export function targetHref(
  entry: Pick<AuditLogEntry, "action" | "targetType" | "targetId" | "metadata">,
): string | null {
  switch (entry.targetType) {
    case "SELLER_VERIFICATION":
      return "/admin/sellers";
    case "CATALOG_PRODUCT":
      // สินค้าที่ถูกลบไม่มีหน้าให้เปิดแล้ว
      return entry.action === "CATALOG_PRODUCT_DELETED"
        ? null
        : `/admin/catalog?product=${encodeURIComponent(entry.targetId)}`;
    case "CATALOG_VARIANT": {
      const productId = entry.metadata.productId;
      return typeof productId === "number" ? `/admin/catalog?product=${productId}` : "/admin/catalog";
    }
    case "GAME":
      return `/admin/card-attributes?game=${encodeURIComponent(entry.targetId)}`;
    case "CARD_SET":
      return "/admin/card-attributes?tab=sets";
    case "CATALOG_CATEGORY":
      return "/admin/card-attributes?tab=categories";
    case "SETTING":
      return entry.targetId.startsWith("commission.") ? "/admin/commission" : null;
    case "USER":
      return `/admin/users?user=${encodeURIComponent(entry.targetId)}`;
    case "COMMISSION_RULE":
      return "/admin/commission";
    case "PAYMENT":
      return "/admin/payments";
    case "PAYOUT":
      return "/admin/payouts";
    case "REFUND":
      return "/admin/refunds";
    case "JOB":
      return "/admin/orders";
    default:
      return null;
  }
}

// ---------- ค่าเดิม → ค่าใหม่ ----------

type Change = { before: unknown; after: unknown };

function isChange(value: unknown): value is Change {
  return (
    typeof value === "object" &&
    value !== null &&
    "before" in value &&
    "after" in value &&
    Object.keys(value).length === 2
  );
}

function changeOf(metadata: Record<string, unknown>): Change | null {
  return isChange(metadata) ? metadata : null;
}

const FIELD_LABEL: Record<string, string> = {
  name: "ชื่อ",
  nameLocal: "ชื่อภาษาไทย",
  code: "รหัส",
  slug: "slug",
  active: "เปิดใช้งาน",
  displayOrder: "ลำดับการแสดง",
  ratePercent: "อัตรา (%)",
  fixedFee: "ค่าธรรมเนียมคงที่",
  minFee: "ค่าธรรมเนียมขั้นต่ำ",
  maxFee: "ค่าธรรมเนียมสูงสุด",
  priority: "ลำดับความสำคัญ",
  effectiveFrom: "เริ่มใช้",
  effectiveTo: "สิ้นสุด",
  categoryId: "หมวดหมู่",
  cardSetId: "ชุดการ์ด",
  rarityCode: "ความหายาก",
  cardNumber: "เลขการ์ด",
  description: "คำอธิบาย",
  attributes: "คุณสมบัติ",
  sku: "SKU",
  label: "ป้ายชื่อ",
  attrKey: "คีย์ฟิลด์",
  options: "ตัวเลือก",
  required: "บังคับกรอก",
  filterable: "ใช้กรองได้",
  role: "บทบาท",
  reason: "เหตุผล",
  amount: "ยอดเงิน",
  orderId: "คำสั่งซื้อ",
  redacted: "ซ่อนค่า",
};

export function fieldLabel(key: string): string {
  return FIELD_LABEL[key] ?? key;
}

/** ค่าเดียวเป็นข้อความสั้นๆ — object ซ้อนแสดงเป็น JSON บรรทัดเดียว */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "ใช่" : "ไม่ใช่";
  if (typeof value === "number" || typeof value === "string") return String(value);
  return JSON.stringify(value);
}

export type MetadataRow =
  | { kind: "change"; key: string; label: string; before: string; after: string }
  | { kind: "value"; key: string; label: string; value: string };

/**
 * metadata → แถวที่อ่านง่ายใน Sheet รายละเอียด
 * `{ before, after }` ทั้งก้อน (การตั้งค่า สถานะผู้ใช้) เป็นแถวเดียวชื่อ "ค่า"
 * ฟิลด์ที่เป็น `{ before, after }` (ผลต่างของ record) เป็นแถวเปลี่ยนค่า ที่เหลือเป็นแถวค่าธรรมดา
 */
export function metadataRows(metadata: Record<string, unknown>): MetadataRow[] {
  const whole = changeOf(metadata);
  if (whole) {
    return [
      { kind: "change", key: "value", label: "ค่า", before: formatValue(whole.before), after: formatValue(whole.after) },
    ];
  }
  return Object.entries(metadata).map(([key, value]) =>
    isChange(value)
      ? { kind: "change", key, label: fieldLabel(key), before: formatValue(value.before), after: formatValue(value.after) }
      : { kind: "value", key, label: fieldLabel(key), value: formatValue(value) },
  );
}

/**
 * สั้นๆ ต่อท้ายป้ายเป้าหมาย — "5.0 → 7.0" เมื่อเปลี่ยนค่าเดียว
 * หรือชื่อบทบาทของการให้/ถอนบทบาท ไม่งั้นแถวจะเหลือแค่ "ผู้ใช้ #21"
 */
export function targetHint(entry: Pick<AuditLogEntry, "metadata">): string | null {
  const role = entry.metadata.role;
  if (typeof role === "string") return `บทบาท ${role}`;
  return changeHint(entry.metadata);
}

/** "5.0 → 7.0" — มีเฉพาะเมื่อเปลี่ยนค่าเดียวและสั้นพอ */
export function changeHint(metadata: Record<string, unknown>): string | null {
  const changes = metadataRows(metadata).filter((row) => row.kind === "change");
  if (changes.length !== 1) return null;
  const [only] = changes;
  if (only.kind !== "change" || only.before.length > 24 || only.after.length > 24) return null;
  return `${only.before} → ${only.after}`;
}

// ---------- เวลา ----------

/** locale ไทยของ date-fns ยังพิมพ์ปี ค.ศ. ต้องบวกเป็น พ.ศ. เอง */
function buddhistYear(date: Date): number {
  return date.getFullYear() + 543;
}

/** "09:42" — เวลาในคอลัมน์ซ้ายของ timeline */
export function formatClock(value: string): string {
  return format(new Date(value), "HH:mm");
}

/** "14 ส.ค. 2569 · 09:42:10 น." — ใน tooltip และ Sheet */
export function formatFullDateTime(value: string): string {
  const date = new Date(value);
  return `${format(date, "d MMM", { locale: th })} ${buddhistYear(date)} · ${format(date, "HH:mm:ss")} น.`;
}

/** "5 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว" — สำหรับการ์ดกิจกรรมล่าสุด */
export function formatRelative(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  const seconds = (now.getTime() - date.getTime()) / 1000;
  if (seconds < 60) return "เมื่อสักครู่";
  return `${formatDistanceStrict(date, now, { locale: th, roundingMethod: "floor" })}ที่แล้ว`;
}

/** หัวกลุ่มของวัน: "วันนี้ · 14 สิงหาคม 2569", "เมื่อวาน · ...", หรือแค่วันที่ */
export function formatDayHeading(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  const full = `${format(date, "d MMMM", { locale: th })} ${buddhistYear(date)}`;
  const diff = differenceInCalendarDays(now, date);
  if (diff === 0) return `วันนี้ · ${full}`;
  if (diff === 1) return `เมื่อวาน · ${full}`;
  return full;
}

export type AuditDayGroup = { key: string; heading: string; entries: AuditLogEntry[] };

/** แบ่งแถว (ใหม่สุดก่อนอยู่แล้ว) ตามวันในเวลาท้องถิ่น คงลำดับเดิม */
export function groupByDay(entries: AuditLogEntry[], now: Date = new Date()): AuditDayGroup[] {
  const groups: AuditDayGroup[] = [];
  for (const entry of entries) {
    const key = format(new Date(entry.occurredAt), "yyyy-MM-dd");
    const last = groups.at(-1);
    if (last && last.key === key) {
      last.entries.push(entry);
    } else {
      groups.push({ key, heading: formatDayHeading(entry.occurredAt, now), entries: [entry] });
    }
  }
  return groups;
}

// ---------- ตัวกรอง ----------

/** กลุ่มใน dropdown "ทุกประเภท" — แต่ละกลุ่มกรองด้วย `targetType` หลายค่า */
export const AUDIT_CATEGORIES = {
  sellers: { label: "ผู้ขาย", targetTypes: ["SELLER_VERIFICATION"] },
  catalog: {
    label: "แคตตาล็อก",
    targetTypes: ["CATALOG_PRODUCT", "CATALOG_VARIANT", "GAME", "CATALOG_CATEGORY", "CARD_SET"],
  },
  users: { label: "ผู้ใช้", targetTypes: ["USER"] },
  finance: { label: "การเงิน", targetTypes: ["COMMISSION_RULE", "PAYMENT", "PAYOUT", "REFUND"] },
  settings: { label: "การตั้งค่า", targetTypes: ["SETTING", "MARKET_PRICING"] },
  system: { label: "ระบบอัตโนมัติ", targetTypes: ["JOB"] },
} as const satisfies Record<string, { label: string; targetTypes: readonly string[] }>;

export type AuditCategory = keyof typeof AUDIT_CATEGORIES;

export const AUDIT_RANGES = {
  today: "วันนี้",
  "7d": "7 วันล่าสุด",
  "30d": "30 วันล่าสุด",
  all: "ทั้งหมด",
} as const;

export type AuditRange = keyof typeof AUDIT_RANGES;

/** ขอบล่างของช่วงเวลา (เที่ยงคืนตามเวลาเครื่อง) เป็น ISO — `undefined` = ไม่จำกัด */
export function rangeStart(range: AuditRange, now: Date = new Date()): string | undefined {
  if (range === "all") return undefined;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "7d") start.setDate(start.getDate() - 6);
  if (range === "30d") start.setDate(start.getDate() - 29);
  return start.toISOString();
}
