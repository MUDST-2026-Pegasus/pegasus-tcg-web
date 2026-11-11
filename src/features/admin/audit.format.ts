import { differenceInCalendarDays, format } from "date-fns";

import { formatDate, formatRelative as formatRelativeI18n, translate } from "@/lib/i18n";

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
  get normal() {
    return {
      label: translate("admin", "audit.tone.normal", "ปกติ"),
      dotClass: "bg-[#0d9488]",
      badgeClass: "bg-[#e6f6f4] text-[#0d9488]",
    };
  },
  get attention() {
    return {
      label: translate("admin", "audit.tone.attention", "ปกติ"),
      dotClass: "bg-[#b45309]",
      badgeClass: "bg-[#fdf3e7] text-[#b45309]",
    };
  },
  get important() {
    return {
      label: translate("admin", "audit.tone.important", "สำคัญ"),
      dotClass: "bg-[#d0342c]",
      badgeClass: "bg-[#fbe9e8] text-[#d0342c]",
    };
  },
  get auto() {
    return {
      label: translate("admin", "audit.tone.auto", "อัตโนมัติ"),
      dotClass: "bg-[#9aa5ad]",
      badgeClass: "bg-[#eef1f3] text-[#5b6670]",
    };
  },
};

// ---------- action ----------

type ActionMeta = { label: string; tone: AuditTone };

const action = (label: string, tone: AuditTone): ActionMeta => ({ label, tone });

