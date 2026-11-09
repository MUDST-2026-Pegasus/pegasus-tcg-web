import type { ComponentProps } from "react";
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
import { DateTimePicker, DataTable, type DataTableColumn } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { toast } from "@/components/ui/toast";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { FormField } from "@/features/promotions/shared/PromotionFormControls";
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
  const existing = useSellerSale(id);
  const listings = useSaleableListings();
  if ((id > 0 && existing.isPending) || listings.isPending) {
    return <p className="p-8 text-sm text-muted-foreground">กำลังโหลด...</p>;
  }
  if ((id > 0 && existing.isError) || listings.isError) {
    return (
      <p role="alert" className="p-8 text-sm text-destructive">
        {sellerSaleErrorMessage(existing.error ?? listings.error, "โหลดข้อมูลไม่สำเร็จ")}{" "}
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={() => {
            void existing.refetch();
            void listings.refetch();
          }}
        >
          ลองอีกครั้ง
        </Button>
      </p>
    );
  }
  return <SellerSaleEditor key={id || "new"} existing={existing.data} listings={listings.data ?? []} />;
}

function SellerSaleEditor({ existing, listings }: { existing?: SellerSaleDetail; listings: SellerListingSummary[] }) {
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
    if (Date.parse(form.endsAt) <= Date.parse(form.startsAt)) next.endsAt = "วันสิ้นสุดต้องหลังวันเริ่ม";
    if (!listingMode) {
      const value = form.discountValue;
      if (value == null) next.discountValue = "กรอกส่วนลด";
      else if (form.discountType === "PERCENT" && (value < 1 || value > 90)) next.discountValue = "เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90";
      else if (form.discountType === "FIXED_OFF" && value <= 0) next.discountValue = "ต้องมากกว่า ฿0";
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
          toast.add({ title: "บันทึกไม่สำเร็จ", description: sellerSaleErrorMessage(error, "กรุณาลองอีกครั้ง"), type: "error" });
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

  const changeRow = (row: SaleRowDraft, next: SaleRowDraft) => {
    if (overlap.ids.has(row.listingId) && !next.selected) {
      setOverlap((current) => {
        const ids = new Set(current.ids);
        ids.delete(row.listingId);
        return { ...current, ids };
      });
    }
    updateRows((current) => current.map((item) => (item.listingId === row.listingId ? next : item)));
  };
  const notes = (row: SaleRowDraft) => {
    const props = { row, listing: byId.get(row.listingId), error: errors.get(row.listingId), overlapName: overlap.saleName, platformSale: platformById.get(row.listingId) };
    return rowMessage(props) || (props.platformSale && row.selected) ? <ListingRowNotes {...props} /> : null;
  };
  const rowName = (row: SaleRowDraft) => byId.get(row.listingId)?.card.productName ?? `#${row.listingId}`;
  const head = "px-3 py-2.5 text-left font-medium";
  const cell = "px-3 py-2.5";
  const listingColumns: DataTableColumn<SaleRowDraft>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          aria-label="เลือกทั้งหมด"
          checked={allVisibleSelected}
          onCheckedChange={(checked) => {
            const ids = new Set(visibleRows.filter(selectable).map((row) => row.listingId));
            updateRows((current) => current.map((row) => (ids.has(row.listingId) ? { ...row, selected: checked === true } : row)));
          }}
        />
      ),
      meta: { headClassName: cn(head, "w-10"), cellClassName: cell },
      cell: ({ row: { original: row } }) => (
        <Checkbox
          aria-label={`เลือก ${rowName(row)}`}
          checked={row.selected}
          disabled={!!byId.get(row.listingId)?.inAuction}
          onCheckedChange={(checked) => changeRow(row, { ...row, selected: checked === true })}
        />
      ),
    },
    {
      id: "listing",
      header: "Listing",
      meta: { headClassName: head, cellClassName: cell },
      cell: ({ row: { original: row } }) => {
        const listing = byId.get(row.listingId);
        const detail = listing ? [CONDITION_LABEL[listing.condition], listing.card.variantLabel].filter(Boolean).join(" · ") : "";
        return (
          <>
            <p className="name truncate font-semibold">{rowName(row)}</p>
            <p className="truncate text-xs text-muted-foreground">{listing?.inAuction ? "อยู่ในการประมูล — เลือกไม่ได้" : detail}</p>
          </>
        );
      },
    },
    { id: "stock", header: "คงเหลือ", meta: { headClassName: cn(head, "w-[72px] whitespace-nowrap"), cellClassName: cell }, cell: ({ row }) => byId.get(row.original.listingId)?.quantityAvailable ?? "—" },
    { id: "price", header: "ราคาปัจจุบัน", meta: { headClassName: cn(head, "w-24"), cellClassName: cell }, cell: ({ row }) => formatSaleBaht(row.original.price) },
    {
      id: "salePrice",
      header: "ราคาลด",
      meta: { headClassName: cn(head, "w-32"), cellClassName: cell },
      cell: ({ row: { original: row } }) => {
        const error = errors.get(row.listingId);
        return (
          <InputGroup className={cn("h-9", error && error !== "overlap" && "border-destructive")}>
            <InputGroupAddon>
              <InputGroupText>฿</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              aria-label={`ราคาลด ${rowName(row)}`}
              aria-invalid={!!error || undefined}
              type="number"
              min={1}
              className="font-semibold"
              disabled={!row.selected}
              placeholder="—"
              value={row.selected && row.salePrice != null ? row.salePrice : ""}
              onFocus={() => setFocusId(row.listingId)}
              onChange={(event) => changeRow(row, { ...row, salePrice: event.target.value === "" ? null : Number(event.target.value) })}
            />
          </InputGroup>
        );
      },
    },
    {
      id: "percent",
      header: "ลด",
      meta: { headClassName: cn(head, "w-16"), cellClassName: cell },
      cell: ({ row: { original: row } }) => {
        const percent = rowPercent(row.price, row.salePrice);
        return <span className={cn("font-semibold", percent != null ? "text-[#dc2626]" : "text-muted-foreground")}>{row.selected && percent != null ? `-${percent}%` : "—"}</span>;
      },
    },
  ];

  return (
    <main className={cn("grid w-full min-w-0 content-start gap-5", PROMOTION_PAGE_CONTROLS)}>
      <div className="grid gap-3">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/seller/promotions" />}>โปรโมชั่นของร้าน</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/seller/promotions?tab=sales" />}>ลดราคาสินค้า</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{existing ? "แก้ไขการลดราคา" : "สร้างการลดราคา"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header>
          <h1 className="text-2xl font-extrabold">ลดราคาสินค้า</h1>
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
                <FormField field="startsAt" htmlFor="seller-sale-start" label="เริ่ม" required>
                  <DateTimePicker
                    id="seller-sale-start"
                    aria-label="เริ่ม"
                    value={toLocalInput(form.startsAt)}
                    disabled={!!existing && existing.status !== "SCHEDULED"}
                    onChange={(value) => value && change("startsAt", new Date(value).toISOString())}
                  />
                </FormField>
                <FormField field="endsAt" htmlFor="seller-sale-end" label="สิ้นสุด" required error={formErrors.endsAt}>
                  <DateTimePicker
                    id="seller-sale-end"
                    aria-label="สิ้นสุด"
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
                { value: "SHOP", label: "ทุกสินค้าในร้าน" },
                { value: "CATEGORY", label: "หมวดหมู่" },
                { value: "LISTINGS", label: "เลือก listing" },
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
                  <FormField field="discountType" label="ประเภทส่วนลด">
                    <Segmented
                      label="ประเภทส่วนลด"
                      value={form.discountType}
                      onChange={(value) => change("discountType", value)}
                      options={[
                        { value: "PERCENT", label: "ลดเป็น %" },
                        { value: "FIXED_OFF", label: "ลดเป็นบาทต่อชิ้น" },
                      ]}
                    />
                  </FormField>
                  <FormField
                    field="discountValue"
                    htmlFor="seller-sale-value"
                    label="ลด"
                    required
                    hint={form.discountType === "PERCENT" ? "1–90% · ไม่รวมสินค้าประมูล" : "บาทต่อชิ้น · ราคาลดไม่ต่ำกว่า ฿1"}
                    error={formErrors.discountValue}
                  >
                    <InputGroup>
                      <InputGroupInput
                        id="seller-sale-value"
                        aria-label="ส่วนลด"
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
                  <DataTable
                    columns={listingColumns}
                    data={visibleRows}
                    getRowId={(row) => String(row.listingId)}
                    tableClassName="min-w-[580px] table-fixed text-[13px]"
                    headerRowClassName="bg-muted text-xs text-muted-foreground"
                    emptyMessage={rows.length === 0 ? "ยังไม่มี listing ที่เปิดขาย" : "ไม่พบ listing ที่ค้นหา"}
                    rowProps={(row) => ({ "data-row": row.listingId, "aria-invalid": !!errors.get(row.listingId) || undefined } as ComponentProps<"tr">)}
                    rowClassName={(row) => cn(errors.get(row.listingId) === "overlap" && "bg-[#fdf2f2]", (byId.get(row.listingId)?.inAuction || !row.selected) && "[&_.name]:text-muted-foreground")}
                    expandedRowClassName={(row) => cn(errors.get(row.listingId) === "overlap" && "bg-[#fdf2f2]")}
                    expandedCellClassName="px-3 pb-2.5 pt-0 whitespace-normal"
                    renderExpandedRow={(row) => notes(row)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  เลือกแล้ว {selectedRows.length} จาก {rows.length} listing · listing ประมูลเลือกไม่ได้
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
                ตัวอย่าง: {sample.listing?.card.productName ?? "listing"} (คอมมิชชั่น {SAMPLE_SELLER_COMMISSION * 100}%)
              </h2>
              <dl className="mt-3 grid gap-2 text-xs [&>div]:flex [&>div]:justify-between [&_dt]:text-muted-foreground [&_dd]:font-semibold">
                <div>
                  <dt>ราคาปัจจุบัน</dt>
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
                  <dt>ส่วนลดที่ร้านออก</dt>
                  <dd className="text-[#c2410c]">{formatSaleBaht(sample.shopDiscount)}</dd>
                </div>
              </dl>
            </Card>
          ) : null}
          <Card className="gap-2 rounded-xl border border-border p-5 shadow-none ring-0">
            <h2 className="text-[13px] font-semibold">สรุป</h2>
            <ul className="grid gap-0.5 text-xs">
              {summary.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" disabled={save.isPending} onClick={() => navigate("/seller/promotions?tab=sales")}>
              ยกเลิก
            </Button>
            <Button disabled={!canSave} onClick={submit}>
              {rowsToFix > 0 ? `บันทึก (แก้ ${rowsToFix} แถวก่อน)` : "บันทึก"}
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
        title="ทิ้งการแก้ไข?"
        description="การลดราคายังไม่ได้บันทึก ถ้าออกตอนนี้ข้อมูลจะหายทั้งหมด"
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

type ListingRowProps = { row: SaleRowDraft; listing?: SellerListingSummary; error?: string; overlapName?: string; platformSale?: { saleName: string; salePrice: number } };

function rowMessage({ error, overlapName }: ListingRowProps) {
  if (error === "overlap") return `อยู่ในการลดราคา${overlapName ? ` “${overlapName}”` : "อื่น"} ช่วงเดียวกัน → SALE_OVERLAP เอาออกจากอันเดิมก่อน`;
  return error ? ROW_ERROR_MESSAGE[error as keyof typeof ROW_ERROR_MESSAGE] : null;
}

/** ข้อความใต้แถว: error ของแถว และราคาที่ผู้ซื้อเห็นถ้าอยู่ในแคมเปญ Pegasus ด้วย */
function ListingRowNotes(props: ListingRowProps) {
  const { row, platformSale } = props;
  const message = rowMessage(props);
  if (!message && !(platformSale && row.selected)) return null;
  const buyerSees = platformSale && row.selected && row.salePrice != null ? Math.min(platformSale.salePrice, row.salePrice) : null;
  return (
    <div className="pl-10 text-[11px]">
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
    </div>
  );
}
