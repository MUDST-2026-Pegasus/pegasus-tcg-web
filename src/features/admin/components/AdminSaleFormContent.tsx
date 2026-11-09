import { type ReactNode, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useBlocker, useNavigate } from "react-router-dom";
import { CalendarClock, Check, Info, Lock, LogOut } from "lucide-react";

import { DateTimePicker, FileUpload } from "@/components/common";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { RadioGroup } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/toast";
import type { CardCondition } from "@/features/catalog/catalog.types";
import { useFileUpload } from "@/hooks/use-file-upload";
import { hasErrorCode } from "@/lib/api";
import { cn } from "@/lib/utils";

import { useAdminGames } from "../catalog.queries";
import { formatBaht } from "../promotions.format";
import { usePromotionCategories } from "../promotions.queries";
import { PROMOTION_DANGER_BUTTON, PROMOTION_PAGE_CONTROLS } from "../promotions.styles";
import {
  SCOPE_PREVIEW_DEBOUNCE_MS,
  compactBaht,
  conditionLabel,
  durationLabel,
  saleErrorMessage,
  salePeriod,
} from "../sales.format";
import { useSale, useSaleCardSets, useSaveSale, useSaveSaleDraft, useScopePreview, useSellerSearch } from "../sales.queries";
import { type SaleFormErrors, getSaleErrors, getSaleLocks, slugify, toSaleInput, toSalePayload } from "../sales.schema";
import type { AdminSale, AdminSaleInput, SaleScopePreviewInput } from "../sales.types";
import { PromotionDialog } from "./PromotionDialog";
import { ChoiceCard, FormField, LockedSuffix, NumberInput, ToggleRow } from "./PromotionFormControls";
import { SaleFormAside } from "./SaleFormAside";
import { ChipPicker, Segmented, ToggleChips } from "./SaleFormControls";
import { intlLocale } from "@/lib/i18n";

/** ลำดับฟิลด์บนหน้า — กดบันทึกแล้วเลื่อนไปหา error แรกตามนี้ */
const FIELD_ORDER: Array<keyof AdminSaleInput> = [
  "name",
  "slug",
  "scopeIds",
  "minUnitPrice",
  "discountValue",
  "maxDiscountPerUnit",
  "startsAt",
  "endsAt",
  "perListingQuota",
  "perBuyerLimit",
  "budgetCap",
  "homeSort",
];

const CONDITIONS: Array<{ value: CardCondition; label: string }> = (
  ["NM", "LP", "MP", "HP", "DMG", "SEALED"] as const
).map((value) => ({ value, label: conditionLabel(value) }));

/** เริ่มพรุ่งนี้ 00:00 จบ 23:59 วันเดียวกัน (Flash 24 ชม. ตาม Figma SAL-A2) */
function emptySale(): AdminSaleInput {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 0, 0);
  return {
    name: "",
    slug: "",
    saleType: "FLASH_SALE",
    discountType: "PERCENT",
    discountValue: 30,
    maxDiscountPerUnit: 1500,
    scopeType: "ALL",
    scopeIds: [],
    conditions: [],
    minUnitPrice: 100,
    excludedSellerIds: [],
    perListingQuota: 20,
    perBuyerLimit: 1,
    budgetCap: null,
    bannerImageUrl: null,
    featuredOnHome: true,
    homeSort: null,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
}

/** ISO → ค่าแบบ `datetime-local` ตามเวลาเครื่อง (ค่าของ `DateTimePicker`) */
function toLocalInput(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/** หน้า /admin/sales/new และ /admin/sales/:id/edit (Figma SAL-A2) */
export function AdminSaleFormContent({ id }: { id: number }) {
  const existing = useSale(id);
  if (id > 0 && existing.isPending) return <p className="p-8 text-sm text-muted-foreground">กำลังโหลดแคมเปญ...</p>;
  if (id > 0 && existing.isError) {
    return (
      <p role="alert" className="p-8 text-sm text-destructive">
        {saleErrorMessage(existing.error, "โหลดแคมเปญไม่สำเร็จ")}{" "}
        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void existing.refetch()}>
          ลองอีกครั้ง
        </Button>
      </p>
    );
  }
  if (existing.data?.ownerType === "SELLER") {
    return (
      <div role="alert" className="grid gap-3 p-8 text-sm">
        <p>การลดราคาของร้านแอดมินแก้ไขไม่ได้ (หยุดได้พร้อมเหตุผล)</p>
        <Link className="text-primary underline" to="/admin/promotions?tab=sales">
          กลับไปรายการลดราคา
        </Link>
      </div>
    );
  }
  return <SaleEditor key={id || "new"} existing={existing.data} />;
}

