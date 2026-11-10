import { DataTable, type DataTableColumn } from "@/components/common";
import type { ComponentProps } from "react";

import type { PromotionCodeSummary } from "./order.types";
import { useTranslate } from "@/lib/i18n";

export type PromotionOrderRow = {
  id: number | string;
  sellerName: string;
  itemsSubtotal: number;
  sellerDiscount: number;
  platformDiscount: number;
  shippingFee: number;
  grandTotal: number;
  commissionAmount: number;
  sellerNetAmount: number;
  promotions?: readonly PromotionCodeSummary[] | null;
};

type PromotionOrderTableProps = {
  rows: readonly PromotionOrderRow[];
  formatAmount: (amount: number) => string;
};

/** Per-shop promotion totals for admin order details. */
export function PromotionOrderTable({ rows, formatAmount }: PromotionOrderTableProps) {
  const { t } = useTranslate("promotions");
  const sum = (key: "itemsSubtotal" | "sellerDiscount" | "platformDiscount" | "shippingFee" | "grandTotal" | "commissionAmount" | "sellerNetAmount") =>
    formatAmount(rows.reduce((total, row) => total + row[key], 0));
  const codes = (row: PromotionOrderRow, owner: "SELLER" | "PLATFORM") =>
    row.promotions?.filter((promotion) => promotion.ownerType === owner).map((promotion) => promotion.code) ?? [];
  const money = (cellClassName = "text-right tabular-nums") => ({ headClassName: "h-9 text-right", cellClassName });
  const columns: DataTableColumn<PromotionOrderRow>[] = [
    { id: "seller", header: t("buyer.promotionOrderTable.header", "ร้าน"), meta: { headClassName: "h-9", cellClassName: "max-w-32 truncate" }, cell: ({ row }) => <span className="font-medium">{row.original.sellerName}</span>, footer: () => t("buyer.promotionOrderTable.text", "รวม") },
    { id: "items", header: t("buyer.promotionOrderTable.header2", "สินค้า"), meta: money(), cell: ({ row }) => formatAmount(row.original.itemsSubtotal), footer: () => sum("itemsSubtotal") },
    { id: "sellerCode", header: t("buyer.promotionOrderTable.header3", "โค้ดร้าน"), meta: money(), cell: ({ row }) => <CodeAmount codes={codes(row.original, "SELLER")} amount={row.original.sellerDiscount} formatAmount={formatAmount} tone="seller" />, footer: () => sum("sellerDiscount") },
    { id: "platformCode", header: "Pegasus", meta: money(), cell: ({ row }) => <CodeAmount codes={codes(row.original, "PLATFORM")} amount={row.original.platformDiscount} formatAmount={formatAmount} tone="platform" />, footer: () => sum("platformDiscount") },
    { id: "shipping", header: t("buyer.promotionOrderTable.header4", "ค่าส่ง"), meta: money(), cell: ({ row }) => formatAmount(row.original.shippingFee), footer: () => sum("shippingFee") },
    { id: "total", header: t("buyer.promotionOrderTable.header5", "ลูกค้าจ่าย"), meta: money(), cell: ({ row }) => <span className="font-medium">{formatAmount(row.original.grandTotal)}</span>, footer: () => sum("grandTotal") },
    { id: "commission", header: t("buyer.promotionOrderTable.header6", "คอมฯ"), meta: money(), cell: ({ row }) => formatAmount(row.original.commissionAmount), footer: () => sum("commissionAmount") },
    { id: "net", header: t("buyer.promotionOrderTable.header7", "ร้านได้"), meta: money(), cell: ({ row }) => <span className="font-semibold">{formatAmount(row.original.sellerNetAmount)}</span>, footer: () => sum("sellerNetAmount") },
  ];

  return (
    <DataTable
      columns={columns}
      data={[...rows]}
      getRowId={(row) => String(row.id)}
      aria-label={t("buyer.promotionOrderTable.ariaLabel", "ยอดเงินตามร้าน")}
      tableClassName="min-w-[850px] text-xs"
      headerRowClassName="bg-muted/50 hover:bg-muted/50"
      rowProps={(row) => ({ "data-promotion-order-row": row.id } as ComponentProps<"tr">)}
    />
  );
}

function CodeAmount({
  codes,
  amount,
  formatAmount,
  tone,
}: {
  codes: string[];
  amount: number;
  formatAmount: (amount: number) => string;
  tone: "seller" | "platform";
}) {
  if (amount <= 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={`inline-flex flex-col items-end ${tone === "seller" ? "text-orange-700" : "text-primary"}`}>
      <span className="max-w-28 truncate text-[10px] text-muted-foreground">{codes.join(", ") || "—"}</span>
      <span>− {formatAmount(amount)}</span>
    </span>
  );
}