/** ทุก action ที่ `AuditAction.java` มีตอนนี้ — ตัวที่ไม่อยู่ในนี้จะใช้ป้าย fallback */
export const AUDIT_ACTION_META: Record<string, ActionMeta> = {
  get SELLER_VERIFICATION_SUBMITTED() { return action(translate("admin", "audit.action.sellerVerificationSubmitted", "ส่งคำขอเปิดร้าน"), "normal"); },
  get SELLER_VERIFICATION_REVIEW_STARTED() { return action(translate("admin", "audit.action.sellerVerificationReviewStarted", "รับตรวจคำขอเปิดร้าน"), "normal"); },
  get SELLER_VERIFICATION_APPROVED() { return action(translate("admin", "audit.action.sellerVerificationApproved", "อนุมัติคำขอเปิดร้าน"), "normal"); },
  get SELLER_VERIFICATION_REJECTED() { return action(translate("admin", "audit.action.sellerVerificationRejected", "ปฏิเสธคำขอเปิดร้าน"), "attention"); },

  get CATALOG_PRODUCT_CREATED() { return action(translate("admin", "audit.action.catalogProductCreated", "เพิ่มสินค้าในแคตตาล็อก"), "normal"); },
  get CATALOG_PRODUCT_UPDATED() { return action(translate("admin", "audit.action.catalogProductUpdated", "แก้ไขสินค้า"), "normal"); },
  get CATALOG_PRODUCT_DELETED() { return action(translate("admin", "audit.action.catalogProductDeleted", "ลบสินค้า"), "important"); },
  get CATALOG_PRODUCT_EFFECTS_REPLACED() { return action(translate("admin", "audit.action.catalogProductEffectsReplaced", "แก้ไขความสามารถและท่าโจมตี"), "normal"); },
  get CATALOG_IMAGE_ADDED() { return action(translate("admin", "audit.action.catalogImageAdded", "เพิ่มรูปสินค้า"), "normal"); },
  get CATALOG_IMAGE_PRIMARY_SET() { return action(translate("admin", "audit.action.catalogImagePrimarySet", "ตั้งรูปหลักของสินค้า"), "normal"); },
  get CATALOG_IMAGE_DELETED() { return action(translate("admin", "audit.action.catalogImageDeleted", "ลบรูปสินค้า"), "normal"); },
  get CATALOG_VARIANT_CREATED() { return action(translate("admin", "audit.action.catalogVariantCreated", "เพิ่มรุ่นย่อยของสินค้า"), "normal"); },
  get CATALOG_VARIANT_UPDATED() { return action(translate("admin", "audit.action.catalogVariantUpdated", "แก้ไขรุ่นย่อยของสินค้า"), "normal"); },

  get GAME_CREATED() { return action(translate("admin", "audit.action.gameCreated", "เพิ่มเกม"), "normal"); },
  get GAME_UPDATED() { return action(translate("admin", "audit.action.gameUpdated", "แก้ไขเกม"), "normal"); },
  get GAME_ATTRIBUTE_CREATED() { return action(translate("admin", "audit.action.gameAttributeCreated", "เพิ่มฟิลด์ในสคีมา"), "normal"); },
  get GAME_ATTRIBUTE_UPDATED() { return action(translate("admin", "audit.action.gameAttributeUpdated", "แก้ไขฟิลด์ในสคีมา"), "normal"); },
  get GAME_ATTRIBUTE_DELETED() { return action(translate("admin", "audit.action.gameAttributeDeleted", "ลบฟิลด์ในสคีมา"), "important"); },
  get CATALOG_CATEGORY_CREATED() { return action(translate("admin", "audit.action.catalogCategoryCreated", "เพิ่มหมวดหมู่"), "normal"); },
  get CATALOG_CATEGORY_UPDATED() { return action(translate("admin", "audit.action.catalogCategoryUpdated", "แก้ไขหมวดหมู่"), "normal"); },
  get CARD_SET_CREATED() { return action(translate("admin", "audit.action.cardSetCreated", "เพิ่มชุดการ์ด"), "normal"); },
  get CARD_SET_UPDATED() { return action(translate("admin", "audit.action.cardSetUpdated", "แก้ไขชุดการ์ด"), "normal"); },
  get CARD_SET_DELETED() { return action(translate("admin", "audit.action.cardSetDeleted", "ลบชุดการ์ด"), "important"); },

  get SETTING_UPDATED() { return action(translate("admin", "audit.action.settingUpdated", "แก้ไขการตั้งค่าระบบ"), "important"); },

  get USER_ROLE_GRANTED() { return action(translate("admin", "audit.action.userRoleGranted", "ให้บทบาทผู้ใช้"), "important"); },
  get USER_ROLE_REVOKED() { return action(translate("admin", "audit.action.userRoleRevoked", "ถอนบทบาทผู้ใช้"), "important"); },
  get USER_STATUS_CHANGED() { return action(translate("admin", "audit.action.userStatusChanged", "เปลี่ยนสถานะบัญชีผู้ใช้"), "important"); },

  get MARKET_PRICING_RUN() { return action(translate("admin", "audit.action.marketPricingRun", "สั่งคำนวณราคาตลาด"), "normal"); },

  get COMMISSION_RULE_CREATED() { return action(translate("admin", "audit.action.commissionRuleCreated", "เพิ่มกฎค่าคอมมิชชั่น"), "important"); },
  get COMMISSION_RULE_UPDATED() { return action(translate("admin", "audit.action.commissionRuleUpdated", "แก้ไขกฎค่าคอมมิชชั่น"), "important"); },
  get COMMISSION_RULE_DEACTIVATED() { return action(translate("admin", "audit.action.commissionRuleDeactivated", "ปิดใช้กฎค่าคอมมิชชั่น"), "important"); },
  get COMMISSION_RULE_DELETED() { return action(translate("admin", "audit.action.commissionRuleDeleted", "ลบกฎค่าคอมมิชชั่น"), "important"); },

  get PAYMENT_APPROVED() { return action(translate("admin", "audit.action.paymentApproved", "อนุมัติสลิปโอนเงิน"), "normal"); },
  get PAYMENT_REJECTED() { return action(translate("admin", "audit.action.paymentRejected", "ปฏิเสธสลิปโอนเงิน"), "attention"); },

  get PAYOUT_APPROVED() { return action(translate("admin", "audit.action.payoutApproved", "อนุมัติคำขอถอนเงิน"), "normal"); },
  get PAYOUT_PROCESSING() { return action(translate("admin", "audit.action.payoutProcessing", "เริ่มโอนเงินให้ผู้ขาย"), "normal"); },
  get PAYOUT_PAID() { return action(translate("admin", "audit.action.payoutPaid", "บันทึกการโอนเงินให้ผู้ขาย"), "normal"); },
  get PAYOUT_REJECTED() { return action(translate("admin", "audit.action.payoutRejected", "ปฏิเสธคำขอถอนเงิน"), "attention"); },
  get PAYOUT_FAILED() { return action(translate("admin", "audit.action.payoutFailed", "บันทึกการโอนเงินให้ผู้ขายล้มเหลว"), "important"); },

  get REFUND_PROCESSING() { return action(translate("admin", "audit.action.refundProcessing", "เริ่มโอนเงินคืนผู้ซื้อ"), "normal"); },
  get REFUND_PROCESSED() { return action(translate("admin", "audit.action.refundProcessed", "โอนเงินคืนผู้ซื้อแล้ว"), "normal"); },
  get REFUND_FAILED() { return action(translate("admin", "audit.action.refundFailed", "บันทึกการคืนเงินล้มเหลว"), "important"); },

  get UNPAID_ORDERS_EXPIRED() { return action(translate("admin", "audit.action.unpaidOrdersExpired", "ยกเลิกคำสั่งซื้อค้างชำระอัตโนมัติ"), "auto"); },
  get ORDERS_AUTO_RELEASED() { return action(translate("admin", "audit.action.ordersAutoReleased", "ปิดคำสั่งซื้อและปล่อยเงินอัตโนมัติ"), "auto"); },
};