function SaleEditor({ existing }: { existing?: AdminSale }) {
  const navigate = useNavigate();
  const save = useSaveSale();
  const saveDraft = useSaveSaleDraft();
  const [form, setForm] = useState<AdminSaleInput>(() => (existing ? toSaleInput(existing) : emptySale()));
  const [slugTouched, setSlugTouched] = useState(!!existing);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errors, setErrors] = useState<SaleFormErrors>({});
  const [sellerQuery, setSellerQuery] = useState("");
  const blocker = useBlocker(dirty && !saved);
  const locks = getSaleLocks(existing);
  const locked = locks.isLocked;
  const flash = form.saleType === "FLASH_SALE";

  const banner = useFileUpload({
    purpose: "CATALOG_IMAGE",
    // API เก็บค่านี้ตามที่ส่ง — ส่ง object key ที่อัปแล้ว · เอารูปออกกลับไปใช้รูปเดิม
    onChange: (keys) => change("bannerImageUrl", keys[0] ?? existing?.bannerImageUrl ?? null),
  });

  const games = useAdminGames();
  const categories = usePromotionCategories(form.scopeType === "CATEGORY");
  const gameIds = useMemo(() => (games.data ?? []).map((game) => game.id), [games.data]);
  const cardSets = useSaleCardSets(gameIds, form.scopeType === "CARD_SET");
  const sellers = useSellerSearch(sellerQuery);
  const [sellerNames, setSellerNames] = useState<Map<number, string>>(() => new Map());

  // ปิดแท็บ/รีโหลดตอนมีข้อมูลค้าง — route blocker จับได้แค่การเปลี่ยนหน้าในแอป
  useEffect(() => {
    if (!dirty || saved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saved]);

  function change<K extends keyof AdminSaleInput>(key: K, value: AdminSaleInput[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "scopeType") next.scopeIds = [];
      if (key === "name" && !slugTouched) next.slug = slugify(String(value));
      if (key === "discountType" && value === "FIXED_OFF") {
        Object.assign(next, { discountValue: 50, maxDiscountPerUnit: null });
      }
      if (key === "discountType" && value === "PERCENT") Object.assign(next, { discountValue: 10 });
      return next;
    });
    setDirty(true);
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  const payload = toSalePayload(form);

  const scopeInput = useMemo<SaleScopePreviewInput>(
    () => ({
      scopeType: form.scopeType,
      scopeIds: form.scopeType === "ALL" ? [] : form.scopeIds,
      conditions: form.conditions,
      minUnitPrice: form.minUnitPrice,
      excludedSellerIds: form.excludedSellerIds,
    }),
    [form.scopeType, form.scopeIds, form.conditions, form.minUnitPrice, form.excludedSellerIds],
  );
  const debouncedScope = useDebounced(scopeInput, SCOPE_PREVIEW_DEBOUNCE_MS);
  const preview = useScopePreview(debouncedScope, debouncedScope.scopeType === "ALL" || debouncedScope.scopeIds.length > 0);

  const scopeOptions = useMemo(() => {
    if (form.scopeType === "GAME") return (games.data ?? []).map((game) => ({ id: game.id, label: game.name }));
    if (form.scopeType === "CATEGORY") return (categories.data ?? []).map((item) => ({ id: item.id, label: item.name }));
    if (form.scopeType === "CARD_SET") {
      return (cardSets.data ?? []).map((set) => ({ id: set.id, label: set.code ? `${set.code} · ${set.name}` : set.name }));
    }
    return [];
  }, [form.scopeType, games.data, categories.data, cardSets.data]);
  const scopeLoading =
    form.scopeType === "GAME" ? games.isPending : form.scopeType === "CATEGORY" ? categories.isPending : cardSets.isPending;

  const sellerOptions = useMemo(() => {
    const found = (sellers.data ?? []).map((seller) => ({ id: seller.id, label: seller.username }));
    const known = form.excludedSellerIds
      .filter((sellerId) => !found.some((option) => option.id === sellerId))
      .map((sellerId) => ({ id: sellerId, label: sellerNames.get(sellerId) ?? `ร้าน #${sellerId}` }));
    return [...found, ...known];
  }, [sellers.data, form.excludedSellerIds, sellerNames]);

  const scopeNoun =
    form.scopeType === "GAME" ? "เกม" : form.scopeType === "CATEGORY" ? "หมวดหมู่" : form.scopeType === "CARD_SET" ? "ชุดการ์ด" : "";
  const summaryLines = [
    `${form.scopeType === "ALL" ? "ทุกสินค้า" : `${form.scopeIds.length} ${scopeNoun}`}${preview.data ? ` · ${preview.data.listingCount.toLocaleString(intlLocale())} listing` : ""}`,
    form.discountType === "PERCENT"
      ? `ลด ${form.discountValue ?? 0}%${form.maxDiscountPerUnit != null ? ` สูงสุด ${formatBaht(form.maxDiscountPerUnit)}/ชิ้น` : ""}`
      : `ลด ${formatBaht(form.discountValue)}/ชิ้น`,
    `${salePeriod(form)}${durationLabel(form.startsAt, form.endsAt) ? ` (${durationLabel(form.startsAt, form.endsAt).replace("ยาว ", "")})` : ""}`,
    ...(flash
      ? [`โควตา ${form.perListingQuota ?? "—"}/listing · ${form.perBuyerLimit == null ? "ไม่จำกัด" : `${form.perBuyerLimit} ชิ้น`}/คน`]
      : []),
    `งบ ${form.budgetCap == null ? "ไม่จำกัด" : formatBaht(form.budgetCap)}${form.featuredOnHome ? " · แสดงบนหน้าแรก" : ""}`,
    "listing ที่ร้านลดเองอยู่แล้ว ใช้ราคาที่ต่ำกว่า",
  ];

  const validate = (): boolean => {
    const next = getSaleErrors(payload, { existing });
    setErrors(next);
    const first = FIELD_ORDER.find((key) => next[key]);
    if (!first) return true;
    const target = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
    target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    target?.querySelector<HTMLElement>("input:not([disabled]), button:not([disabled])")?.focus({ preventScroll: true });
    return false;
  };

  const finish = (title: string) => {
    // ปลด blocker ก่อน navigate ไม่งั้นถาม "ออกจากหน้านี้?" ซ้ำ
    flushSync(() => setSaved(true));
    toast.add({ title, type: "success" });
    navigate("/admin/promotions?tab=sales");
  };

  const onError = (error: unknown) => {
    setConfirming(false);
    if (hasErrorCode(error, "SALE_SLUG_TAKEN")) {
      setErrors((current) => ({ ...current, slug: saleErrorMessage(error, "") }));
      document.querySelector('[data-field="slug"]')?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      return;
    }
    toast.add({
      title: existing ? "บันทึกไม่สำเร็จ" : "สร้างแคมเปญไม่สำเร็จ",
      description: saleErrorMessage(error, "กรุณาลองอีกครั้ง"),
      type: "error",
    });
  };

  const submit = () =>
    save.mutate(
      { id: existing?.id, input: payload },
      { onSuccess: (sale) => finish(existing ? "บันทึกการเปลี่ยนแปลงแล้ว" : `ตั้งเวลาเปิด ${sale.name} แล้ว`), onError },
    );

  const submitDraft = () => {
    if (!validate()) return;
    saveDraft.mutate(
      { id: existing?.id, input: payload },
      { onSuccess: () => finish("บันทึกร่างแล้ว — แคมเปญหยุดไว้ ยังไม่เปิด"), onError },
    );
  };

  const pending = save.isPending || saveDraft.isPending || banner.isUploading;
  const lockNote = "แก้ไขหลังมีออเดอร์: ได้เฉพาะชื่อ, วันจบ, งบ (เพิ่ม), โควตา (เพิ่ม), หยุด/จบทันที";

  return (
    <main className={cn("grid w-full min-w-0 gap-6", PROMOTION_PAGE_CONTROLS)}>
      <div className="grid gap-4">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/admin/promotions" />}>โปรโมชั่น &amp; ลดราคา</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/admin/promotions?tab=sales" />}>ลดราคาสินค้า</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{existing ? `แก้ไข ${existing.name}` : "สร้างแคมเปญ"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header>
          <h1 className="text-2xl font-black">{existing ? "แก้ไขแคมเปญลดราคา" : "สร้างแคมเปญลดราคา"}</h1>
          <p className="text-sm text-muted-foreground">Pegasus ออกเงินส่วนลด · ร้านได้เงินเต็มราคาตั้งต้น</p>
        </header>
      </div>

      {locks.hasOrders ? (
        <Alert className="border-[#cfe0f7] bg-[#e8f1fc] text-[#0058bc]">
          <Info />
          <AlertDescription className="text-xs text-[#0058bc]">
            แคมเปญนี้มีออเดอร์แล้ว (ขายไป {(existing?.soldUnits ?? 0).toLocaleString(intlLocale())} ชิ้น) — ฟิลด์ที่มี{" "}
            <Lock className="inline size-3" aria-label="แม่กุญแจ" /> แก้ไม่ได้ · งบและโควตาเพิ่มได้อย่างเดียว
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          <Section title="1. ประเภทแคมเปญ">
            <RadioGroup
              aria-label="ประเภทแคมเปญ"
              value={form.saleType}
              onValueChange={(value) => change("saleType", value as AdminSaleInput["saleType"])}
              className="grid gap-4 sm:grid-cols-2"
            >
              <ChoiceCard
                value="FLASH_SALE"
                title="⚡ Flash Sale"
                hint="ช่วงสั้น ≤ 72 ชม. · โควตาชิ้นต่อ listing · นับถอยหลังบนหน้าแรก"
                disabled={locked("saleType")}
              />
              <ChoiceCard
                value="CATEGORY_SALE"
                title="ลดทั้งหมวด / ชุดการ์ด"
                hint="ลดตามเกม หมวดหมู่ หรือชุดการ์ด ช่วงหลายวัน"
                disabled={locked("saleType")}
              />
            </RadioGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField field="name" htmlFor="sale-name" label="ชื่อแคมเปญ" required error={errors.name}>
                <Input
                  id="sale-name"
                  aria-label="ชื่อแคมเปญ"
                  aria-invalid={!!errors.name || undefined}
                  value={form.name}
                  maxLength={80}
                  placeholder="11.11 Flash Sale"
                  onChange={(event) => change("name", event.target.value)}
                />
              </FormField>
              <FormField
                field="slug"
                htmlFor="sale-slug"
                label="ลิงก์หน้าแคมเปญ"
                required
                hint="a–z 0–9 และ - · ใช้เป็น /sale/{slug}"
                error={errors.slug}
              >
                <InputGroup data-disabled={locked("slug") || undefined}>
                  <InputGroupInput
                    id="sale-slug"
                    aria-label="ลิงก์หน้าแคมเปญ"
                    aria-invalid={!!errors.slug || undefined}
                    value={form.slug}
                    maxLength={60}
                    disabled={locked("slug")}
                    placeholder="1111-flash"
                    onChange={(event) => {
                      setSlugTouched(true);
                      change("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    }}
                  />
                  {locked("slug") ? (
                    <LockedSuffix locked />
                  ) : (
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>/sale/…</InputGroupText>
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </FormField>
            </div>
          </Section>

          <Section
            title="2. ขอบเขตสินค้า"
            description="listing ที่ LISTED และเข้าเงื่อนไขทั้งหมดได้ราคาลดอัตโนมัติ (ไม่รวมสินค้าประมูล)"
          >
            <Segmented
              label="ขอบเขตสินค้า"
              value={form.scopeType}
              disabled={locked("scopeType")}
              onChange={(value) => change("scopeType", value)}
              options={[
                { value: "ALL", label: "ทุกสินค้า" },
                { value: "GAME", label: "เกม" },
                { value: "CATEGORY", label: "หมวดหมู่" },
                { value: "CARD_SET", label: "ชุดการ์ด" },
              ]}
            />
            {form.scopeType !== "ALL" ? (
              <div data-field="scopeIds" className="scroll-mt-24">
                <ChipPicker
                  options={scopeOptions}
                  selected={form.scopeIds}
                  onChange={(ids) => change("scopeIds", ids)}
                  addLabel={`เพิ่ม${scopeNoun}`}
                  disabled={locked("scopeIds")}
                  loading={scopeLoading}
                  error={errors.scopeIds}
                />
              </div>
            ) : null}
            <FormField field="conditions" label="สภาพการ์ด (ไม่บังคับ)" hint="ไม่เลือก = ทุกสภาพ">
              <ToggleChips
                label="สภาพการ์ด"
                options={CONDITIONS}
                selected={form.conditions}
                disabled={locked("conditions")}
                onChange={(values) => change("conditions", values)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                field="minUnitPrice"
                htmlFor="sale-minUnitPrice"
                label="ราคาขั้นต่ำต่อชิ้น"
                hint="listing ราคาต่ำกว่านี้ไม่เข้าร่วม"
                error={errors.minUnitPrice}
              >
                <NumberInput
                  id="sale-minUnitPrice"
                  label="ราคาขั้นต่ำต่อชิ้น"
                  value={form.minUnitPrice}
                  onChange={(value) => change("minUnitPrice", value)}
                  suffix="฿"
                  locked={locked("minUnitPrice")}
                  invalid={!!errors.minUnitPrice}
                />
              </FormField>
              <FormField field="excludedSellerIds" label="ยกเว้นร้าน (ไม่บังคับ)">
                <ChipPicker
                  options={sellerOptions}
                  selected={form.excludedSellerIds}
                  onChange={(ids) => {
                    setSellerNames((current) => {
                      const next = new Map(current);
                      for (const option of sellerOptions) next.set(option.id, option.label);
                      return next;
                    });
                    change("excludedSellerIds", ids);
                  }}
                  addLabel="ค้นหาร้าน…"
                  disabled={locked("excludedSellerIds")}
                  loading={sellers.isFetching}
                  onSearch={setSellerQuery}
                />
              </FormField>
            </div>
            <ScopePreviewBar
              loading={preview.isFetching && !preview.data}
              error={preview.isError}
              listingCount={preview.data?.listingCount}
              sellerCount={preview.data?.shopCount}
              total={preview.data?.listTotal}
            />
          </Section>

          <Section title="3. ส่วนลด">
            <Segmented
              label="ประเภทส่วนลด"
              value={form.discountType}
              disabled={locked("discountType")}
              onChange={(value) => change("discountType", value)}
              options={[
                { value: "PERCENT", label: "ลดเป็น %" },
                { value: "FIXED_OFF", label: "ลดเป็นบาทต่อชิ้น" },
              ]}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                field="discountValue"
                htmlFor="sale-discountValue"
                label="ลด"
                required
                hint={form.discountType === "PERCENT" ? "1–90%" : "บาทต่อชิ้น · ราคาลดไม่ต่ำกว่า ฿1"}
                error={errors.discountValue}
              >
                <NumberInput
                  id="sale-discountValue"
                  label="ส่วนลด"
                  value={form.discountValue}
                  onChange={(value) => change("discountValue", value)}
                  suffix={form.discountType === "PERCENT" ? "%" : "฿"}
                  min={1}
                  max={form.discountType === "PERCENT" ? 90 : undefined}
                  locked={locked("discountValue")}
                  invalid={!!errors.discountValue}
                />
              </FormField>
              {form.discountType === "PERCENT" ? (
                <FormField
                  field="maxDiscountPerUnit"
                  htmlFor="sale-maxDiscountPerUnit"
                  label="เพดานส่วนลดต่อชิ้น"
                  hint="การ์ดราคาสูงลดไม่เกินนี้ · ว่าง = ไม่จำกัด"
                  error={errors.maxDiscountPerUnit}
                >
                  <NumberInput
                    id="sale-maxDiscountPerUnit"
                    label="เพดานส่วนลดต่อชิ้น"
                    value={form.maxDiscountPerUnit}
                    onChange={(value) => change("maxDiscountPerUnit", value)}
                    suffix="฿"
                    locked={locked("maxDiscountPerUnit")}
                    invalid={!!errors.maxDiscountPerUnit}
                  />
                </FormField>
              ) : null}
            </div>
          </Section>

          <Section
            title="4. ช่วงเวลา & โควตา"
            description={
              flash
                ? "Flash Sale ยาวได้ไม่เกิน 72 ชั่วโมง · ราคาลดเริ่ม/จบอัตโนมัติ (ตรวจทุก 1 นาที)"
                : "ราคาลดเริ่ม/จบอัตโนมัติ (ตรวจทุก 1 นาที)"
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField field="startsAt" htmlFor="sale-startsAt" label="เริ่ม" required error={errors.startsAt}>
                <DateTimePicker
                  id="sale-startsAt"
                  aria-label="เริ่ม"
                  value={toLocalInput(form.startsAt)}
                  disabled={locked("startsAt")}
                  invalid={!!errors.startsAt}
                  suffix={locked("startsAt") ? <Lock aria-label="ล็อก" className="text-muted-foreground" /> : null}
                  onChange={(value) => change("startsAt", value ? new Date(value).toISOString() : "")}
                />
              </FormField>
              <FormField
                field="endsAt"
                htmlFor="sale-endsAt"
                label="สิ้นสุด"
                required
                hint={durationLabel(form.startsAt, form.endsAt) || "ต้องหลังวันเริ่ม"}
                error={errors.endsAt}
              >
                <DateTimePicker
                  id="sale-endsAt"
                  aria-label="สิ้นสุด"
                  invalid={!!errors.endsAt}
                  defaultTime="23:59"
                  min={toLocalInput(form.startsAt)}
                  value={toLocalInput(form.endsAt)}
                  onChange={(value) => change("endsAt", value ? new Date(value).toISOString() : "")}
                />
              </FormField>
            </div>
            {flash ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  field="perListingQuota"
                  htmlFor="sale-perListingQuota"
                  label={locks.hasOrders ? "โควตาต่อ listing (เพิ่มได้เท่านั้น)" : "โควตาต่อ listing"}
                  required
                  hint="ขายครบแล้ว listing นั้นกลับเป็นราคาปกติ"
                  error={errors.perListingQuota}
                >
                  <NumberInput
                    id="sale-perListingQuota"
                    label="โควตาต่อ listing"
                    value={form.perListingQuota}
                    onChange={(value) => change("perListingQuota", value)}
                    suffix="ชิ้น"
                    min={locks.hasOrders ? (existing?.perListingQuota ?? 1) : 1}
                    invalid={!!errors.perListingQuota}
                  />
                </FormField>
                <FormField
                  field="perBuyerLimit"
                  htmlFor="sale-perBuyerLimit"
                  label="จำกัดต่อผู้ซื้อ"
                  hint="เกิน → SALE_BUYER_LIMIT_REACHED · ว่าง = ไม่จำกัด"
                  error={errors.perBuyerLimit}
                >
                  <NumberInput
                    id="sale-perBuyerLimit"
                    label="จำกัดต่อผู้ซื้อ"
                    value={form.perBuyerLimit}
                    onChange={(value) => change("perBuyerLimit", value)}
                    suffix="ชิ้น / listing"
                    min={1}
                    locked={locked("perBuyerLimit")}
                    invalid={!!errors.perBuyerLimit}
                  />
                </FormField>
              </div>
            ) : null}
          </Section>

          <Section title="5. งบ & การแสดงผล">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                field="budgetCap"
                htmlFor="sale-budgetCap"
                label={locks.hasOrders ? "งบอุดหนุนสูงสุด (เพิ่มได้เท่านั้น)" : "งบอุดหนุนสูงสุด"}
                hint="ยอดจองถึงงบ → แคมเปญจบเอง (หมดงบ) · ว่าง = ไม่จำกัด"
                error={errors.budgetCap}
              >
                <NumberInput
                  id="sale-budgetCap"
                  label="งบอุดหนุนสูงสุด"
                  value={form.budgetCap}
                  onChange={(value) => change("budgetCap", value)}
                  suffix="฿"
                  min={locks.hasOrders ? (existing?.budgetCap ?? 0) : 0}
                  invalid={!!errors.budgetCap}
                />
              </FormField>
              <FormField field="bannerImageUrl" htmlFor="sale-banner" label="แบนเนอร์ (ไม่บังคับ)" hint="ใช้บนหน้า /sale/{slug} · แนะนำ 1200×300">
                {existing?.bannerImageUrl && banner.items.length === 0 ? (
                  <img src={existing.bannerImageUrl} alt="แบนเนอร์ปัจจุบัน" className="aspect-[4/1] w-full rounded-md object-cover" />
                ) : null}
                <FileUpload id="sale-banner" upload={banner} title="อัปโหลดรูป 1200×300" />
              </FormField>
            </div>
            <ToggleRow
              id="sale-featured"
              title={flash ? "แสดงบนหน้าแรก (แถบ Flash Sale)" : "แสดงแบนเนอร์บนหน้าแรก"}
              hint={
                flash
                  ? "ครั้งละ 1 Flash Sale · ก่อนเริ่ม 24 ชม. แสดงเป็น “เร็วๆ นี้”"
                  : "แบนเนอร์ลดทั้งหมวดใต้แถบ Flash Sale · เรียงตามลำดับ"
              }
              checked={form.featuredOnHome}
              onChange={(checked) => change("featuredOnHome", checked)}
            />
            {!flash && form.featuredOnHome ? (
              <FormField field="homeSort" htmlFor="sale-homeSort" label="ลำดับแบนเนอร์บนหน้าแรก" hint="เลขน้อยแสดงก่อน" error={errors.homeSort}>
                <Input
                  id="sale-homeSort"
                  aria-label="ลำดับแบนเนอร์บนหน้าแรก"
                  type="number"
                  min={1}
                  className="max-w-40"
                  value={form.homeSort == null ? "" : form.homeSort + 1}
                  onChange={(event) =>
                    change("homeSort", event.target.value === "" ? null : Math.max(0, Number(event.target.value) - 1))
                  }
                />
              </FormField>
            ) : null}
          </Section>
        </div>

        <SaleFormAside
          form={payload}
          summary={summaryLines}
          note={lockNote}
          actions={
            <>
              {existing && existing.status !== "PAUSED" ? (
                <Button variant="outline" disabled={pending} onClick={() => navigate("/admin/promotions?tab=sales")}>
                  ยกเลิก
                </Button>
              ) : (
                <Button variant="outline" disabled={pending} onClick={submitDraft}>
                  บันทึกร่าง
                </Button>
              )}
              <Button disabled={pending} onClick={() => validate() && setConfirming(true)}>
                {existing ? "บันทึก" : "ตั้งเวลาเปิดแคมเปญ"}
              </Button>
            </>
          }
        />
      </div>

      <PromotionDialog
        open={confirming}
        onOpenChange={setConfirming}
        tone="info"
        icon={existing ? <Check /> : <CalendarClock />}
        title={existing ? `บันทึกการเปลี่ยนแปลง ${payload.name}?` : `ตั้งเวลาเปิด ${payload.name}?`}
        description={
          existing
            ? "listing ที่ได้ราคาลดอยู่จะคิดราคาใหม่ภายใน 1 นาที · ผู้ซื้อที่มีสินค้าในตะกร้าจะเห็น “ราคาเปลี่ยน”"
            : "listing ที่เข้าเงื่อนไขจะเปลี่ยนเป็นราคาลดอัตโนมัติเมื่อถึงเวลาเริ่ม"
        }
        actions={
          <>
            <Button variant="outline" disabled={save.isPending} onClick={() => setConfirming(false)}>
              ยกเลิก
            </Button>
            <Button disabled={save.isPending} onClick={submit}>
              {existing ? "บันทึก" : "ตั้งเวลาเปิด"}
            </Button>
          </>
        }
      >
        <dl className="grid gap-1.5 rounded-md bg-muted px-3.5 py-2.5 text-xs [&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&_dt]:text-muted-foreground [&_dd]:font-semibold">
          <div>
            <dt>ช่วงเวลา</dt>
            <dd>{salePeriod(payload)}</dd>
          </div>
          <div>
            <dt>listing ที่เข้าตอนนี้</dt>
            <dd>
              {preview.data
                ? `${preview.data.listingCount.toLocaleString(intlLocale())} จาก ${preview.data.shopCount.toLocaleString(intlLocale())} ร้าน`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>ส่วนลด</dt>
            <dd>{summaryLines[1].replace(/^ลด /, "")}</dd>
          </div>
          <div>
            <dt>งบอุดหนุน</dt>
            <dd>{payload.budgetCap == null ? "ไม่จำกัด" : formatBaht(payload.budgetCap)}</dd>
          </div>
        </dl>
      </PromotionDialog>

      <PromotionDialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => !open && blocker.reset?.()}
        tone="warning"
        icon={<LogOut />}
        title="ทิ้งการแก้ไข?"
        description="การเปลี่ยนแปลงในแคมเปญยังไม่ได้บันทึก ถ้าออกตอนนี้ข้อมูลจะหายทั้งหมด"
        actions={
          <>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              อยู่ต่อ
            </Button>
            <Button className={PROMOTION_DANGER_BUTTON} onClick={() => blocker.proceed?.()}>
              ทิ้งการแก้ไข
            </Button>
          </>
        }
      />
    </main>
  );
}

/** แถบผล preview-scope ใต้การ์ดขอบเขต */
function ScopePreviewBar({
  loading,
  error,
  listingCount,
  sellerCount,
  total,
}: {
  loading: boolean;
  error: boolean;
  listingCount?: number;
  sellerCount?: number;
  total?: number;
}) {
  if (error) {
    return <p className="rounded-md bg-[#fdecec] px-3.5 py-2.5 text-[13px] text-[#b42318]">นับ listing ที่เข้าเงื่อนไขไม่สำเร็จ</p>;
  }
  return (
    <p aria-live="polite" className="flex items-center gap-2 rounded-md bg-[#f0f7fc] px-3.5 py-2.5 text-[13px] text-[#0058bc]">
      <Check className="size-4 shrink-0" aria-hidden />
      {loading || listingCount == null
        ? "กำลังนับ listing ที่เข้าเงื่อนไข…"
        : `เข้าเงื่อนไขตอนนี้ ${listingCount.toLocaleString(intlLocale())} listing จาก ${(sellerCount ?? 0).toLocaleString(intlLocale())} ร้าน · ราคารวมก่อนลด ${compactBaht(total ?? 0)}`}
    </p>
  );
}

/** การ์ดหนึ่งหมวดของฟอร์ม (Figma SAL-A2 การ์ด 1–5) */
function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="gap-4 rounded-[12px] border border-border p-5 shadow-none ring-0">
      <CardHeader className="gap-0.5 px-0">
        <CardTitle className="text-[15px] font-semibold">{title}</CardTitle>
        {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="grid gap-4 px-0">{children}</CardContent>
    </Card>
  );
}
