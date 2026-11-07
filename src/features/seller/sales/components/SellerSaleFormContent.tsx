import { translate, useLanguage } from "@/lib/language";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useBlocker, useNavigate } from "react-router-dom";
import { Info, LogOut, Search, TriangleAlert } from "lucide-react";

import { PriceTag, formatSaleBaht } from "@/components/sale";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DateTimePicker } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { toast } from "@/components/ui/toast";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { FormField } from "@/features/admin/components/PromotionFormControls";
import { ChipPicker, Segmented } from "@/features/admin/components/SaleFormControls";
import { PROMOTION_DANGER_BUTTON, PROMOTION_PAGE_CONTROLS } from "@/features/admin/promotions.styles";
import { salePeriod } from "@/features/admin/sales.format";
import { useCategoryList } from "@/features/catalog/catalog.queries";
import { CONDITION_LABEL } from "@/features/seller/products/products.format";
import type { SellerListingSummary } from "@/features/seller/products/products.types";
import { useSellerProfile } from "@/features/seller/shared/seller.queries";
import { hasErrorCode, isApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

import { SAMPLE_SELLER_COMMISSION, sellerSaleErrorMessage } from "../sales.format";
import {
  ROW_ERROR_MESSAGE,
  type SaleRowDraft,
  applyBulkPercent,
  percentRange,
  rowErrors,
  rowPercent,
  sellerTakeHome,
} from "../sales.rows";
import { usePlatformListings, useSaleableListings, useSaveSellerSale, useSellerSale } from "../sales.queries";
import type { SellerSaleDetail, SellerSaleInput, SellerSaleScope } from "../sales.types";

type Form = {
  name: string;
  startsAt: string;
  endsAt: string;
  scopeType: SellerSaleScope;
  scopeIds: number[];
  discountType: "PERCENT" | "FIXED_OFF";
  discountValue: number | null;
};

/** ISO → ค่าแบบ `datetime-local` ตามเวลาเครื่อง (ค่าของ `DateTimePicker`) */
function toLocalInput(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function emptyForm(): Form {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 0, 0);
  return {
    name: "",
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    scopeType: "LISTINGS",
    scopeIds: [],
    discountType: "PERCENT",
    discountValue: 10,
  };
}

/** หน้า /seller/sales/new และ /seller/sales/:id/edit (Figma SAL-S2) */
export function SellerSaleFormContent({ id }: { id: number }) {
  useLanguage();
  const existing = useSellerSale(id);
  const listings = useSaleableListings();
  if ((id > 0 && existing.isPending) || listings.isPending) {
    return <p className="p-8 text-sm text-muted-foreground">กำลังโหลด...</p>;
  }
  if ((id > 0 && existing.isError) || listings.isError) {
    return (
      <p role="alert" className="p-8 text-sm text-destructive">
        {sellerSaleErrorMessage(existing.error ?? listings.error, translate("โหลดข้อมูลไม่สำเร็จ", "Unable to load data"))}{" "}
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={() => {
            void existing.refetch();
            void listings.refetch();
          }}
        >
          {translate("ลองอีกครั้ง", "Try again")}</Button>
      </p>
    );
  }
  return <SellerSaleEditor key={id || "new"} existing={existing.data} listings={listings.data ?? []} />;
}

function SellerSaleEditor({ existing, listings }: { existing?: SellerSaleDetail; listings: SellerListingSummary[] }) {
  useLanguage();
  const navigate = useNavigate();
  const save = useSaveSellerSale();
  const profile = useSellerProfile();
  const verified = profile.data?.status === "VERIFIED";
  const platform = usePlatformListings();
  const categories = useCategoryList();

  const [form, setForm] = useState<Form>(() =>
    existing
      ? {
          name: existing.name,
          startsAt: existing.startsAt,
          endsAt: existing.endsAt,
          scopeType: existing.scopeType,
          scopeIds: existing.scopeIds,
          discountType: existing.discountType === "FIXED_OFF" ? "FIXED_OFF" : "PERCENT",
          discountValue: existing.discountType === "FIXED_PRICE" ? 10 : existing.discountValue,
        }
      : emptyForm(),
  );
  const [rows, setRows] = useState<SaleRowDraft[]>(() => {
    const items = new Map((existing?.items ?? []).map((item) => [item.listingId, item.salePrice]));
    return listings.map((listing) => ({
      listingId: listing.id,
      price: listing.price,
      selected: items.has(listing.id),
      salePrice: items.get(listing.id) ?? null,
    }));
  });
  const [bulkPercent, setBulkPercent] = useState<number | null>(20);
  const [q, setQ] = useState("");
  const [focusId, setFocusId] = useState<number | null>(null);
  const [overlap, setOverlap] = useState<{ ids: Set<number>; saleName?: string }>({ ids: new Set() });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const blocker = useBlocker(dirty && !saved);

  useEffect(() => {
    if (!dirty || saved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saved]);

  const byId = useMemo(() => new Map(listings.map((listing) => [listing.id, listing])), [listings]);
  const platformById = useMemo(
    () => new Map((platform.data ?? []).map((item) => [item.listingId, item])),
    [platform.data],
  );

  const change = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value, ...(key === "scopeType" ? { scopeIds: [] } : {}) }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
    setDirty(true);
  };
  const updateRows = (next: (rows: SaleRowDraft[]) => SaleRowDraft[]) => {
    setRows(next);
    setDirty(true);
  };

  const listingMode = form.scopeType === "LISTINGS";
  const selectedRows = rows.filter((row) => row.selected);
  const errors = listingMode ? rowErrors(rows, overlap.ids) : new Map();
  const needle = q.trim().toLowerCase();
  const visibleRows = rows.filter((row) => {
    if (!needle) return true;
    const listing = byId.get(row.listingId);
    return `${listing?.card.productName} ${listing?.card.variantLabel}`.toLowerCase().includes(needle);
  });
  const selectable = (row: SaleRowDraft) => !byId.get(row.listingId)?.inAuction;
  const allVisibleSelected = visibleRows.filter(selectable).every((row) => row.selected) && visibleRows.some(selectable);

  const sample = (() => {
    const row =
      (focusId != null ? selectedRows.find((item) => item.listingId === focusId) : undefined) ??
      selectedRows.find((item) => !errors.has(item.listingId)) ??
      selectedRows[0];
    if (!row || row.salePrice == null || row.salePrice >= row.price) return null;
    return { row, listing: byId.get(row.listingId), ...sellerTakeHome(row.price, row.salePrice, SAMPLE_SELLER_COMMISSION) };
  })();

  const validateForm = () => {
    const next: Partial<Record<keyof Form, string>> = {};
    if (!form.name.trim()) next.name = "กรุณากรอกชื่อ";
    if (Date.parse(form.endsAt) <= Date.parse(form.startsAt)) next.endsAt = translate("วันสิ้นสุดต้องหลังวันเริ่ม", "End date must be after the start date");
    if (!listingMode) {
      const value = form.discountValue;
      if (value == null) next.discountValue = translate("กรอกส่วนลด", "Enter discount");
      else if (form.discountType === "PERCENT" && (value < 1 || value > 90)) next.discountValue = translate("เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90", "Percentage must be between 1 and 90");
      else if (form.discountType === "FIXED_OFF" && value <= 0) next.discountValue = translate("ต้องมากกว่า ฿0", "Must be greater than ฿0");
      if (form.scopeType === "CATEGORY" && form.scopeIds.length === 0) next.scopeIds = "เลือกหมวดอย่างน้อยหนึ่งหมวด";
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const rowsToFix = errors.size;
  const nothingSelected = listingMode && selectedRows.length === 0;
  const canSave = verified && !save.isPending && rowsToFix === 0 && !nothingSelected;

  const payload: SellerSaleInput = {
    name: form.name.trim(),
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    scopeType: form.scopeType,
    scopeIds: form.scopeType === "CATEGORY" ? form.scopeIds : [],
    discountType: listingMode ? "FIXED_PRICE" : form.discountType,
    discountValue: listingMode ? null : form.discountValue,
    items: listingMode
      ? selectedRows.map((row) => ({ listingId: row.listingId, salePrice: row.salePrice as number }))
      : null,
  };

  const submit = () => {
    if (!validateForm() || !canSave) return;
    save.mutate(
      { id: existing?.id, input: payload },
      {
        onSuccess: (sale) => {
          flushSync(() => setSaved(true));
          toast.add({ title: existing ? "บันทึกการลดราคาแล้ว" : `ตั้งการลดราคา “${sale.name}” แล้ว`, type: "success" });
          navigate("/seller/promotions?tab=sales");
        },
        onError: (error) => {
          if (hasErrorCode(error, "SALE_OVERLAP") && isApiError(error)) {
            const ids = Array.isArray(error.details.listingIds) ? (error.details.listingIds as number[]) : [];
            const saleName = typeof error.details.saleName === "string" ? error.details.saleName : undefined;
            setOverlap({ ids: new Set(ids), saleName });
            document.querySelector(`[data-row="${ids[0]}"]`)?.scrollIntoView?.({ behavior: "smooth", block: "center" });
            return;
          }
          toast.add({ title: translate("บันทึกไม่สำเร็จ", "Unable to save"), description: sellerSaleErrorMessage(error, translate("กรุณาลองอีกครั้ง", "Please try again")), type: "error" });
        },
      },
    );
  };

  const summary = [
    listingMode
      ? `${selectedRows.length} listing${percentRange(rows) ? ` · ลด ${percentRange(rows)}` : ""}`
      : form.scopeType === "SHOP"
        ? `ทุกสินค้าในร้าน · ${form.discountType === "PERCENT" ? `ลด ${form.discountValue ?? 0}%` : `ลด ${formatSaleBaht(form.discountValue)}/ชิ้น`}`
        : `${form.scopeIds.length} หมวด · ${form.discountType === "PERCENT" ? `ลด ${form.discountValue ?? 0}%` : `ลด ${formatSaleBaht(form.discountValue)}/ชิ้น`}`,
    salePeriod(form),
    ...(rowsToFix > 0 ? [`แก้ ${rowsToFix} แถวก่อนบันทึก`] : []),
    listingMode
      ? `ระหว่างนี้ขึ้นราคา ${selectedRows.length} listing นี้ไม่ได้`
      : "ระหว่างนี้ขึ้นราคา listing ที่เข้าร่วมไม่ได้",
  ];

  return (
    <main className={cn("grid w-full min-w-0 content-start gap-5", PROMOTION_PAGE_CONTROLS)}>
      <div className="grid gap-3">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/seller/promotions" />}>{translate("โปรโมชั่นของร้าน", "Shop promotions")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/seller/promotions?tab=sales" />}>{translate("ลดราคาสินค้า", "Product discounts")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{existing ? "แก้ไขการลดราคา" : "สร้างการลดราคา"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header>
          <h1 className="text-2xl font-extrabold">{translate("ลดราคาสินค้า", "Product discounts")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">ร้านออกส่วนลดเอง · คอมมิชชั่นคิดจากราคาที่ลดแล้ว</p>
        </header>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid min-w-0 gap-4">
          <Section title="1. ข้อมูลการลดราคา">
            <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
              <FormField field="name" htmlFor="seller-sale-name" label="ชื่อ (ผู้ซื้อไม่เห็น)" required error={formErrors.name}>
                <Input
                  id="seller-sale-name"
                  aria-label="ชื่อการลดราคา"
                  value={form.name}
                  maxLength={80}
                  placeholder="Charizard week"
                  onChange={(event) => change("name", event.target.value)}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField field="startsAt" htmlFor="seller-sale-start" label={translate("เริ่ม", "Start")} required>
                  <DateTimePicker
                    id="seller-sale-start"
                    aria-label={translate("เริ่ม", "Start")}
                    value={toLocalInput(form.startsAt)}
                    disabled={!!existing && existing.status !== "SCHEDULED"}
                    onChange={(value) => value && change("startsAt", new Date(value).toISOString())}
                  />
                </FormField>
                <FormField field="endsAt" htmlFor="seller-sale-end" label={translate("สิ้นสุด", "Ended")} required error={formErrors.endsAt}>
                  <DateTimePicker
                    id="seller-sale-end"
                    aria-label={translate("สิ้นสุด", "Ended")}
                    invalid={!!formErrors.endsAt}
                    defaultTime="23:59"
                    min={toLocalInput(form.startsAt)}
                    value={toLocalInput(form.endsAt)}
                    onChange={(value) => value && change("endsAt", new Date(value).toISOString())}
                  />
                </FormField>
              </div>
            </div>
          </Section>

          <Section title="2. สินค้าที่ลด">
            <Segmented
              label="สินค้าที่ลด"
              value={form.scopeType}
              onChange={(value) => change("scopeType", value)}
              options={[
                { value: "SHOP", label: translate("ทุกสินค้าในร้าน", "All products in the shop") },
                { value: "CATEGORY", label: translate("หมวดหมู่", "Category") },
                { value: "LISTINGS", label: translate("เลือก listing", "Select listing") },
              ]}
            />

            {!listingMode ? (
              <>
                {form.scopeType === "CATEGORY" ? (
                  <ChipPicker
                    options={(categories.data ?? []).map((category) => ({ id: category.id, label: category.name }))}
                    selected={form.scopeIds}
                    onChange={(ids) => change("scopeIds", ids)}
                    addLabel="เพิ่มหมวดหมู่"
                    loading={categories.isPending}
                    error={formErrors.scopeIds}
                  />
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField field="discountType" label={translate("ประเภทส่วนลด", "Discount type")}>
                    <Segmented
                      label={translate("ประเภทส่วนลด", "Discount type")}
                      value={form.discountType}
                      onChange={(value) => change("discountType", value)}
                      options={[
                        { value: "PERCENT", label: translate("ลดเป็น %", "Percentage discount") },
                        { value: "FIXED_OFF", label: translate("ลดเป็นบาทต่อชิ้น", "Fixed discount per item") },
                      ]}
                    />
                  </FormField>
                  <FormField
                    field="discountValue"
                    htmlFor="seller-sale-value"
                    label={translate("ลด", "Discount")}
                    required
                    hint={form.discountType === "PERCENT" ? "1–90% · ไม่รวมสินค้าประมูล" : translate("บาทต่อชิ้น · ราคาลดไม่ต่ำกว่า ฿1", "baht per item · discounted price cannot be below ฿1")}
                    error={formErrors.discountValue}
                  >
                    <InputGroup>
                      <InputGroupInput
                        id="seller-sale-value"
                        aria-label={translate("ส่วนลด", "Discount")}
                        type="number"
                        min={1}
                        value={form.discountValue ?? ""}
                        onChange={(event) => change("discountValue", event.target.value === "" ? null : Number(event.target.value))}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>{form.discountType === "PERCENT" ? "%" : "฿"}</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormField>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <InputGroup className="max-w-[260px] flex-1">
                    <InputGroupAddon>
                      <Search aria-hidden />
                    </InputGroupAddon>
                    <InputGroupInput
                      aria-label="ค้นหา listing ในร้าน"
                      placeholder="ค้นหา listing ในร้าน"
                      value={q}
                      onChange={(event) => setQ(event.target.value)}
                    />
                  </InputGroup>
                  <Field orientation="horizontal" className="w-auto gap-2">
                    <FieldLabel htmlFor="sale-bulk-percent" className="text-[13px] font-normal whitespace-nowrap">
                      ตั้งทุกแถวที่เลือก:
                    </FieldLabel>
                    <InputGroup className="w-[90px]">
                      <InputGroupInput
                        id="sale-bulk-percent"
                        aria-label="เปอร์เซ็นต์ที่ลดทุกแถวที่เลือก"
                        type="number"
                        min={1}
                        max={90}
                        value={bulkPercent ?? ""}
                        onChange={(event) => setBulkPercent(event.target.value === "" ? null : Number(event.target.value))}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>%</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </Field>
                  <Button
                    variant="outline"
                    disabled={bulkPercent == null || bulkPercent < 1 || bulkPercent > 90 || selectedRows.length === 0}
                    onClick={() => updateRows((current) => applyBulkPercent(current, bulkPercent ?? 0))}
                  >
                    ใช้กับที่เลือก
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[580px] table-fixed text-[13px]">
                    <thead className="bg-muted text-xs text-muted-foreground">
                      <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-medium">
                        <th className="w-10">
                          <Checkbox
                            aria-label="เลือกทั้งหมด"
                            checked={allVisibleSelected}
                            onCheckedChange={(checked) => {
                              const ids = new Set(visibleRows.filter(selectable).map((row) => row.listingId));
                              updateRows((current) =>
                                current.map((row) => (ids.has(row.listingId) ? { ...row, selected: checked === true } : row)),
                              );
                            }}
                          />
                        </th>
                        <th>Listing</th>
                        <th className="w-[72px] whitespace-nowrap">{translate("คงเหลือ", "Remaining")}</th>
                        <th className="w-24">{translate("ราคาปัจจุบัน", "Current price")}</th>
                        <th className="w-32">ราคาลด</th>
                        <th className="w-16">{translate("ลด", "Discount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row) => (
                        <ListingRow
                          key={row.listingId}
                          row={row}
                          listing={byId.get(row.listingId)}
                          error={errors.get(row.listingId)}
                          overlapName={overlap.saleName}
                          platformSale={platformById.get(row.listingId)}
                          onFocus={() => setFocusId(row.listingId)}
                          onChange={(next) => {
                            if (overlap.ids.has(row.listingId) && !next.selected) {
                              setOverlap((current) => {
                                const ids = new Set(current.ids);
                                ids.delete(row.listingId);
                                return { ...current, ids };
                              });
                            }
                            updateRows((current) => current.map((item) => (item.listingId === row.listingId ? next : item)));
                          }}
                        />
                      ))}
                      {visibleRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground">
                            {rows.length === 0 ? "ยังไม่มี listing ที่เปิดขาย" : "ไม่พบ listing ที่ค้นหา"}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  เลือกแล้ว {selectedRows.length} {" " + translate("จาก", "of") + " "}{rows.length} listing · listing ประมูลเลือกไม่ได้
                </p>
              </>
            )}
          </Section>
        </div>

        <aside className="grid min-w-0 gap-4 lg:sticky lg:top-4">
          {sample ? (
            <Card className="gap-2 rounded-xl border border-border p-5 shadow-none ring-0">
              <h2 className="text-[13px] font-semibold">ผู้ซื้อเห็น</h2>
              <PriceTag
                size="lg"
                pricing={{
                  listPrice: sample.price,
                  salePrice: sample.salePrice,
                  discountPercent: rowPercent(sample.price, sample.salePrice),
                  sale: { id: 0, slug: null, name: form.name, type: "SHOP_SALE", endsAt: form.endsAt, quotaLeft: null, perBuyerLimit: null },
                }}
              />
            </Card>
          ) : null}
          {sample ? (
            <Card className="gap-0 rounded-xl border border-border p-5 shadow-none ring-0">
              <h2 className="text-[13px] font-semibold">
                {translate("ตัวอย่าง:", "Example:") + " "}{sample.listing?.card.productName ?? "listing"} (คอมมิชชั่น {SAMPLE_SELLER_COMMISSION * 100}%)
              </h2>
              <dl className="mt-3 grid gap-2 text-xs [&>div]:flex [&>div]:justify-between [&_dt]:text-muted-foreground [&_dd]:font-semibold">
                <div>
                  <dt>{translate("ราคาปัจจุบัน", "Current price")}</dt>
                  <dd>{formatSaleBaht(sample.price)}</dd>
                </div>
                <div>
                  <dt>ราคาลด</dt>
                  <dd className="text-[#dc2626]">{formatSaleBaht(sample.salePrice)}</dd>
                </div>
                <div>
                  <dt>คอมมิชชั่น (จากราคาลด)</dt>
                  <dd className="text-muted-foreground">{formatSaleBaht(sample.commission)}</dd>
                </div>
                <div>
                  <dt>คุณได้</dt>
                  <dd className="text-[#007a4a]">{formatSaleBaht(sample.net)}</dd>
                </div>
                <div>
                  <dt>{translate("ส่วนลดที่ร้านออก", "Shop-funded discount")}</dt>
                  <dd className="text-[#c2410c]">{formatSaleBaht(sample.shopDiscount)}</dd>
                </div>
              </dl>
            </Card>
          ) : null}
          <Card className="gap-2 rounded-xl border border-border p-5 shadow-none ring-0">
            <h2 className="text-[13px] font-semibold">{translate("สรุป", "Summary")}</h2>
            <ul className="grid gap-0.5 text-xs">
              {summary.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" disabled={save.isPending} onClick={() => navigate("/seller/promotions?tab=sales")}>
              {translate("ยกเลิก", "Cancel")}</Button>
            <Button disabled={!canSave} onClick={submit}>
              {rowsToFix > 0 ? `บันทึก (แก้ ${rowsToFix} แถวก่อน)` : translate("บันทึก", "Save")}
            </Button>
          </div>
          {!verified ? <p className="text-xs text-destructive">ร้านต้องผ่านการยืนยันก่อนจึงลดราคาสินค้าได้</p> : null}
          {nothingSelected ? <p className="text-xs text-muted-foreground">เลือก listing อย่างน้อย 1 รายการ</p> : null}
        </aside>
      </div>

      <PromotionDialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => !open && blocker.reset?.()}
        tone="warning"
        icon={<LogOut />}
        title={translate("ทิ้งการแก้ไข?", "Discard changes?")}
        description="การลดราคายังไม่ได้บันทึก ถ้าออกตอนนี้ข้อมูลจะหายทั้งหมด"
        actions={
          <>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              {translate("อยู่ต่อ", "Stay")}</Button>
            <Button className={PROMOTION_DANGER_BUTTON} onClick={() => blocker.proceed?.()}>
              {translate("ทิ้งการแก้ไข", "Discard changes")}</Button>
          </>
        }
      />
    </main>
  );
}

function ListingRow({
  row,
  listing,
  error,
  overlapName,
  platformSale,
  onChange,
  onFocus,
}: {
  row: SaleRowDraft;
  listing?: SellerListingSummary;
  error?: string;
  overlapName?: string;
  platformSale?: { saleName: string; salePrice: number };
  onChange: (row: SaleRowDraft) => void;
  onFocus: () => void;
}) {
  useLanguage();
  const auction = !!listing?.inAuction;
  const percent = rowPercent(row.price, row.salePrice);
  const overlap = error === "overlap";
  const message =
    error === "overlap"
      ? `อยู่ในการลดราคา${overlapName ? ` “${overlapName}”` : "อื่น"} ช่วงเดียวกัน → SALE_OVERLAP เอาออกจากอันเดิมก่อน`
      : error
        ? ROW_ERROR_MESSAGE[error as keyof typeof ROW_ERROR_MESSAGE]
        : null;
  const buyerSees =
    platformSale && row.selected && row.salePrice != null
      ? Math.min(platformSale.salePrice, row.salePrice)
      : null;
  const name = listing?.card.productName ?? `#${row.listingId}`;
  const detail = listing ? [CONDITION_LABEL[listing.condition], listing.card.variantLabel].filter(Boolean).join(" · ") : "";

  return (
    <>
      <tr
        data-row={row.listingId}
        aria-invalid={!!error || undefined}
        className={cn(
          "border-t [&>td]:px-3 [&>td]:py-2.5",
          overlap && "bg-[#fdf2f2]",
          (auction || !row.selected) && "[&_.name]:text-muted-foreground",
          message || platformSale ? "[&>td]:pb-1" : "",
        )}
      >
        <td>
          <Checkbox
            aria-label={`เลือก ${name}`}
            checked={row.selected}
            disabled={auction}
            onCheckedChange={(checked) => onChange({ ...row, selected: checked === true })}
          />
        </td>
        <td>
          <p className="name truncate font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{auction ? "อยู่ในการประมูล — เลือกไม่ได้" : detail}</p>
        </td>
        <td>{listing?.quantityAvailable ?? "—"}</td>
        <td>{formatSaleBaht(row.price)}</td>
        <td>
          <InputGroup className={cn("h-9", error && error !== "overlap" && "border-destructive")}>
            <InputGroupAddon>
              <InputGroupText>฿</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              aria-label={`ราคาลด ${name}`}
              aria-invalid={!!error || undefined}
              type="number"
              min={1}
              className="font-semibold"
              disabled={!row.selected}
              placeholder="—"
              value={row.selected && row.salePrice != null ? row.salePrice : ""}
              onFocus={onFocus}
              onChange={(event) =>
                onChange({ ...row, salePrice: event.target.value === "" ? null : Number(event.target.value) })
              }
            />
          </InputGroup>
        </td>
        <td className={cn("font-semibold", percent != null ? "text-[#dc2626]" : "text-muted-foreground")}>
          {row.selected && percent != null ? `-${percent}%` : "—"}
        </td>
      </tr>
      {message || (platformSale && row.selected) ? (
        <tr className={cn(overlap && "bg-[#fdf2f2]")}>
          <td />
          <td colSpan={5} className="px-3 pb-2.5 text-[11px]">
            {message ? (
              <p className="flex items-center gap-1 text-[#dc2626]">
                <TriangleAlert className="size-3 shrink-0" aria-hidden />
                {message}
              </p>
            ) : null}
            {platformSale && row.selected && buyerSees != null ? (
              <p className="flex items-center gap-1 text-[#0058bc]">
                <Info className="size-3 shrink-0" aria-hidden />
                อยู่ในแคมเปญ {platformSale.saleName} ({formatSaleBaht(platformSale.salePrice)}) ·{" "}
                {(row.salePrice ?? Infinity) < platformSale.salePrice ? "ราคาของคุณต่ำกว่า" : "ราคาแคมเปญต่ำกว่า"} → ผู้ซื้อเห็น{" "}
                {formatSaleBaht(buyerSees)}
              </p>
            ) : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  useLanguage();
  return (
    <Card className="gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {children}
    </Card>
  );
}