const USER_STATUS_ACTION: Record<string, string> = {
  get SUSPENDED() { return translate("admin", "audit.userStatus.suspended", "ระงับบัญชีผู้ใช้"); },
  get ACTIVE() { return translate("admin", "audit.userStatus.active", "คืนสถานะบัญชีผู้ใช้"); },
  get DEACTIVATED() { return translate("admin", "audit.userStatus.deactivated", "ปิดบัญชีผู้ใช้"); },
};

/** "SOME_NEW_ACTION" → "Some new action" — ใช้กับ action ที่หน้ายังไม่รู้จัก */
function humanize(code: string): string {
  const words = code.toLowerCase().replace(/_/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : translate("admin", "audit.action.activity", "กิจกรรม");
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
export const IMPORTANT_ACTIONS: readonly string[] = [
  "CATALOG_PRODUCT_DELETED",
  "GAME_ATTRIBUTE_DELETED",
  "CARD_SET_DELETED",
  "SETTING_UPDATED",
  "USER_ROLE_GRANTED",
  "USER_ROLE_REVOKED",
  "USER_STATUS_CHANGED",
  "COMMISSION_RULE_CREATED",
  "COMMISSION_RULE_UPDATED",
  "COMMISSION_RULE_DEACTIVATED",
  "COMMISSION_RULE_DELETED",
  "PAYOUT_FAILED",
  "REFUND_FAILED",
];

/** รวมจำนวนจาก `summary.byAction` เฉพาะ action สำคัญ */
export function countImportant(byAction: Record<string, number>): number {
  return IMPORTANT_ACTIONS.reduce((sum, action) => sum + (byAction[action] ?? 0), 0);
}

// ---------- ผู้ทำ ----------

// @tolgee-key admin.audit.actor.system
export const SYSTEM_ACTOR_LABEL = translate("admin", "audit.actor.system", "ระบบ");

export function actorName(entry: Pick<AuditLogEntry, "actor">): string {
  return entry.actor?.username ?? translate("admin", "audit.actor.system", "ระบบ");
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
  get SELLER_VERIFICATION() { return translate("admin", "audit.target.sellerVerification", "คำขอเปิดร้าน"); },
  get CATALOG_PRODUCT() { return translate("admin", "audit.target.catalogProduct", "สินค้า"); },
  get CATALOG_VARIANT() { return translate("admin", "audit.target.catalogVariant", "รุ่นย่อย"); },
  get GAME() { return translate("admin", "audit.target.game", "เกม"); },
  get CATALOG_CATEGORY() { return translate("admin", "audit.target.catalogCategory", "หมวดหมู่"); },
  get CARD_SET() { return translate("admin", "audit.target.cardSet", "ชุดการ์ด"); },
  get SETTING() { return translate("admin", "audit.target.setting", "การตั้งค่า"); },
  get USER() { return translate("admin", "audit.target.user", "ผู้ใช้"); },
  get MARKET_PRICING() { return translate("admin", "audit.target.marketPricing", "ราคาตลาด"); },
  get COMMISSION_RULE() { return translate("admin", "audit.target.commissionRule", "กฎค่าคอมมิชชั่น"); },
  get PAYMENT() { return translate("admin", "audit.target.payment", "การชำระเงิน"); },
  get PAYOUT() { return translate("admin", "audit.target.payout", "การถอนเงิน"); },
  get REFUND() { return translate("admin", "audit.target.refund", "การคืนเงิน"); },
  get JOB() { return translate("admin", "audit.target.job", "งานอัตโนมัติ"); },
};

/** ชื่อการตั้งค่าที่แอดมินคุ้น แทน key ภายใน */
const SETTING_LABEL: Record<string, string> = {
  get "commission.default_rate"() { return translate("admin", "audit.setting.commissionDefaultRate", "ค่าคอมมิชชั่นพื้นฐาน"); },
  get "escrow.auto_release_days"() { return translate("admin", "audit.setting.escrowAutoReleaseDays", "วันปล่อยเงินอัตโนมัติ"); },
  get "order.cancel_window_hours"() { return translate("admin", "audit.setting.orderCancelWindowHours", "ชั่วโมงที่ยกเลิกคำสั่งซื้อได้"); },
  get "order.payment_timeout_minutes"() { return translate("admin", "audit.setting.orderPaymentTimeoutMinutes", "นาทีที่รอชำระเงิน"); },
  get "payment.slip_auto_approve"() { return translate("admin", "audit.setting.paymentSlipAutoApprove", "อนุมัติสลิปอัตโนมัติ"); },
  get "payment.transfer_account"() { return translate("admin", "audit.setting.paymentTransferAccount", "บัญชีรับโอนของแพลตฟอร์ม"); },
  get "payout.minimum_amount"() { return translate("admin", "audit.setting.payoutMinimumAmount", "ยอดถอนขั้นต่ำ"); },
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
  get name() { return translate("admin", "audit.field.name", "ชื่อ"); },
  get nameLocal() { return translate("admin", "audit.field.nameLocal", "ชื่อภาษาไทย"); },
  get code() { return translate("admin", "audit.field.code", "รหัส"); },
  get slug() { return translate("admin", "audit.field.slug", "slug"); },
  get active() { return translate("admin", "audit.field.active", "เปิดใช้งาน"); },
  get displayOrder() { return translate("admin", "audit.field.displayOrder", "ลำดับการแสดง"); },
  get ratePercent() { return translate("admin", "audit.field.ratePercent", "อัตรา (%)"); },
  get fixedFee() { return translate("admin", "audit.field.fixedFee", "ค่าธรรมเนียมคงที่"); },
  get minFee() { return translate("admin", "audit.field.minFee", "ค่าธรรมเนียมขั้นต่ำ"); },
  get maxFee() { return translate("admin", "audit.field.maxFee", "ค่าธรรมเนียมสูงสุด"); },
  get priority() { return translate("admin", "audit.field.priority", "ลำดับความสำคัญ"); },
  get effectiveFrom() { return translate("admin", "audit.field.effectiveFrom", "เริ่มใช้"); },
  get effectiveTo() { return translate("admin", "audit.field.effectiveTo", "สิ้นสุด"); },
  get categoryId() { return translate("admin", "audit.field.categoryId", "หมวดหมู่"); },
  get cardSetId() { return translate("admin", "audit.field.cardSetId", "ชุดการ์ด"); },
  get rarityCode() { return translate("admin", "audit.field.rarityCode", "ความหายาก"); },
  get cardNumber() { return translate("admin", "audit.field.cardNumber", "เลขการ์ด"); },
  get description() { return translate("admin", "audit.field.description", "คำอธิบาย"); },
  get attributes() { return translate("admin", "audit.field.attributes", "คุณสมบัติ"); },
  get sku() { return translate("admin", "audit.field.sku", "SKU"); },
  get label() { return translate("admin", "audit.field.label", "ป้ายชื่อ"); },
  get attrKey() { return translate("admin", "audit.field.attrKey", "คีย์ฟิลด์"); },
  get options() { return translate("admin", "audit.field.options", "ตัวเลือก"); },
  get required() { return translate("admin", "audit.field.required", "บังคับกรอก"); },
  get filterable() { return translate("admin", "audit.field.filterable", "ใช้กรองได้"); },
  get role() { return translate("admin", "audit.field.role", "บทบาท"); },
  get reason() { return translate("admin", "audit.field.reason", "เหตุผล"); },
  get amount() { return translate("admin", "audit.field.amount", "ยอดเงิน"); },
  get orderId() { return translate("admin", "audit.field.orderId", "คำสั่งซื้อ"); },
  get redacted() { return translate("admin", "audit.field.redacted", "ซ่อนค่า"); },
};

export function fieldLabel(key: string): string {
  return FIELD_LABEL[key] ?? key;
}

/** ค่าเดียวเป็นข้อความสั้นๆ — object ซ้อนแสดงเป็น JSON บรรทัดเดียว */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") {
    return value
      ? translate("admin", "audit.value.yes", "ใช่")
      : translate("admin", "audit.value.no", "ไม่ใช่");
  }
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
      {
        kind: "change",
        key: "value",
        label: translate("admin", "audit.field.value", "ค่า"),
        before: formatValue(whole.before),
        after: formatValue(whole.after),
      },
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
  if (typeof role === "string") {
    return translate("admin", "audit.hint.role", "บทบาท {role}", { role });
  }
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

/** "09:42" — เวลาในคอลัมน์ซ้ายของ timeline */
export function formatClock(value: string): string {
  return format(new Date(value), "HH:mm");
}

/** "14 ส.ค. 2569 · 09:42:10 น." — ใน tooltip และ Sheet */
export function formatFullDateTime(value: string): string {
  const date = new Date(value);
  return translate("admin", "audit.entryTime", "{date} · {time} น.", {
    date: formatDate(date),
    time: format(date, "HH:mm:ss"),
  });
}

/** "5 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว" — สำหรับการ์ดกิจกรรมล่าสุด */
export function formatRelative(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  const seconds = (now.getTime() - date.getTime()) / 1000;
  if (seconds < 60) return translate("admin", "audit.relative.justNow", "เมื่อสักครู่");
  return formatRelativeI18n(date, now);
}

/** หัวกลุ่มของวัน: "วันนี้ · 14 สิงหาคม 2569", "เมื่อวาน · ...", หรือแค่วันที่ */
export function formatDayHeading(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  const full = formatDate(date, { day: "numeric", month: "long", year: "numeric" });
  const diff = differenceInCalendarDays(now, date);
  if (diff === 0) return translate("admin", "audit.day.todayWithDate", "วันนี้ · {date}", { date: full });
  if (diff === 1) return translate("admin", "audit.day.yesterdayWithDate", "เมื่อวาน · {date}", { date: full });
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
  get sellers() {
    return {
      label: translate("admin", "audit.category.sellers", "ผู้ขาย"),
      targetTypes: ["SELLER_VERIFICATION"],
    };
  },
  get catalog() {
    return {
      label: translate("admin", "audit.category.catalog", "แคตตาล็อก"),
      targetTypes: ["CATALOG_PRODUCT", "CATALOG_VARIANT", "GAME", "CATALOG_CATEGORY", "CARD_SET"],
    };
  },
  get users() {
    return {
      label: translate("admin", "audit.category.users", "ผู้ใช้"),
      targetTypes: ["USER"],
    };
  },
  get finance() {
    return {
      label: translate("admin", "audit.category.finance", "การเงิน"),
      targetTypes: ["COMMISSION_RULE", "PAYMENT", "PAYOUT", "REFUND"],
    };
  },
  get settings() {
    return {
      label: translate("admin", "audit.category.settings", "การตั้งค่า"),
      targetTypes: ["SETTING", "MARKET_PRICING"],
    };
  },
  get system() {
    return {
      label: translate("admin", "audit.category.system", "ระบบอัตโนมัติ"),
      targetTypes: ["JOB"],
    };
  },
} as const satisfies Record<string, { label: string; targetTypes: readonly string[] }>;

export type AuditCategory = keyof typeof AUDIT_CATEGORIES;

export const AUDIT_RANGES = {
  get today() {
    return translate("admin", "audit.range.today", "วันนี้");
  },
  get "7d"() {
    return translate("admin", "audit.range.7d", "7 วันล่าสุด");
  },
  get "30d"() {
    return translate("admin", "audit.range.30d", "30 วันล่าสุด");
  },
  get all() {
    return translate("admin", "audit.range.all", "ทั้งหมด");
  },
};

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

// @tolgee-key {"key": "audit.tone.normal", "ns": "admin", "defaultValue": "ปกติ"}
// @tolgee-key {"key": "audit.tone.attention", "ns": "admin", "defaultValue": "ปกติ"}
// @tolgee-key {"key": "audit.tone.important", "ns": "admin", "defaultValue": "สำคัญ"}
// @tolgee-key {"key": "audit.tone.auto", "ns": "admin", "defaultValue": "อัตโนมัติ"}
// @tolgee-key {"key": "audit.action.sellerVerificationSubmitted", "ns": "admin", "defaultValue": "ส่งคำขอเปิดร้าน"}
// @tolgee-key {"key": "audit.action.sellerVerificationReviewStarted", "ns": "admin", "defaultValue": "รับตรวจคำขอเปิดร้าน"}
// @tolgee-key {"key": "audit.action.sellerVerificationApproved", "ns": "admin", "defaultValue": "อนุมัติคำขอเปิดร้าน"}
// @tolgee-key {"key": "audit.action.sellerVerificationRejected", "ns": "admin", "defaultValue": "ปฏิเสธคำขอเปิดร้าน"}
// @tolgee-key {"key": "audit.action.catalogProductCreated", "ns": "admin", "defaultValue": "เพิ่มสินค้าในแคตตาล็อก"}
// @tolgee-key {"key": "audit.action.catalogProductUpdated", "ns": "admin", "defaultValue": "แก้ไขสินค้า"}
// @tolgee-key {"key": "audit.action.catalogProductDeleted", "ns": "admin", "defaultValue": "ลบสินค้า"}
// @tolgee-key {"key": "audit.action.catalogProductEffectsReplaced", "ns": "admin", "defaultValue": "แก้ไขความสามารถและท่าโจมตี"}
// @tolgee-key {"key": "audit.action.catalogImageAdded", "ns": "admin", "defaultValue": "เพิ่มรูปสินค้า"}
// @tolgee-key {"key": "audit.action.catalogImagePrimarySet", "ns": "admin", "defaultValue": "ตั้งรูปหลักของสินค้า"}
// @tolgee-key {"key": "audit.action.catalogImageDeleted", "ns": "admin", "defaultValue": "ลบรูปสินค้า"}
// @tolgee-key {"key": "audit.action.catalogVariantCreated", "ns": "admin", "defaultValue": "เพิ่มรุ่นย่อยของสินค้า"}
// @tolgee-key {"key": "audit.action.catalogVariantUpdated", "ns": "admin", "defaultValue": "แก้ไขรุ่นย่อยของสินค้า"}
// @tolgee-key {"key": "audit.action.gameCreated", "ns": "admin", "defaultValue": "เพิ่มเกม"}
// @tolgee-key {"key": "audit.action.gameUpdated", "ns": "admin", "defaultValue": "แก้ไขเกม"}
// @tolgee-key {"key": "audit.action.gameAttributeCreated", "ns": "admin", "defaultValue": "เพิ่มฟิลด์ในสคีมา"}
// @tolgee-key {"key": "audit.action.gameAttributeUpdated", "ns": "admin", "defaultValue": "แก้ไขฟิลด์ในสคีมา"}
// @tolgee-key {"key": "audit.action.gameAttributeDeleted", "ns": "admin", "defaultValue": "ลบฟิลด์ในสคีมา"}
// @tolgee-key {"key": "audit.action.catalogCategoryCreated", "ns": "admin", "defaultValue": "เพิ่มหมวดหมู่"}
// @tolgee-key {"key": "audit.action.catalogCategoryUpdated", "ns": "admin", "defaultValue": "แก้ไขหมวดหมู่"}
// @tolgee-key {"key": "audit.action.cardSetCreated", "ns": "admin", "defaultValue": "เพิ่มชุดการ์ด"}
// @tolgee-key {"key": "audit.action.cardSetUpdated", "ns": "admin", "defaultValue": "แก้ไขชุดการ์ด"}
// @tolgee-key {"key": "audit.action.cardSetDeleted", "ns": "admin", "defaultValue": "ลบชุดการ์ด"}
// @tolgee-key {"key": "audit.action.settingUpdated", "ns": "admin", "defaultValue": "แก้ไขการตั้งค่าระบบ"}
// @tolgee-key {"key": "audit.action.userRoleGranted", "ns": "admin", "defaultValue": "ให้บทบาทผู้ใช้"}
// @tolgee-key {"key": "audit.action.userRoleRevoked", "ns": "admin", "defaultValue": "ถอนบทบาทผู้ใช้"}
// @tolgee-key {"key": "audit.action.userStatusChanged", "ns": "admin", "defaultValue": "เปลี่ยนสถานะบัญชีผู้ใช้"}
// @tolgee-key {"key": "audit.action.marketPricingRun", "ns": "admin", "defaultValue": "สั่งคำนวณราคาตลาด"}
// @tolgee-key {"key": "audit.action.commissionRuleCreated", "ns": "admin", "defaultValue": "เพิ่มกฎค่าคอมมิชชั่น"}
// @tolgee-key {"key": "audit.action.commissionRuleUpdated", "ns": "admin", "defaultValue": "แก้ไขกฎค่าคอมมิชชั่น"}
// @tolgee-key {"key": "audit.action.commissionRuleDeactivated", "ns": "admin", "defaultValue": "ปิดใช้กฎค่าคอมมิชชั่น"}
// @tolgee-key {"key": "audit.action.commissionRuleDeleted", "ns": "admin", "defaultValue": "ลบกฎค่าคอมมิชชั่น"}
// @tolgee-key {"key": "audit.action.paymentApproved", "ns": "admin", "defaultValue": "อนุมัติสลิปโอนเงิน"}
// @tolgee-key {"key": "audit.action.paymentRejected", "ns": "admin", "defaultValue": "ปฏิเสธสลิปโอนเงิน"}
// @tolgee-key {"key": "audit.action.payoutApproved", "ns": "admin", "defaultValue": "อนุมัติคำขอถอนเงิน"}
// @tolgee-key {"key": "audit.action.payoutProcessing", "ns": "admin", "defaultValue": "เริ่มโอนเงินให้ผู้ขาย"}
// @tolgee-key {"key": "audit.action.payoutPaid", "ns": "admin", "defaultValue": "บันทึกการโอนเงินให้ผู้ขาย"}
// @tolgee-key {"key": "audit.action.payoutRejected", "ns": "admin", "defaultValue": "ปฏิเสธคำขอถอนเงิน"}
// @tolgee-key {"key": "audit.action.payoutFailed", "ns": "admin", "defaultValue": "บันทึกการโอนเงินให้ผู้ขายล้มเหลว"}
// @tolgee-key {"key": "audit.action.refundProcessing", "ns": "admin", "defaultValue": "เริ่มโอนเงินคืนผู้ซื้อ"}
// @tolgee-key {"key": "audit.action.refundProcessed", "ns": "admin", "defaultValue": "โอนเงินคืนผู้ซื้อแล้ว"}
// @tolgee-key {"key": "audit.action.refundFailed", "ns": "admin", "defaultValue": "บันทึกการคืนเงินล้มเหลว"}
// @tolgee-key {"key": "audit.action.unpaidOrdersExpired", "ns": "admin", "defaultValue": "ยกเลิกคำสั่งซื้อค้างชำระอัตโนมัติ"}
// @tolgee-key {"key": "audit.action.ordersAutoReleased", "ns": "admin", "defaultValue": "ปิดคำสั่งซื้อและปล่อยเงินอัตโนมัติ"}
// @tolgee-key {"key": "audit.userStatus.suspended", "ns": "admin", "defaultValue": "ระงับบัญชีผู้ใช้"}
// @tolgee-key {"key": "audit.userStatus.active", "ns": "admin", "defaultValue": "คืนสถานะบัญชีผู้ใช้"}
// @tolgee-key {"key": "audit.userStatus.deactivated", "ns": "admin", "defaultValue": "ปิดบัญชีผู้ใช้"}
// @tolgee-key {"key": "audit.action.activity", "ns": "admin", "defaultValue": "กิจกรรม"}
// @tolgee-key {"key": "audit.actor.system", "ns": "admin", "defaultValue": "ระบบ"}
// @tolgee-key {"key": "audit.target.sellerVerification", "ns": "admin", "defaultValue": "คำขอเปิดร้าน"}
// @tolgee-key {"key": "audit.target.catalogProduct", "ns": "admin", "defaultValue": "สินค้า"}
// @tolgee-key {"key": "audit.target.catalogVariant", "ns": "admin", "defaultValue": "รุ่นย่อย"}
// @tolgee-key {"key": "audit.target.game", "ns": "admin", "defaultValue": "เกม"}
// @tolgee-key {"key": "audit.target.catalogCategory", "ns": "admin", "defaultValue": "หมวดหมู่"}
// @tolgee-key {"key": "audit.target.cardSet", "ns": "admin", "defaultValue": "ชุดการ์ด"}
// @tolgee-key {"key": "audit.target.setting", "ns": "admin", "defaultValue": "การตั้งค่า"}
// @tolgee-key {"key": "audit.target.user", "ns": "admin", "defaultValue": "ผู้ใช้"}
// @tolgee-key {"key": "audit.target.marketPricing", "ns": "admin", "defaultValue": "ราคาตลาด"}
// @tolgee-key {"key": "audit.target.commissionRule", "ns": "admin", "defaultValue": "กฎค่าคอมมิชชั่น"}
// @tolgee-key {"key": "audit.target.payment", "ns": "admin", "defaultValue": "การชำระเงิน"}
// @tolgee-key {"key": "audit.target.payout", "ns": "admin", "defaultValue": "การถอนเงิน"}
// @tolgee-key {"key": "audit.target.refund", "ns": "admin", "defaultValue": "การคืนเงิน"}
// @tolgee-key {"key": "audit.target.job", "ns": "admin", "defaultValue": "งานอัตโนมัติ"}
// @tolgee-key {"key": "audit.setting.commissionDefaultRate", "ns": "admin", "defaultValue": "ค่าคอมมิชชั่นพื้นฐาน"}
// @tolgee-key {"key": "audit.setting.escrowAutoReleaseDays", "ns": "admin", "defaultValue": "วันปล่อยเงินอัตโนมัติ"}
// @tolgee-key {"key": "audit.setting.orderCancelWindowHours", "ns": "admin", "defaultValue": "ชั่วโมงที่ยกเลิกคำสั่งซื้อได้"}
// @tolgee-key {"key": "audit.setting.orderPaymentTimeoutMinutes", "ns": "admin", "defaultValue": "นาทีที่รอชำระเงิน"}
// @tolgee-key {"key": "audit.setting.paymentSlipAutoApprove", "ns": "admin", "defaultValue": "อนุมัติสลิปอัตโนมัติ"}
// @tolgee-key {"key": "audit.setting.paymentTransferAccount", "ns": "admin", "defaultValue": "บัญชีรับโอนของแพลตฟอร์ม"}
// @tolgee-key {"key": "audit.setting.payoutMinimumAmount", "ns": "admin", "defaultValue": "ยอดถอนขั้นต่ำ"}
// @tolgee-key {"key": "audit.field.name", "ns": "admin", "defaultValue": "ชื่อ"}
// @tolgee-key {"key": "audit.field.nameLocal", "ns": "admin", "defaultValue": "ชื่อภาษาไทย"}
// @tolgee-key {"key": "audit.field.code", "ns": "admin", "defaultValue": "รหัส"}
// @tolgee-key {"key": "audit.field.slug", "ns": "admin", "defaultValue": "slug"}
// @tolgee-key {"key": "audit.field.active", "ns": "admin", "defaultValue": "เปิดใช้งาน"}
// @tolgee-key {"key": "audit.field.displayOrder", "ns": "admin", "defaultValue": "ลำดับการแสดง"}
// @tolgee-key {"key": "audit.field.ratePercent", "ns": "admin", "defaultValue": "อัตรา (%)"}
// @tolgee-key {"key": "audit.field.fixedFee", "ns": "admin", "defaultValue": "ค่าธรรมเนียมคงที่"}
// @tolgee-key {"key": "audit.field.minFee", "ns": "admin", "defaultValue": "ค่าธรรมเนียมขั้นต่ำ"}
// @tolgee-key {"key": "audit.field.maxFee", "ns": "admin", "defaultValue": "ค่าธรรมเนียมสูงสุด"}
// @tolgee-key {"key": "audit.field.priority", "ns": "admin", "defaultValue": "ลำดับความสำคัญ"}
// @tolgee-key {"key": "audit.field.effectiveFrom", "ns": "admin", "defaultValue": "เริ่มใช้"}
// @tolgee-key {"key": "audit.field.effectiveTo", "ns": "admin", "defaultValue": "สิ้นสุด"}
// @tolgee-key {"key": "audit.field.categoryId", "ns": "admin", "defaultValue": "หมวดหมู่"}
// @tolgee-key {"key": "audit.field.cardSetId", "ns": "admin", "defaultValue": "ชุดการ์ด"}
// @tolgee-key {"key": "audit.field.rarityCode", "ns": "admin", "defaultValue": "ความหายาก"}
// @tolgee-key {"key": "audit.field.cardNumber", "ns": "admin", "defaultValue": "เลขการ์ด"}
// @tolgee-key {"key": "audit.field.description", "ns": "admin", "defaultValue": "คำอธิบาย"}
// @tolgee-key {"key": "audit.field.attributes", "ns": "admin", "defaultValue": "คุณสมบัติ"}
// @tolgee-key {"key": "audit.field.sku", "ns": "admin", "defaultValue": "SKU"}
// @tolgee-key {"key": "audit.field.label", "ns": "admin", "defaultValue": "ป้ายชื่อ"}
// @tolgee-key {"key": "audit.field.attrKey", "ns": "admin", "defaultValue": "คีย์ฟิลด์"}
// @tolgee-key {"key": "audit.field.options", "ns": "admin", "defaultValue": "ตัวเลือก"}
// @tolgee-key {"key": "audit.field.required", "ns": "admin", "defaultValue": "บังคับกรอก"}
// @tolgee-key {"key": "audit.field.filterable", "ns": "admin", "defaultValue": "ใช้กรองได้"}
// @tolgee-key {"key": "audit.field.role", "ns": "admin", "defaultValue": "บทบาท"}
// @tolgee-key {"key": "audit.field.reason", "ns": "admin", "defaultValue": "เหตุผล"}
// @tolgee-key {"key": "audit.field.amount", "ns": "admin", "defaultValue": "ยอดเงิน"}
// @tolgee-key {"key": "audit.field.orderId", "ns": "admin", "defaultValue": "คำสั่งซื้อ"}
// @tolgee-key {"key": "audit.field.redacted", "ns": "admin", "defaultValue": "ซ่อนค่า"}
// @tolgee-key {"key": "audit.field.value", "ns": "admin", "defaultValue": "ค่า"}
// @tolgee-key {"key": "audit.hint.role", "ns": "admin", "defaultValue": "บทบาท {role}"}
// @tolgee-key {"key": "audit.relative.justNow", "ns": "admin", "defaultValue": "เมื่อสักครู่"}
// @tolgee-key {"key": "audit.day.todayWithDate", "ns": "admin", "defaultValue": "วันนี้ · {date}"}
// @tolgee-key {"key": "audit.day.yesterdayWithDate", "ns": "admin", "defaultValue": "เมื่อวาน · {date}"}
// @tolgee-key {"key": "audit.category.sellers", "ns": "admin", "defaultValue": "ผู้ขาย"}
// @tolgee-key {"key": "audit.category.catalog", "ns": "admin", "defaultValue": "แคตตาล็อก"}
// @tolgee-key {"key": "audit.category.users", "ns": "admin", "defaultValue": "ผู้ใช้"}
// @tolgee-key {"key": "audit.category.finance", "ns": "admin", "defaultValue": "การเงิน"}
// @tolgee-key {"key": "audit.category.settings", "ns": "admin", "defaultValue": "การตั้งค่า"}
// @tolgee-key {"key": "audit.category.system", "ns": "admin", "defaultValue": "ระบบอัตโนมัติ"}
// @tolgee-key {"key": "audit.range.today", "ns": "admin", "defaultValue": "วันนี้"}
// @tolgee-key {"key": "audit.range.7d", "ns": "admin", "defaultValue": "7 วันล่าสุด"}
// @tolgee-key {"key": "audit.entryTime", "ns": "admin", "defaultValue": "{date} · {time} น."}
// @tolgee-key {"key": "audit.range.30d", "ns": "admin", "defaultValue": "30 วันล่าสุด"}
// @tolgee-key {"key": "audit.range.all", "ns": "admin", "defaultValue": "ทั้งหมด"}
