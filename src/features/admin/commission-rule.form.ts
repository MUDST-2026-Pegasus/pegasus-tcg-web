import type { CommissionRule, CommissionRuleInput } from "@/features/finance/after-sales.types";
import { translate } from "@/lib/i18n";

/**
 * ฟอร์ม "กฎค่าคอมมิชชั่น" ใน popup — กติกาลอกจาก `CommissionRuleService.validate`
 * และการเลือกกฎจาก `LedgerService` ของ pegasus-tcg-api ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 *
 * การเลือกกฎตอนคิดเงิน: ผู้ขาย > หมวดหมู่ > เกม > ทั้งแพลตฟอร์ม
 * ขอบเขตเดียวกันให้ลำดับความสำคัญมากกว่าชนะ ถ้าเท่ากันกฎที่สร้างทีหลังชนะ
 */

export type RuleScope = CommissionRule["scope"];

export const SCOPE_OPTIONS: Array<{ value: RuleScope; label: string; hint: string }> = [
  {
    value: "GLOBAL",
    get label() {
      return translate("admin", "commission.scope.global", "ทั้งแพลตฟอร์ม");
    },
    get hint() {
      return translate("admin", "commission.scope.globalHint", "ใช้กับทุกคำสั่งซื้อที่ไม่ตรงกับกฎเฉพาะใด ๆ");
    },
  },
  {
    value: "GAME",
    get label() {
      return translate("admin", "commission.scope.game", "เกม");
    },
    get hint() {
      return translate("admin", "commission.scope.gameHint", "ใช้เมื่อสินค้าทุกชิ้นในคำสั่งซื้ออยู่ในเกมที่เลือก");
    },
  },
  {
    value: "CATEGORY",
    get label() {
      return translate("admin", "commission.scope.category", "หมวดหมู่");
    },
    get hint() {
      return translate("admin", "commission.scope.categoryHint", "ใช้เมื่อสินค้าทุกชิ้นในคำสั่งซื้ออยู่ในหมวดที่เลือก ชนะกฎระดับเกม");
    },
  },
  {
    value: "SELLER",
    get label() {
      return translate("admin", "commission.scope.seller", "ผู้ขาย");
    },
    get hint() {
      return translate("admin", "commission.scope.sellerHint", "ใช้กับทุกคำสั่งซื้อของผู้ขายรายนี้ ชนะกฎทุกระดับ");
    },
  },
];

export const scopeLabel = (scope: RuleScope) =>
  SCOPE_OPTIONS.find((option) => option.value === scope)?.label ?? scope;

/** ทุกช่องตัวเลขเก็บเป็น string ให้ลบจนว่างได้ระหว่างพิมพ์ */
export type RuleDraft = {
  scope: RuleScope;
  gameId: number | null;
  categoryId: number | null;
  sellerProfileId: string;
  ratePercent: string;
  fixedFee: string;
  minFee: string;
  maxFee: string;
  priority: string;
  /** ค่าของ `<input type="datetime-local">` ตามเวลาเครื่อง */
  effectiveFrom: string;
  effectiveTo: string;
  active: boolean;
};

export type RuleField = keyof RuleDraft | "target";
export type RuleErrors = Partial<Record<RuleField, string>>;

const RATE = /^\d{1,3}(?:\.\d{1,3})?$/;
const MONEY = /^\d{1,12}(?:\.\d{1,2})?$/;
const INTEGER = /^-?\d+$/;

