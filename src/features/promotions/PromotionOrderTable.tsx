import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PromotionCodeSummary } from "./order.types";

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
  return (
    <Table className="min-w-[850px] text-xs" aria-label="ยอดเงินตามร้าน">
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="h-9">ร้าน</TableHead>
          <TableHead className="h-9 text-right">สินค้า</TableHead>
          <TableHead className="h-9 text-right">โค้ดร้าน</TableHead>
          <TableHead className="h-9 text-right">Pegasus</TableHead>
          <TableHead className="h-9 text-right">ค่าส่ง</TableHead>
          <TableHead className="h-9 text-right">ลูกค้าจ่าย</TableHead>
          <TableHead className="h-9 text-right">คอมฯ</TableHead>
          <TableHead className="h-9 text-right">ร้านได้</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const sellerCodes = row.promotions?.filter((promotion) => promotion.ownerType === "SELLER").map((promotion) => promotion.code) ?? [];
          const platformCodes = row.promotions?.filter((promotion) => promotion.ownerType === "PLATFORM").map((promotion) => promotion.code) ?? [];

          return (
            <TableRow key={row.id} data-promotion-order-row={row.id}>
              <TableCell className="max-w-32 truncate font-medium">{row.sellerName}</TableCell>
              <TableCell className="text-right tabular-nums">{formatAmount(row.itemsSubtotal)}</TableCell>
              <TableCell className="text-right tabular-nums">
                <CodeAmount codes={sellerCodes} amount={row.sellerDiscount} formatAmount={formatAmount} tone="seller" />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <CodeAmount codes={platformCodes} amount={row.platformDiscount} formatAmount={formatAmount} tone="platform" />
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatAmount(row.shippingFee)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatAmount(row.grandTotal)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatAmount(row.commissionAmount)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatAmount(row.sellerNetAmount)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>รวม</TableCell>
          <TableCell className="text-right tabular-nums">{formatAmount(rows.reduce((sum, row) => sum + row.itemsSubtotal, 0))}</TableCell>
          <TableCell className="text-right tabular-nums">{formatAmount(rows.reduce((sum, row) => sum + row.sellerDiscount, 0))}</TableCell>
          <TableCell className="text-right tabular-nums">{formatAmount(rows.reduce((sum, row) => sum + row.platformDiscount, 0))}</TableCell>
          <TableCell className="text-right tabular-nums">{formatAmount(rows.reduce((sum, row) => sum + row.shippingFee, 0))}</TableCell>
          <TableCell className="text-right tabular-nums">{formatAmount(rows.reduce((sum, row) => sum + row.grandTotal, 0))}</TableCell>
          <TableCell className="text-right tabular-nums">{formatAmount(rows.reduce((sum, row) => sum + row.commissionAmount, 0))}</TableCell>
          <TableCell className="text-right tabular-nums">{formatAmount(rows.reduce((sum, row) => sum + row.sellerNetAmount, 0))}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
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
