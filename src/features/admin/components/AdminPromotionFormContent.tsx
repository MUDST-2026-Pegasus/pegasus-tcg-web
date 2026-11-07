import { translate, useLanguage } from "@/lib/language";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useBlocker, useNavigate } from "react-router-dom";
import { Info, Lock, LogOut } from "lucide-react";

import { DateTimePicker, EmptyState, ErrorState } from "@/components/common";
import { FormPageSkeleton } from "@/components/common/PageSkeletons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { RadioGroup } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { hasErrorCode } from "@/lib/api";
import { cn } from "@/lib/utils";

import { useAdminGames } from "../catalog.queries";
import { PROMOTION_DANGER_BUTTON, PROMOTION_PAGE_CONTROLS } from "../promotions.styles";
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
import {
  ChoiceCard,
  FormField,
  LockedSuffix,
  NumberInput,
  ToggleRow,
} from "./PromotionFormControls";
import { PromotionSaveDialog } from "./PromotionSaveDialog";

const SCOPE_OPTIONS: Array<{ value: AdminPromotionInput["scopeType"]; label: string }> = [
  { value: "ALL", get label() { return translate("ทุกเกม", "All games"); } },
  { value: "GAME", get label() { return translate("เลือกเกม", "Select game"); } },
  { value: "CATEGORY", get label() { return translate("เลือกหมวดหมู่", "Select category"); } },
];

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

/** ISO → ค่าแบบ `datetime-local` ตามเวลาเครื่อง (ค่าของ `DateTimePicker`) */
function toLocalInput(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return Number.isFinite(local.getTime()) ? local.toISOString().slice(0, 16) : "";
}

