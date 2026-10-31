import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useBlocker, useNavigate } from "react-router-dom";
import { Lock, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/toast";
import { hasErrorCode } from "@/lib/api";

import { useAdminGames } from "../catalog.queries";
import { HOME_STRIP_MAX, type ScopeNames, promotionErrorMessage } from "../promotions.format";
import {
  usePlatformPromotions,
  usePromotion,
  usePromotionCategories,
  useSavePromotion,
} from "../promotions.queries";
import {
  type PromotionFormErrors,
  getPromotionErrors,
  getPromotionLocks,
  toPromotionInput,
  toPromotionPayload,
} from "../promotions.schema";
import type { AdminPromotion, AdminPromotionInput } from "../promotions.types";
import { PromotionDialog } from "./PromotionDialog";
import { PromotionFormAside } from "./PromotionFormAside";
import { ChoiceCard, FormField, InputSuffix, NumberInput, ToggleRow } from "./PromotionFormControls";
import { PromotionSaveDialog } from "./PromotionSaveDialog";
import "./promotions.css";

/** ลำดับฟิลด์บนหน้า — กดบันทึกแล้วเลื่อนไปหา error แรกตามนี้ */
const FIELD_ORDER: Array<keyof AdminPromotionInput> = [
  "code",
  "name",
  "visibility",
  "description",
  "discountType",
  "discountValue",
  "maxDiscount",
  "minSpend",
  "scopeType",
  "scopeIds",
  "newBuyerOnly",
  "startsAt",
  "endsAt",
  "usageLimitTotal",
  "usageLimitPerUser",
  "claimable",
  "featuredOnHome",
  "claimLimit",
  "homeSort",
  "claimRequired",
];

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** รหัส 8 ตัว ไม่มี 0/O 1/I ที่อ่านสลับกันง่าย */
function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => CODE_CHARS[byte % CODE_CHARS.length]).join("");
}

/** เริ่มพรุ่งนี้ 00:00 ยาว 30 วัน — ค่าเริ่มต้นตาม Figma PRM-A2 */
function emptyPromotion(): AdminPromotionInput {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 29);
  end.setHours(23, 59, 0, 0);
  return {
    code: "",
    name: "",
    description: null,
    discountType: "PERCENT",
    discountValue: 10,
    maxDiscount: 200,
    minSpend: 500,
    scopeType: "ALL",
    scopeIds: [],
    visibility: "PUBLIC",
    newBuyerOnly: false,
    usageLimitTotal: 500,
    usageLimitPerUser: 1,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    claimable: true,
    claimRequired: false,
    claimLimit: 800,
    featuredOnHome: true,
    // ใส่ใบถัดไปของแถบหน้าแรกเมื่อรู้จำนวนใบตอนนี้ (ดู effect ใน PromotionEditor)
    homeSort: null,
  };
}

/** ISO → ค่าใน `<input type="datetime-local">` ตามเวลาเครื่อง */
function toLocalInput(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** หน้า /admin/promotions/new และ /:id/edit (Figma PRM-A2) */
export function AdminPromotionFormContent({ id }: { id: number }) {
  const existing = usePromotion(id);
  if (id > 0 && existing.isPending) return <p className="p-8 text-sm text-muted-foreground">กำลังโหลดโค้ด...</p>;
  if (id > 0 && existing.isError) {
    return (
      <p role="alert" className="p-8 text-sm text-destructive">
        {promotionErrorMessage(existing.error, "โหลดโค้ดไม่สำเร็จ")}{" "}
        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void existing.refetch()}>
          ลองอีกครั้ง
        </Button>
      </p>
    );
  }
  if (existing.data?.ownerType === "SELLER") {
    return (
      <div role="alert" className="grid gap-3 p-8 text-sm">
        <p>โค้ดร้านค้าแก้ไขโดยแอดมินไม่ได้</p>
        <Link className="text-primary underline" to="/admin/promotions">
          กลับไปรายการโปรโมชั่น
        </Link>
      </div>
    );
  }
  return <PromotionEditor key={id || "new"} existing={existing.data} />;
}

