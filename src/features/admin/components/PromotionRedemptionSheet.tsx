import { Link } from "react-router-dom";

import { EmptyState, ErrorState } from "@/components/common";
import { TableSkeleton } from "@/components/common/PageSkeletons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import {
  discountCapLabel,
  discountLabel,
  formatBaht,
  formatPeriod,
  limitLabel,
  maskBuyer,
  minSpendLabel,
} from "../promotions.format";
import { PromotionPagination } from "@/features/promotions/PromotionPagination";

import { usePromotion, useRedemptions } from "../promotions.queries";
import { PromotionStatusPill, RedemptionStatusPill } from "./PromotionBadges";

type PromotionRedemptionSheetProps = {
  /** 0 = ปิด */
  promotionId: number;
  page: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
};

/** Sheet การใช้โค้ด (Figma PRM-A3 D) — เปิดจาก `?promo=ID` reload แล้วยังอยู่ */
export function PromotionRedemptionSheet({ promotionId, page, onPageChange, onClose }: PromotionRedemptionSheetProps) {
  const promotion = usePromotion(promotionId);
  const redemptions = useRedemptions(promotionId, page);
  const data = promotion.data;
  const cap = data ? discountCapLabel(data) : "—";
  const totalPages = redemptions.data?.totalPages ?? 0;

  return (
    <Sheet open={promotionId > 0} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-[560px]">
        <SheetHeader className="gap-2 px-6 pt-6 pr-14">
          <div className="flex flex-wrap items-center gap-3">
            <SheetTitle className="text-2xl font-black tracking-wide">{data?.code ?? "การใช้โค้ด"}</SheetTitle>
            {data ? <PromotionStatusPill status={data.status} /> : null}
          </div>
          {data ? (
            <SheetDescription className="text-xs">
              {discountLabel(data)}
              {cap !== "—" ? ` ${cap}` : ""} · {minSpendLabel(data.minSpend)} · {formatPeriod(data.startsAt, data.endsAt)}
              {data.createdBy ? ` · สร้างโดย ${maskBuyer(data.createdBy)}` : ""}
            </SheetDescription>
          ) : null}
        </SheetHeader>

        {data ? (
          <div className="grid grid-cols-1 gap-3 px-6 pt-4 sm:grid-cols-3">
            <Metric
              label="ใช้ไปแล้ว"
              value={`${data.usedCount.toLocaleString("th-TH")} / ${limitLabel(data.usageLimitTotal)}`}
              caption={data.claimable ? `เก็บแล้ว ${data.claimedCount.toLocaleString("th-TH")} / ${limitLabel(data.claimLimit)}` : undefined}
            />
            <Metric
              label={data.ownerType === "PLATFORM" ? "ส่วนลดที่ Pegasus ออก" : "ส่วนลดที่ร้านออก"}
              value={formatBaht(data.discountTotal)}
              caption={data.reservedOrders ? `รอชำระอีก ${data.reservedOrders.toLocaleString("th-TH")} ออเดอร์` : undefined}
            />
            <Metric label="ยอดขายจากโค้ดนี้" value={formatBaht(data.salesTotal)} />
          </div>
        ) : null}

        <div className="px-6 pt-5 pb-6">
          {redemptions.isPending ? <TableSkeleton rows={4} columns={4} className="rounded-md" /> : null}
          {redemptions.isError && !redemptions.data ? (
            <ErrorState
              error={redemptions.error}
              title="โหลดการใช้โค้ดไม่สำเร็จ"
              onRetry={() => void redemptions.refetch()}
              className="min-h-40"
            />
          ) : null}
          {redemptions.data?.items.length === 0 ? (
            <EmptyState title="ยังไม่มีการใช้โค้ด" className="min-h-40" />
          ) : null}
          {redemptions.data && redemptions.data.items.length > 0 ? (
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 px-0 text-muted-foreground">คำสั่งซื้อ</TableHead>
                  <TableHead className="h-9 text-muted-foreground">ผู้ซื้อ</TableHead>
                  <TableHead className="h-9 text-muted-foreground">ส่วนลด</TableHead>
                  <TableHead className="h-9 text-muted-foreground">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.data.items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="px-0">
                      <Link
                        className="text-primary underline-offset-2 hover:underline"
                        to={`/admin/orders?q=${encodeURIComponent(entry.orderNumber)}`}
                      >
                        {entry.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{maskBuyer(entry.buyer)}</TableCell>
                    <TableCell>{formatBaht(entry.amount)}</TableCell>
                    <TableCell>
                      <RedemptionStatusPill status={entry.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
          <PromotionPagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            label="หน้าการใช้โค้ด"
            className="mt-4"
          />
          <p className="mt-4 text-[11px] leading-4 text-muted-foreground">
            จองไว้ = สร้างออเดอร์แล้วรอชำระ · คืนสิทธิ์ = ออเดอร์หมดเวลาชำระ/ยกเลิกก่อนจ่าย (สิทธิ์กลับเข้าโควตา)
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Metric({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted px-3 py-2.5">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <strong className="mt-1 block truncate text-lg">{value}</strong>
      {caption ? <span className="block text-[11px] text-muted-foreground">{caption}</span> : null}
    </div>
  );
}