export function toLocalInput(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const fromLocalInput = (value: string) => new Date(value).toISOString();

export function blankDraft(scope: RuleScope = "CATEGORY"): RuleDraft {
  return {
    scope, gameId: null, categoryId: null, sellerProfileId: "",
    ratePercent: "", fixedFee: "", minFee: "", maxFee: "", priority: "",
    effectiveFrom: toLocalInput(new Date().toISOString()), effectiveTo: "", active: true,
  };
}

export function draftFromRule(rule: CommissionRule): RuleDraft {
  return {
    scope: rule.scope, gameId: rule.gameId, categoryId: rule.categoryId,
    sellerProfileId: rule.sellerProfileId == null ? "" : String(rule.sellerProfileId),
    ratePercent: String(rule.ratePercent), fixedFee: String(rule.fixedFee),
    minFee: rule.minFee == null ? "" : String(rule.minFee),
    maxFee: rule.maxFee == null ? "" : String(rule.maxFee),
    priority: String(rule.priority),
    effectiveFrom: toLocalInput(rule.effectiveFrom),
    effectiveTo: rule.effectiveTo ? toLocalInput(rule.effectiveTo) : "",
    active: rule.active,
  };
}

export function validateDraft(draft: RuleDraft): RuleErrors {
  const errors: RuleErrors = {};
  const rate = draft.ratePercent.trim();
  if (rate === "") errors.ratePercent = translate("admin", "commission.validation.rateRequired", "กรอกอัตราค่าคอมมิชชั่น");
  else if (!RATE.test(rate) || Number(rate) > 100) errors.ratePercent = translate("admin", "commission.validation.rateRange", "อัตราต้องอยู่ระหว่าง 0–100% ทศนิยมไม่เกิน 3 ตำแหน่ง");

  const money = { fixedFee: draft.fixedFee, minFee: draft.minFee, maxFee: draft.maxFee } as const;
  for (const [key, value] of Object.entries(money) as Array<[keyof typeof money, string]>) {
    if (value.trim() !== "" && !MONEY.test(value.trim())) errors[key] = translate("admin", "commission.validation.money", "จำนวนเงินต้องไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง");
  }
  if (!errors.minFee && !errors.maxFee && draft.minFee.trim() !== "" && draft.maxFee.trim() !== ""
    && Number(draft.minFee) > Number(draft.maxFee)) {
    errors.maxFee = translate("admin", "commission.validation.maxBelowMin", "ขั้นสูงต้องไม่น้อยกว่าขั้นต่ำ");
  }

  const priority = draft.priority.trim();
  if (priority !== "" && (!INTEGER.test(priority) || Number(priority) < -32768 || Number(priority) > 32767)) {
    errors.priority = translate("admin", "commission.validation.priority", "ลำดับต้องเป็นจำนวนเต็มระหว่าง -32768 ถึง 32767");
  }

  if (draft.scope === "GAME" && draft.gameId == null) errors.target = translate("admin", "commission.validation.gameRequired", "กรุณาเลือกเกม");
  if (draft.scope === "CATEGORY" && draft.categoryId == null) errors.target = translate("admin", "commission.validation.categoryRequired", "กรุณาเลือกหมวดหมู่");
  if (draft.scope === "SELLER" && !/^[1-9]\d*$/.test(draft.sellerProfileId.trim())) {
    errors.target = translate("admin", "commission.validation.sellerRequired", "กรอกรหัสร้านค้า (seller profile ID) เป็นตัวเลข");
  }

  if (draft.effectiveFrom === "" || Number.isNaN(new Date(draft.effectiveFrom).getTime())) {
    errors.effectiveFrom = translate("admin", "commission.validation.fromRequired", "เลือกวันเวลาที่เริ่มมีผล");
  } else if (draft.effectiveTo !== "" && new Date(draft.effectiveTo) <= new Date(draft.effectiveFrom)) {
    errors.effectiveTo = translate("admin", "commission.validation.toAfterFrom", "วันสิ้นสุดต้องอยู่หลังวันเริ่มมีผล");
  }
  return errors;
}

/** เรียกหลัง `validateDraft` ผ่านแล้วเท่านั้น — ช่องเป้าหมายที่ไม่ใช่ของขอบเขตนี้ส่งเป็น null ตามที่ backend บังคับ */
export function draftToInput(draft: RuleDraft): CommissionRuleInput {
  const optional = (value: string) => (value.trim() === "" ? null : Number(value));
  return {
    scope: draft.scope,
    gameId: draft.scope === "GAME" ? draft.gameId : null,
    categoryId: draft.scope === "CATEGORY" ? draft.categoryId : null,
    sellerProfileId: draft.scope === "SELLER" ? Number(draft.sellerProfileId) : null,
    ratePercent: Number(draft.ratePercent),
    fixedFee: Number(draft.fixedFee || 0),
    minFee: optional(draft.minFee),
    maxFee: optional(draft.maxFee),
    priority: Number(draft.priority || 0),
    effectiveFrom: fromLocalInput(draft.effectiveFrom),
    effectiveTo: draft.effectiveTo === "" ? null : fromLocalInput(draft.effectiveTo),
    active: draft.active,
  };
}

export type FeeBreakdown = {
  percentPart: number;
  fixedFee: number;
  /** ค่าธรรมเนียมหลังปรับขั้นต่ำ/ขั้นสูงและไม่เกินราคาขาย */
  fee: number;
  clamped: "min" | "max" | "price" | null;
  sellerNet: number;
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** เหมือน `CommissionCalculator.fee` — ปัดส่วนเปอร์เซ็นต์เป็นสตางค์ก่อนบวกค่าคงที่ */
export function feeBreakdown(price: number, rule: {
  ratePercent: number; fixedFee: number; minFee: number | null; maxFee: number | null;
}): FeeBreakdown {
  const percentPart = round2(price * rule.ratePercent / 100);
  const raw = round2(percentPart + rule.fixedFee);
  let fee = raw;
  let clamped: FeeBreakdown["clamped"] = null;
  if (rule.minFee != null && fee < rule.minFee) { fee = rule.minFee; clamped = "min"; }
  if (rule.maxFee != null && fee > rule.maxFee) { fee = rule.maxFee; clamped = "max"; }
  if (fee > price) { fee = price; clamped = "price"; }
  fee = Math.max(0, fee);
  return { percentPart, fixedFee: rule.fixedFee, fee, clamped, sellerNet: round2(price - fee) };
}

export type RuleStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE";

export function ruleStatus(rule: Pick<CommissionRule, "active" | "effectiveFrom" | "effectiveTo">, now = new Date()): RuleStatus {
  if (!rule.active) return "INACTIVE";
  if (new Date(rule.effectiveFrom) > now) return "SCHEDULED";
  if (rule.effectiveTo && new Date(rule.effectiveTo) <= now) return "EXPIRED";
  return "ACTIVE";
}

export const STATUS_LABEL: Record<RuleStatus, string> = {
  get ACTIVE() {
    return translate("admin", "commission.status.active", "ใช้งานอยู่");
  },
  get SCHEDULED() {
    return translate("admin", "commission.status.scheduled", "ตั้งเวลาไว้");
  },
  get EXPIRED() {
    return translate("admin", "commission.status.expired", "หมดอายุ");
  },
  get INACTIVE() {
    return translate("admin", "commission.status.inactive", "ปิดใช้งาน");
  },
};

const sameTarget = (a: CommissionRuleInput, b: CommissionRuleInput) =>
  a.scope === b.scope && a.gameId === b.gameId && a.categoryId === b.categoryId
  && a.sellerProfileId === b.sellerProfileId;

const overlaps = (a: CommissionRuleInput, b: CommissionRuleInput) => {
  const aEnd = a.effectiveTo ? new Date(a.effectiveTo).getTime() : Infinity;
  const bEnd = b.effectiveTo ? new Date(b.effectiveTo).getTime() : Infinity;
  return new Date(a.effectiveFrom).getTime() < bEnd && new Date(b.effectiveFrom).getTime() < aEnd;
};

/** กฎอื่นที่เปิดอยู่ เป้าหมายเดียวกัน และช่วงเวลาทับกัน — ตอนคิดเงินจะเหลือผู้ชนะแค่กฎเดียว */
export function conflictingRules(input: CommissionRuleInput, rules: CommissionRule[], editingId: number | null) {
  if (!input.active) return [];
  return rules.filter((rule) => rule.id !== editingId && rule.active
    && sameTarget(rule, input) && overlaps(rule, input));
}

// @tolgee-key {"key": "commission.scope.global", "ns": "admin", "defaultValue": "ทั้งแพลตฟอร์ม"}
// @tolgee-key {"key": "commission.scope.globalHint", "ns": "admin", "defaultValue": "ใช้กับทุกคำสั่งซื้อที่ไม่ตรงกับกฎเฉพาะใด ๆ"}
// @tolgee-key {"key": "commission.scope.game", "ns": "admin", "defaultValue": "เกม"}
// @tolgee-key {"key": "commission.scope.gameHint", "ns": "admin", "defaultValue": "ใช้เมื่อสินค้าทุกชิ้นในคำสั่งซื้ออยู่ในเกมที่เลือก"}
// @tolgee-key {"key": "commission.scope.category", "ns": "admin", "defaultValue": "หมวดหมู่"}
// @tolgee-key {"key": "commission.scope.categoryHint", "ns": "admin", "defaultValue": "ใช้เมื่อสินค้าทุกชิ้นในคำสั่งซื้ออยู่ในหมวดที่เลือก ชนะกฎระดับเกม"}
// @tolgee-key {"key": "commission.scope.seller", "ns": "admin", "defaultValue": "ผู้ขาย"}
// @tolgee-key {"key": "commission.scope.sellerHint", "ns": "admin", "defaultValue": "ใช้กับทุกคำสั่งซื้อของผู้ขายรายนี้ ชนะกฎทุกระดับ"}
// @tolgee-key {"key": "commission.validation.rateRequired", "ns": "admin", "defaultValue": "กรอกอัตราค่าคอมมิชชั่น"}
// @tolgee-key {"key": "commission.validation.rateRange", "ns": "admin", "defaultValue": "อัตราต้องอยู่ระหว่าง 0–100% ทศนิยมไม่เกิน 3 ตำแหน่ง"}
// @tolgee-key {"key": "commission.validation.money", "ns": "admin", "defaultValue": "จำนวนเงินต้องไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง"}
// @tolgee-key {"key": "commission.validation.maxBelowMin", "ns": "admin", "defaultValue": "ขั้นสูงต้องไม่น้อยกว่าขั้นต่ำ"}
// @tolgee-key {"key": "commission.validation.priority", "ns": "admin", "defaultValue": "ลำดับต้องเป็นจำนวนเต็มระหว่าง -32768 ถึง 32767"}
// @tolgee-key {"key": "commission.validation.gameRequired", "ns": "admin", "defaultValue": "กรุณาเลือกเกม"}
// @tolgee-key {"key": "commission.validation.categoryRequired", "ns": "admin", "defaultValue": "กรุณาเลือกหมวดหมู่"}
// @tolgee-key {"key": "commission.validation.sellerRequired", "ns": "admin", "defaultValue": "กรอกรหัสร้านค้า (seller profile ID) เป็นตัวเลข"}
// @tolgee-key {"key": "commission.validation.fromRequired", "ns": "admin", "defaultValue": "เลือกวันเวลาที่เริ่มมีผล"}
// @tolgee-key {"key": "commission.validation.toAfterFrom", "ns": "admin", "defaultValue": "วันสิ้นสุดต้องอยู่หลังวันเริ่มมีผล"}
// @tolgee-key {"key": "commission.status.active", "ns": "admin", "defaultValue": "ใช้งานอยู่"}
// @tolgee-key {"key": "commission.status.scheduled", "ns": "admin", "defaultValue": "ตั้งเวลาไว้"}
// @tolgee-key {"key": "commission.status.expired", "ns": "admin", "defaultValue": "หมดอายุ"}
// @tolgee-key {"key": "commission.status.inactive", "ns": "admin", "defaultValue": "ปิดใช้งาน"}