function PromotionEditor({ existing }: { existing?: AdminPromotion }) {
  const navigate = useNavigate();
  const save = useSavePromotion();
  const games = useAdminGames();
  const platform = usePlatformPromotions();
  const [form, setForm] = useState<AdminPromotionInput>(() => (existing ? toPromotionInput(existing) : emptyPromotion()));
  const categories = usePromotionCategories(form.scopeType === "CATEGORY");
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errors, setErrors] = useState<PromotionFormErrors>({});
  const blocker = useBlocker(dirty && !saved);
  const locks = getPromotionLocks(existing);
  const locked = locks.isLocked;
  const featuredCount = platform.data?.filter((promotion) => promotion.featuredOnHome && promotion.status !== "EXPIRED").length;

  const scopeNames = useMemo<ScopeNames>(
    () => ({
      games: new Map((games.data ?? []).map((game) => [game.id, game.name])),
      categories: new Map((categories.data ?? []).map((category) => [category.id, category.name])),
    }),
    [games.data, categories.data],
  );

  // ปิดแท็บ/รีโหลดตอนมีข้อมูลค้าง — route blocker จับได้แค่การเปลี่ยนหน้าในแอป
  useEffect(() => {
    if (!dirty || saved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saved]);

  const change = <K extends keyof AdminPromotionInput>(key: K, value: AdminPromotionInput[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "visibility" && value === "PRIVATE") {
        Object.assign(next, { claimable: false, claimRequired: false, featuredOnHome: false, homeSort: null });
      }
      if (key === "claimable" && !value) Object.assign(next, { claimRequired: false, featuredOnHome: false, homeSort: null });
      if (key === "featuredOnHome" && !value) next.homeSort = null;
      if (key === "scopeType") next.scopeIds = [];
      return next;
    });
    setDirty(true);
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  // โค้ดใหม่ที่ยังไม่ได้เลือกลำดับ ต่อท้ายแถบหน้าแรกตามจำนวนใบตอนนี้
  const nextHomeSort =
    !existing && form.featuredOnHome && featuredCount != null && featuredCount < HOME_STRIP_MAX ? featuredCount : null;
  const formValues = form.homeSort == null && nextHomeSort != null ? { ...form, homeSort: nextHomeSort } : form;
  const payload = toPromotionPayload(formValues);

  const requestSave = () => {
    const next = getPromotionErrors(formValues, { existing, featuredCount });
    setErrors(next);
    const first = FIELD_ORDER.find((key) => next[key]);
    if (!first) {
      setConfirming(true);
      return;
    }
    const target = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
    target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    target?.querySelector<HTMLElement>("input:not([disabled]), button:not([disabled])")?.focus({ preventScroll: true });
  };

  const submit = () =>
    save.mutate(
      { id: existing?.id, input: payload },
      {
        onSuccess: () => {
          // ปลด blocker ก่อน navigate ไม่งั้นถาม "ออกจากหน้านี้?" ซ้ำ
          flushSync(() => setSaved(true));
          toast.add({
            title: existing ? "บันทึกการเปลี่ยนแปลงแล้ว" : `เปิดใช้ ${payload.code} แล้ว`,
            type: "success",
          });
          navigate("/admin/promotions");
        },
        onError: (error) => {
          setConfirming(false);
          if (hasErrorCode(error, "PROMO_CODE_TAKEN")) {
            setErrors((current) => ({ ...current, code: promotionErrorMessage(error, "") }));
            document.querySelector('[data-field="code"]')?.scrollIntoView?.({ behavior: "smooth", block: "center" });
            return;
          }
          toast.add({
            title: existing ? "บันทึกไม่สำเร็จ" : "สร้างโค้ดไม่สำเร็จ",
            description: promotionErrorMessage(error, "กรุณาลองอีกครั้ง"),
            type: "error",
          });
        },
      },
    );

  const scopeOptions = form.scopeType === "GAME" ? games : categories;
  const usedLimitFloor = Math.max(existing?.usedCount ?? 0, existing?.usageLimitTotal ?? 0);

  return (
    <main className="promotion-admin promotion-form-page">
      <nav aria-label="breadcrumb" className="promotion-breadcrumb">
        <Link to="/admin/promotions">โปรโมชั่น &amp; โค้ดส่วนลด</Link>
        <span aria-hidden>/</span>
        <span>{existing ? `แก้ไข ${existing.code}` : "สร้างโค้ด Pegasus"}</span>
      </nav>
      <header className="promotion-form-header">
        <div>
          <h1>{existing ? "แก้ไขโค้ด Pegasus" : "สร้างโค้ด Pegasus"}</h1>
          <p>Pegasus เป็นผู้ออกเงินส่วนลด — ร้านค้ายังได้รับเงินเต็มจำนวน</p>
        </div>
        <div className="promotion-header-actions">
          <Button variant="outline" onClick={() => navigate("/admin/promotions")}>
            ยกเลิก
          </Button>
          <Button onClick={requestSave}>{existing ? "บันทึก" : "บันทึกและเปิดใช้"}</Button>
        </div>
      </header>

      {locks.used ? (
        <p className="promotion-edit-notice">
          โค้ดนี้มีคนใช้แล้ว {existing?.usedCount.toLocaleString("th-TH")} ครั้ง — ฟิลด์ที่มี{" "}
          <Lock className="inline size-3" aria-label="แม่กุญแจ" /> แก้ไม่ได้
        </p>
      ) : locks.claimed ? (
        <p className="promotion-edit-notice">
          มีผู้เก็บโค้ดนี้แล้ว {existing?.claimedCount.toLocaleString("th-TH")} คน — “ต้องเก็บก่อนใช้”
          ล็อก และจำนวนที่แจกเพิ่มได้อย่างเดียว
        </p>
      ) : null}

      <div className="promotion-form-grid">
        <div className="promotion-form-sections">
          <Card className="promotion-section">
            <h2>1. ข้อมูลโค้ด</h2>
            <div className="promotion-two-cols">
              <FormField
                field="code"
                htmlFor="promotion-code"
                label="รหัสโค้ด"
                required
                hint="A–Z และ 0–9 ยาว 4–20 ตัว · ระบบเก็บเป็นตัวพิมพ์ใหญ่ และห้ามซ้ำกับโค้ดร้าน"
                error={errors.code}
              >
                <div className="promotion-code-input">
                  <Input
                    id="promotion-code"
                    aria-label="รหัสโค้ด"
                    aria-invalid={!!errors.code || undefined}
                    value={form.code}
                    maxLength={20}
                    autoComplete="off"
                    disabled={locked("code")}
                    placeholder="PEGASUS10"
                    onChange={(event) => change("code", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  />
                  {locked("code") ? (
                    <InputSuffix locked />
                  ) : (
                    <Button type="button" variant="ghost" size="sm" onClick={() => change("code", randomCode())}>
                      สุ่มโค้ด
                    </Button>
                  )}
                </div>
              </FormField>
              <FormField
                field="name"
                htmlFor="promotion-name"
                label="ชื่อแคมเปญ (แสดงให้ผู้ซื้อเห็น)"
                required
                hint="สูงสุด 60 ตัวอักษร"
                error={errors.name}
              >
                <Input
                  id="promotion-name"
                  aria-label="ชื่อแคมเปญ"
                  aria-invalid={!!errors.name || undefined}
                  value={form.name}
                  maxLength={60}
                  placeholder="ลด 10% ต้อนรับปลายปี"
                  onChange={(event) => change("name", event.target.value)}
                />
              </FormField>
            </div>
            <FormField field="visibility" label="การมองเห็น">
              <RadioGroup
                aria-label="การมองเห็น"
                value={form.visibility}
                onValueChange={(value) => change("visibility", value as AdminPromotionInput["visibility"])}
                className="promotion-choice-grid promotion-choice-grid-two"
              >
                <ChoiceCard
                  value="PUBLIC"
                  title="สาธารณะ"
                  hint="แสดงในตัวเลือกโค้ดตอนชำระเงิน"
                  selected={form.visibility === "PUBLIC"}
                  disabled={locked("visibility")}
                />
                <ChoiceCard
                  value="PRIVATE"
                  title="ส่วนตัว"
                  hint="ผู้ซื้อต้องพิมพ์โค้ดเอง (แจกผ่านโซเชียล)"
                  selected={form.visibility === "PRIVATE"}
                  disabled={locked("visibility")}
                />
              </RadioGroup>
            </FormField>
            <details className="promotion-extra" data-field="description" open={!!form.description || undefined}>
              <summary>คำอธิบายเพิ่มเติม (ไม่บังคับ)</summary>
              <Input
                aria-label="คำอธิบาย"
                value={form.description ?? ""}
                maxLength={500}
                placeholder="คำอธิบายภายในแคมเปญ"
                onChange={(event) => change("description", event.target.value)}
              />
            </details>
          </Card>

          <Card className="promotion-section">
            <h2>2. ประเภทส่วนลด</h2>
            <RadioGroup
              aria-label="ประเภทส่วนลด"
              data-field="discountType"
              value={form.discountType}
              onValueChange={(value) => change("discountType", value as AdminPromotionInput["discountType"])}
              className="promotion-choice-grid promotion-choice-grid-three"
            >
              <ChoiceCard
                value="PERCENT"
                title="เปอร์เซ็นต์"
                hint="ลด x% ของยอดสินค้า"
                selected={form.discountType === "PERCENT"}
                disabled={locked("discountType")}
              />
              <ChoiceCard
                value="FIXED"
                title="จำนวนเงิน"
                hint="ลดเป็นบาท"
                selected={form.discountType === "FIXED"}
                disabled={locked("discountType")}
              />
              <ChoiceCard
                value="FREE_SHIPPING"
                title="ส่งฟรี"
                hint="ลดค่าส่งทุกร้าน"
                selected={form.discountType === "FREE_SHIPPING"}
                disabled={locked("discountType")}
              />
            </RadioGroup>
            <div className="promotion-two-cols">
              {form.discountType !== "FREE_SHIPPING" ? (
                <FormField
                  field="discountValue"
                  htmlFor="promotion-discountValue"
                  label="มูลค่าส่วนลด"
                  required
                  hint={form.discountType === "PERCENT" ? "1–90%" : "ต้องมากกว่า ฿0"}
                  error={errors.discountValue}
                >
                  <NumberInput
                    id="promotion-discountValue"
                    label="มูลค่าส่วนลด"
                    value={form.discountValue}
                    onChange={(value) => change("discountValue", value as number)}
                    suffix={form.discountType === "PERCENT" ? "%" : "บาท"}
                    min={form.discountType === "PERCENT" ? 1 : 0}
                    max={form.discountType === "PERCENT" ? 90 : undefined}
                    locked={locked("discountValue")}
                    invalid={!!errors.discountValue}
                  />
                </FormField>
              ) : null}
              {form.discountType !== "FIXED" ? (
                <FormField
                  field="maxDiscount"
                  htmlFor="promotion-maxDiscount"
                  label={form.discountType === "FREE_SHIPPING" ? "ลดค่าส่งสูงสุดต่อร้าน" : "ส่วนลดสูงสุด"}
                  hint={
                    form.discountType === "FREE_SHIPPING"
                      ? "เว้นว่าง = ส่งฟรีเต็มจำนวน (งบประเมินจาก ฿60 / ร้าน)"
                      : "เว้นว่าง = ไม่จำกัด (แนะนำให้ใส่)"
                  }
                  error={errors.maxDiscount}
                >
                  <NumberInput
                    id="promotion-maxDiscount"
                    label="ส่วนลดสูงสุด"
                    value={form.maxDiscount}
                    onChange={(value) => change("maxDiscount", value)}
                    prefix="฿"
                    locked={locked("maxDiscount")}
                    invalid={!!errors.maxDiscount}
                  />
                </FormField>
              ) : null}
            </div>
          </Card>

          <Card className="promotion-section">
            <h2>3. เงื่อนไข</h2>
            <p className="promotion-section-hint">ยอดขั้นต่ำคิดจากสินค้าที่เข้าเงื่อนไขหลังหักโค้ดร้าน ไม่รวมค่าส่ง</p>
            <div className="promotion-two-cols">
              <FormField field="minSpend" htmlFor="promotion-minSpend" label="ยอดสั่งซื้อขั้นต่ำ" error={errors.minSpend}>
                <NumberInput
                  id="promotion-minSpend"
                  label="ยอดสั่งซื้อขั้นต่ำ"
                  value={form.minSpend}
                  onChange={(value) => change("minSpend", value as number)}
                  prefix="฿"
                  locked={locked("minSpend")}
                  invalid={!!errors.minSpend}
                />
              </FormField>
              <FormField field="scopeType" label="ใช้กับสินค้า">
                <div className="promotion-scope-options" role="group" aria-label="ใช้กับสินค้า">
                  {(["ALL", "GAME", "CATEGORY"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={form.scopeType === value}
                      disabled={locked("scopeType")}
                      onClick={() => change("scopeType", value)}
                    >
                      {value === "ALL" ? "ทุกเกม" : value === "GAME" ? "เลือกเกม" : "เลือกหมวดหมู่"}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
            {form.scopeType !== "ALL" ? (
              <fieldset className="promotion-scope-list" data-field="scopeIds" disabled={locked("scopeIds")}>
                <legend>{form.scopeType === "GAME" ? "เลือกเกม" : "เลือกหมวดหมู่"} (เลือกได้หลายรายการ)</legend>
                {scopeOptions.data?.map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={form.scopeIds.includes(item.id)}
                      onChange={(event) =>
                        change(
                          "scopeIds",
                          event.target.checked
                            ? [...form.scopeIds, item.id]
                            : form.scopeIds.filter((scopeId) => scopeId !== item.id),
                        )
                      }
                    />
                    {item.name}
                  </label>
                ))}
                {scopeOptions.isPending ? <span>กำลังโหลดรายการ...</span> : null}
                {scopeOptions.isError ? <span role="alert">โหลดรายการไม่สำเร็จ</span> : null}
                {errors.scopeIds ? (
                  <span role="alert" className="promotion-field-error">
                    {errors.scopeIds}
                  </span>
                ) : null}
              </fieldset>
            ) : null}
            <div data-field="newBuyerOnly">
              <ToggleRow
                id="promotion-new-buyer"
                title="เฉพาะผู้ซื้อใหม่"
                hint="ใช้ได้เฉพาะบัญชีที่ยังไม่เคยมีคำสั่งซื้อที่ชำระเงินแล้ว"
                checked={form.newBuyerOnly}
                disabled={locked("newBuyerOnly")}
                onChange={(checked) => change("newBuyerOnly", checked)}
              />
            </div>
          </Card>

          <Card className="promotion-section">
            <h2>4. ระยะเวลาและจำนวนสิทธิ์</h2>
            <div className="promotion-two-cols">
              <FormField field="startsAt" htmlFor="promotion-startsAt" label="เริ่มใช้ได้" required error={errors.startsAt}>
                <div className="promotion-input-wrap">
                  <Input
                    id="promotion-startsAt"
                    aria-label="เริ่มใช้ได้"
                    type="datetime-local"
                    value={toLocalInput(form.startsAt)}
                    disabled={locked("startsAt")}
                    onChange={(event) =>
                      change("startsAt", event.target.value ? new Date(event.target.value).toISOString() : "")
                    }
                  />
                  {locked("startsAt") ? <InputSuffix locked /> : null}
                </div>
              </FormField>
              <FormField
                field="endsAt"
                htmlFor="promotion-endsAt"
                label={locks.used ? "สิ้นสุด (ยืดได้เท่านั้น)" : "สิ้นสุด"}
                required
                hint="ต้องหลังวันเริ่มใช้"
                error={errors.endsAt}
              >
                <Input
                  id="promotion-endsAt"
                  aria-label="สิ้นสุด"
                  type="datetime-local"
                  value={toLocalInput(form.endsAt)}
                  min={locks.used && existing ? toLocalInput(existing.endsAt) : undefined}
                  onChange={(event) =>
                    change("endsAt", event.target.value ? new Date(event.target.value).toISOString() : "")
                  }
                />
              </FormField>
            </div>
            <div className="promotion-two-cols">
              <FormField
                field="usageLimitTotal"
                htmlFor="promotion-usageLimitTotal"
                label={
                  locks.used
                    ? `จำนวนสิทธิ์ทั้งหมด (เพิ่มได้เท่านั้น ≥ ${usedLimitFloor.toLocaleString("th-TH")})`
                    : "จำนวนสิทธิ์ทั้งหมด"
                }
                hint="เว้นว่าง = ไม่จำกัด"
                error={errors.usageLimitTotal}
              >
                <NumberInput
                  id="promotion-usageLimitTotal"
                  label="จำนวนสิทธิ์ทั้งหมด"
                  value={form.usageLimitTotal}
                  onChange={(value) => change("usageLimitTotal", value)}
                  suffix="สิทธิ์"
                  min={locks.used ? usedLimitFloor : 1}
                  invalid={!!errors.usageLimitTotal}
                />
              </FormField>
              <FormField
                field="usageLimitPerUser"
                htmlFor="promotion-usageLimitPerUser"
                label="สิทธิ์ต่อผู้ซื้อ 1 คน"
                required
                error={errors.usageLimitPerUser}
              >
                <NumberInput
                  id="promotion-usageLimitPerUser"
                  label="สิทธิ์ต่อผู้ซื้อ 1 คน"
                  value={form.usageLimitPerUser}
                  onChange={(value) => change("usageLimitPerUser", value as number)}
                  suffix="ครั้ง"
                  min={1}
                  locked={locked("usageLimitPerUser")}
                  invalid={!!errors.usageLimitPerUser}
                />
              </FormField>
            </div>
          </Card>

          <Card className="promotion-section">
            <h2>
              5. การแจกโค้ด (กดเก็บ) <span className="promotion-new-badge">ใหม่</span>
            </h2>
            <div data-field="claimable">
              <ToggleRow
                id="promotion-claimable"
                title="ให้ผู้ซื้อกดเก็บได้"
                hint="โค้ดจะมีปุ่ม “เก็บ” และอยู่ในกระเป๋า “โค้ดของฉัน” (ต้องเป็นโค้ดสาธารณะ)"
                checked={form.claimable}
                disabled={form.visibility !== "PUBLIC"}
                onChange={(checked) => change("claimable", checked)}
              />
            </div>
            <div data-field="featuredOnHome" className="grid gap-1.5">
              <ToggleRow
                id="promotion-featured"
                title="แสดงบนหน้าแรก"
                hint={`อยู่ในแถบ “โค้ดส่วนลดจาก Pegasus” ใต้ Hero · สูงสุด ${HOME_STRIP_MAX} ใบ`}
                checked={form.featuredOnHome}
                disabled={!form.claimable || form.visibility !== "PUBLIC"}
                onChange={(checked) => change("featuredOnHome", checked)}
              />
              {errors.featuredOnHome ? (
                <span role="alert" className="promotion-field-error">
                  {errors.featuredOnHome}
                </span>
              ) : null}
            </div>
            <div className="promotion-two-cols">
              <FormField
                field="claimLimit"
                htmlFor="promotion-claimLimit"
                label={locks.claimed ? "จำนวนที่แจก (เพิ่มได้เท่านั้น)" : "จำนวนที่แจก (เก็บได้)"}
                hint="เว้นว่าง = ไม่จำกัด · แยกจากจำนวนสิทธิ์ใช้"
                error={errors.claimLimit}
              >
                <NumberInput
                  id="promotion-claimLimit"
                  label="จำนวนที่แจก"
                  value={form.claimLimit}
                  onChange={(value) => change("claimLimit", value)}
                  suffix="ใบ"
                  min={1}
                  disabled={!form.claimable}
                  invalid={!!errors.claimLimit}
                />
              </FormField>
              <FormField
                field="homeSort"
                htmlFor="promotion-homeSort"
                label="ลำดับบนหน้าแรก"
                hint="เลขน้อยแสดงก่อน"
                error={errors.homeSort}
              >
                <Input
                  id="promotion-homeSort"
                  aria-label="ลำดับบนหน้าแรก"
                  type="number"
                  min={1}
                  max={HOME_STRIP_MAX}
                  value={formValues.homeSort == null ? "" : formValues.homeSort + 1}
                  disabled={!form.featuredOnHome}
                  onChange={(event) =>
                    change("homeSort", event.target.value === "" ? null : Number(event.target.value) - 1)
                  }
                />
              </FormField>
            </div>
            <div data-field="claimRequired" className="grid gap-1.5">
              <ToggleRow
                id="promotion-claim-required"
                title="ต้องเก็บก่อนใช้"
                hint="เปิด = พิมพ์โค้ดเองใช้ไม่ได้ถ้ายังไม่ได้เก็บ (PROMO_NOT_CLAIMED) เหมาะกับแคมเปญแจกจำนวนจำกัด"
                checked={form.claimRequired}
                disabled={locked("claimRequired") || !form.claimable}
                onChange={(checked) => change("claimRequired", checked)}
              />
              {errors.claimRequired ? (
                <span role="alert" className="promotion-field-error">
                  {errors.claimRequired}
                </span>
              ) : null}
            </div>
          </Card>
        </div>
        <PromotionFormAside form={payload} />
      </div>

      <PromotionSaveDialog
        open={confirming}
        onOpenChange={setConfirming}
        existing={existing}
        input={payload}
        scopeNames={scopeNames}
        pending={save.isPending}
        onConfirm={submit}
      />
      <PromotionDialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => !open && blocker.reset?.()}
        tone="warning"
        icon={<LogOut />}
        title="ออกจากหน้านี้?"
        description="การเปลี่ยนแปลงในฟอร์มยังไม่ได้บันทึก ถ้าออกตอนนี้ข้อมูลจะหายทั้งหมด"
        actions={
          <>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              อยู่ต่อ
            </Button>
            <Button className="promotion-danger-button" onClick={() => blocker.proceed?.()}>
              ออกโดยไม่บันทึก
            </Button>
          </>
        }
      />
    </main>
  );
}