function fromLocalInput(value: string): string {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

/** หน้า /admin/promotions/new และ /:id/edit (Figma PRM-A2) */
export function AdminPromotionFormContent({ id }: { id: number }) {
  useLanguage();
  const existing = usePromotion(id);
  if (id > 0 && existing.isPending) return <FormPageSkeleton label="กำลังโหลดโค้ด" />;
  if (id > 0 && existing.isError) {
    return (
      <ErrorState
        title={translate("โหลดโค้ดไม่สำเร็จ", "Unable to load codes")}
        fallbackMessage={promotionErrorMessage(existing.error, translate("กรุณาลองอีกครั้ง", "Please try again"))}
        onRetry={() => void existing.refetch()}
      />
    );
  }
  if (existing.data?.ownerType === "SELLER") {
    return (
      <EmptyState icon={Lock} title="โค้ดร้านค้าแก้ไขโดยแอดมินไม่ได้">
        <Button variant="outline" nativeButton={false} render={<Link to="/admin/promotions" />}>
          กลับไปรายการโปรโมชั่น
        </Button>
      </EmptyState>
    );
  }
  return <PromotionEditor key={id || "new"} existing={existing.data} />;
}

function PromotionEditor({ existing }: { existing?: AdminPromotion }) {
  useLanguage();
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
            title: existing ? translate("บันทึกการเปลี่ยนแปลงแล้ว", "Changes saved") : `เปิดใช้ ${payload.code} แล้ว`,
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
            title: existing ? translate("บันทึกไม่สำเร็จ", "Unable to save") : "สร้างโค้ดไม่สำเร็จ",
            description: promotionErrorMessage(error, translate("กรุณาลองอีกครั้ง", "Please try again")),
            type: "error",
          });
        },
      },
    );

  const scopeOptions = form.scopeType === "GAME" ? games : categories;
  const usedLimitFloor = Math.max(existing?.usedCount ?? 0, existing?.usageLimitTotal ?? 0);

  return (
    <main className={cn("grid w-full min-w-0 gap-6", PROMOTION_PAGE_CONTROLS)}>
      <div className="grid gap-4">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/admin/promotions" />}>โปรโมชั่น &amp; โค้ดส่วนลด</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{existing ? `แก้ไข ${existing.code}` : translate("สร้างโค้ด Pegasus", "Create Pegasus code")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">{existing ? "แก้ไขโค้ด Pegasus" : translate("สร้างโค้ด Pegasus", "Create Pegasus code")}</h1>
            <p className="text-sm text-muted-foreground">Pegasus เป็นผู้ออกเงินส่วนลด — ร้านค้ายังได้รับเงินเต็มจำนวน</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="px-2.5" onClick={() => navigate("/admin/promotions")}>
              {translate("ยกเลิก", "Cancel")}</Button>
            <Button size="sm" className="px-2.5" onClick={requestSave}>
              {existing ? translate("บันทึก", "Save") : "บันทึกและเปิดใช้"}
            </Button>
          </div>
        </header>
      </div>

      {locks.used || locks.claimed ? (
        <Alert className="border-[#cfe0f7] bg-[#e8f1fc] text-[#0058bc]">
          <Info />
          <AlertDescription className="text-xs text-[#0058bc]">
            {locks.used ? (
              <>
                โค้ดนี้มีคนใช้แล้ว {existing?.usedCount.toLocaleString("th-TH")} ครั้ง — ฟิลด์ที่มี{" "}
                <Lock className="inline size-3" aria-label={translate("แม่กุญแจ", "Padlock")} /> แก้ไม่ได้
              </>
            ) : (
              <>
                มีผู้เก็บโค้ดนี้แล้ว {existing?.claimedCount.toLocaleString("th-TH")} คน — “ต้องเก็บก่อนใช้” ล็อก
                และจำนวนที่แจกเพิ่มได้อย่างเดียว
              </>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          <Section title="1. ข้อมูลโค้ด">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                field="code"
                htmlFor="promotion-code"
                label={translate("รหัสโค้ด", "Code")}
                required
                hint="A–Z และ 0–9 ยาว 4–20 ตัว · ระบบเก็บเป็นตัวพิมพ์ใหญ่ และห้ามซ้ำกับโค้ดร้าน"
                error={errors.code}
              >
                <InputGroup data-disabled={locked("code") || undefined}>
                  <InputGroupInput
                    id="promotion-code"
                    aria-label={translate("รหัสโค้ด", "Code")}
                    aria-invalid={!!errors.code || undefined}
                    value={form.code}
                    maxLength={20}
                    autoComplete="off"
                    disabled={locked("code")}
                    placeholder="PEGASUS10"
                    className="font-semibold tracking-[0.04em] placeholder:font-normal placeholder:tracking-normal"
                    onChange={(event) => change("code", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  />
                  {locked("code") ? (
                    <LockedSuffix locked />
                  ) : (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="xs"
                        variant="secondary"
                        className="h-auto rounded-[4px]! bg-muted px-2 py-0.5 text-xs text-[#414755]"
                        onClick={() => change("code", randomCode())}
                      >
                        สุ่มโค้ด
                      </InputGroupButton>
                    </InputGroupAddon>
                  )}
                </InputGroup>
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
                  aria-label={translate("ชื่อแคมเปญ", "Campaign name")}
                  aria-invalid={!!errors.name || undefined}
                  value={form.name}
                  maxLength={60}
                  placeholder="ลด 10% ต้อนรับปลายปี"
                  onChange={(event) => change("name", event.target.value)}
                />
              </FormField>
            </div>
            <FormField field="visibility" label={translate("การมองเห็น", "Visibility")}>
              <RadioGroup
                aria-label={translate("การมองเห็น", "Visibility")}
                value={form.visibility}
                onValueChange={(value) => change("visibility", value as AdminPromotionInput["visibility"])}
                className="grid gap-4 sm:grid-cols-2"
              >
                <ChoiceCard
                  value="PUBLIC"
                  title={translate("สาธารณะ", "Public")}
                  hint="แสดงในตัวเลือกโค้ดตอนชำระเงิน"
                  disabled={locked("visibility")}
                />
                <ChoiceCard
                  value="PRIVATE"
                  title={translate("ส่วนตัว", "Private")}
                  hint="ผู้ซื้อต้องพิมพ์โค้ดเอง (แจกผ่านโซเชียล)"
                  disabled={locked("visibility")}
                />
              </RadioGroup>
            </FormField>
            <details
              className="scroll-mt-24 text-xs text-muted-foreground"
              data-field="description"
              open={!!form.description || undefined}
            >
              <summary className="cursor-pointer">คำอธิบายเพิ่มเติม (ไม่บังคับ)</summary>
              <Input
                aria-label={translate("คำอธิบาย", "Description")}
                className="mt-2"
                value={form.description ?? ""}
                maxLength={500}
                placeholder="คำอธิบายภายในแคมเปญ"
                onChange={(event) => change("description", event.target.value)}
              />
            </details>
          </Section>

          <Section title="2. ประเภทส่วนลด">
            <RadioGroup
              aria-label={translate("ประเภทส่วนลด", "Discount type")}
              data-field="discountType"
              value={form.discountType}
              onValueChange={(value) => change("discountType", value as AdminPromotionInput["discountType"])}
              className="grid gap-4 sm:grid-cols-3"
            >
              <ChoiceCard value="PERCENT" title={translate("เปอร์เซ็นต์", "Percentage")} hint="ลด x% ของยอดสินค้า" disabled={locked("discountType")} />
              <ChoiceCard value="FIXED" title={translate("จำนวนเงิน", "Amount")} hint="ลดเป็นบาท" disabled={locked("discountType")} />
              <ChoiceCard value="FREE_SHIPPING" title={translate("ส่งฟรี", "Free shipping")} hint="ลดค่าส่งทุกร้าน" disabled={locked("discountType")} />
            </RadioGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              {form.discountType !== "FREE_SHIPPING" ? (
                <FormField
                  field="discountValue"
                  htmlFor="promotion-discountValue"
                  label={translate("มูลค่าส่วนลด", "Discount value")}
                  required
                  hint={form.discountType === "PERCENT" ? "1–90%" : translate("ต้องมากกว่า ฿0", "Must be greater than ฿0")}
                  error={errors.discountValue}
                >
                  <NumberInput
                    id="promotion-discountValue"
                    label={translate("มูลค่าส่วนลด", "Discount value")}
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
                  label={form.discountType === "FREE_SHIPPING" ? "ลดค่าส่งสูงสุดต่อร้าน" : translate("ส่วนลดสูงสุด", "Maximum discount")}
                  hint={
                    form.discountType === "FREE_SHIPPING"
                      ? "เว้นว่าง = ส่งฟรีเต็มจำนวน (งบประเมินจาก ฿60 / ร้าน)"
                      : "เว้นว่าง = ไม่จำกัด (แนะนำให้ใส่)"
                  }
                  error={errors.maxDiscount}
                >
                  <NumberInput
                    id="promotion-maxDiscount"
                    label={translate("ส่วนลดสูงสุด", "Maximum discount")}
                    value={form.maxDiscount}
                    onChange={(value) => change("maxDiscount", value)}
                    prefix="฿"
                    locked={locked("maxDiscount")}
                    invalid={!!errors.maxDiscount}
                  />
                </FormField>
              ) : null}
            </div>
          </Section>

          <Section title="3. เงื่อนไข" description="ยอดขั้นต่ำคิดจากสินค้าที่เข้าเงื่อนไขหลังหักโค้ดร้าน ไม่รวมค่าส่ง">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField field="minSpend" htmlFor="promotion-minSpend" label={translate("ยอดสั่งซื้อขั้นต่ำ", "Minimum order amount")} error={errors.minSpend}>
                <NumberInput
                  id="promotion-minSpend"
                  label={translate("ยอดสั่งซื้อขั้นต่ำ", "Minimum order amount")}
                  value={form.minSpend}
                  onChange={(value) => change("minSpend", value as number)}
                  prefix="฿"
                  locked={locked("minSpend")}
                  invalid={!!errors.minSpend}
                />
              </FormField>
              <FormField field="scopeType" label={translate("ใช้กับสินค้า", "Apply to products")}>
                <ToggleGroup
                  aria-label={translate("ใช้กับสินค้า", "Apply to products")}
                  size="sm"
                  variant="outline"
                  spacing={1.5}
                  disabled={locked("scopeType")}
                  value={[form.scopeType]}
                  onValueChange={(next: string[]) => {
                    const value = next[0] as AdminPromotionInput["scopeType"] | undefined;
                    if (value) change("scopeType", value);
                  }}
                  className="flex-wrap"
                >
                  {SCOPE_OPTIONS.map((option) => (
                    <ToggleGroupItem
                      key={option.value}
                      value={option.value}
                      className="h-auto min-w-0 rounded-full px-2.5 py-[5px] text-xs text-[#414755] aria-pressed:border-primary aria-pressed:bg-[#f0f7fc] aria-pressed:text-[#0058bc]"
                    >
                      {option.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormField>
            </div>
            {form.scopeType !== "ALL" ? (
              <FieldSet
                data-field="scopeIds"
                disabled={locked("scopeIds")}
                className="max-h-48 scroll-mt-24 gap-2 overflow-y-auto rounded-lg border p-3"
              >
                <FieldLegend variant="label" className="mb-1 text-xs text-muted-foreground">
                  {form.scopeType === "GAME" ? translate("เลือกเกม", "Select game") : translate("เลือกหมวดหมู่", "Select category")} (เลือกได้หลายรายการ)
                </FieldLegend>
                {scopeOptions.data?.map((item) => {
                  const id = `promotion-scope-${item.id}`;
                  return (
                    <Field key={item.id} orientation="horizontal" className="gap-2">
                      <Checkbox
                        id={id}
                        checked={form.scopeIds.includes(item.id)}
                        onCheckedChange={(checked) =>
                          change(
                            "scopeIds",
                            checked === true
                              ? [...form.scopeIds, item.id]
                              : form.scopeIds.filter((scopeId) => scopeId !== item.id),
                          )
                        }
                      />
                      <FieldLabel htmlFor={id} className="text-xs font-normal">
                        {item.name}
                      </FieldLabel>
                    </Field>
                  );
                })}
                {scopeOptions.isPending ? (
                  <span role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Spinner className="size-3.5" />
                    {translate("กำลังโหลดรายการ...", "Loading items…")}</span>
                ) : null}
                {scopeOptions.isError ? (
                  <FieldError className="text-[11px]">โหลดรายการไม่สำเร็จ</FieldError>
                ) : null}
                {errors.scopeIds ? <FieldError className="text-[11px]">{errors.scopeIds}</FieldError> : null}
              </FieldSet>
            ) : null}
            <div data-field="newBuyerOnly" className="scroll-mt-24">
              <ToggleRow
                id="promotion-new-buyer"
                title={translate("เฉพาะผู้ซื้อใหม่", "New buyers only")}
                hint="ใช้ได้เฉพาะบัญชีที่ยังไม่เคยมีคำสั่งซื้อที่ชำระเงินแล้ว"
                checked={form.newBuyerOnly}
                disabled={locked("newBuyerOnly")}
                onChange={(checked) => change("newBuyerOnly", checked)}
              />
            </div>
          </Section>

          <Section title="4. ระยะเวลาและจำนวนสิทธิ์">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField field="startsAt" htmlFor="promotion-startsAt" label={translate("เริ่มใช้ได้", "Available from")} required error={errors.startsAt}>
                <DateTimePicker
                  id="promotion-startsAt"
                  aria-label={translate("เริ่มใช้ได้", "Available from")}
                  value={toLocalInput(form.startsAt)}
                  disabled={locked("startsAt")}
                  invalid={!!errors.startsAt}
                  suffix={locked("startsAt") ? <Lock aria-label={translate("ล็อก", "Locked")} className="text-muted-foreground" /> : null}
                  onChange={(value) => change("startsAt", fromLocalInput(value))}
                />
              </FormField>
              <FormField
                field="endsAt"
                htmlFor="promotion-endsAt"
                label={locks.used ? "สิ้นสุด (ยืดได้เท่านั้น)" : translate("สิ้นสุด", "Ended")}
                required
                hint="ต้องหลังวันเริ่มใช้"
                error={errors.endsAt}
              >
                <DateTimePicker
                  id="promotion-endsAt"
                  aria-label={translate("สิ้นสุด", "Ended")}
                  invalid={!!errors.endsAt}
                  defaultTime="23:59"
                  value={toLocalInput(form.endsAt)}
                  min={locks.used && existing ? toLocalInput(existing.endsAt) : toLocalInput(form.startsAt)}
                  onChange={(value) => change("endsAt", fromLocalInput(value))}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                field="usageLimitTotal"
                htmlFor="promotion-usageLimitTotal"
                label={
                  locks.used
                    ? `จำนวนสิทธิ์ทั้งหมด (เพิ่มได้เท่านั้น ≥ ${usedLimitFloor.toLocaleString("th-TH")})`
                    : translate("จำนวนสิทธิ์ทั้งหมด", "Total redemptions available")
                }
                hint="เว้นว่าง = ไม่จำกัด"
                error={errors.usageLimitTotal}
              >
                <NumberInput
                  id="promotion-usageLimitTotal"
                  label={translate("จำนวนสิทธิ์ทั้งหมด", "Total redemptions available")}
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
                label={translate("สิทธิ์ต่อผู้ซื้อ 1 คน", "Redemptions per buyer")}
                required
                error={errors.usageLimitPerUser}
              >
                <NumberInput
                  id="promotion-usageLimitPerUser"
                  label={translate("สิทธิ์ต่อผู้ซื้อ 1 คน", "Redemptions per buyer")}
                  value={form.usageLimitPerUser}
                  onChange={(value) => change("usageLimitPerUser", value as number)}
                  suffix="ครั้ง"
                  min={1}
                  locked={locked("usageLimitPerUser")}
                  invalid={!!errors.usageLimitPerUser}
                />
              </FormField>
            </div>
          </Section>

          <Section
            title="5. การแจกโค้ด (กดเก็บ)"
            badge={<Badge className="h-4 rounded bg-[#e8f1fc] px-1.5 text-[9px] text-[#0058bc]">{translate("ใหม่", "New")}</Badge>}
          >
            <div data-field="claimable" className="scroll-mt-24">
              <ToggleRow
                id="promotion-claimable"
                title="ให้ผู้ซื้อกดเก็บได้"
                hint="โค้ดจะมีปุ่ม “เก็บ” และอยู่ในกระเป๋า “โค้ดของฉัน” (ต้องเป็นโค้ดสาธารณะ)"
                checked={form.claimable}
                disabled={form.visibility !== "PUBLIC"}
                onChange={(checked) => change("claimable", checked)}
              />
            </div>
            <div data-field="featuredOnHome" className="grid scroll-mt-24 gap-1.5">
              <ToggleRow
                id="promotion-featured"
                title={translate("แสดงบนหน้าแรก", "Show on home page")}
                hint={`อยู่ในแถบ “โค้ดส่วนลดจาก Pegasus” ใต้ Hero · สูงสุด ${HOME_STRIP_MAX} ใบ`}
                checked={form.featuredOnHome}
                disabled={!form.claimable || form.visibility !== "PUBLIC"}
                onChange={(checked) => change("featuredOnHome", checked)}
              />
              {errors.featuredOnHome ? <FieldError className="text-[11px]">{errors.featuredOnHome}</FieldError> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                field="claimLimit"
                htmlFor="promotion-claimLimit"
                label={locks.claimed ? "จำนวนที่แจก (เพิ่มได้เท่านั้น)" : "จำนวนที่แจก (เก็บได้)"}
                hint="เว้นว่าง = ไม่จำกัด · แยกจากจำนวนสิทธิ์ใช้"
                error={errors.claimLimit}
              >
                <NumberInput
                  id="promotion-claimLimit"
                  label={translate("จำนวนที่แจก", "Number issued")}
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
                label={translate("ลำดับบนหน้าแรก", "Home page display order")}
                hint="เลขน้อยแสดงก่อน"
                error={errors.homeSort}
              >
                <Input
                  id="promotion-homeSort"
                  aria-label={translate("ลำดับบนหน้าแรก", "Home page display order")}
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
            <div data-field="claimRequired" className="grid scroll-mt-24 gap-1.5">
              <ToggleRow
                id="promotion-claim-required"
                title={translate("ต้องเก็บก่อนใช้", "Must be claimed before use")}
                hint="เปิด = พิมพ์โค้ดเองใช้ไม่ได้ถ้ายังไม่ได้เก็บ (PROMO_NOT_CLAIMED) เหมาะกับแคมเปญแจกจำนวนจำกัด"
                checked={form.claimRequired}
                disabled={locked("claimRequired") || !form.claimable}
                onChange={(checked) => change("claimRequired", checked)}
              />
              {errors.claimRequired ? <FieldError className="text-[11px]">{errors.claimRequired}</FieldError> : null}
            </div>
          </Section>
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
              {translate("อยู่ต่อ", "Stay")}</Button>
            <Button className={PROMOTION_DANGER_BUTTON} onClick={() => blocker.proceed?.()}>
              ออกโดยไม่บันทึก
            </Button>
          </>
        }
      />
    </main>
  );
}

/** การ์ดหนึ่งหมวดของฟอร์ม (Figma PRM-A2 การ์ด 1–5) */
function Section({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  useLanguage();
  return (
    <Card className="gap-4 rounded-[12px] border border-border p-5 shadow-none ring-0">
      <CardHeader className="gap-0.5 px-0">
        <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
          {title}
          {badge}
        </CardTitle>
        {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="grid gap-4 px-0">{children}</CardContent>
    </Card>
  );
}
