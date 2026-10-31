import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
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
          {redemptions.isPending ? <p className="py-6 text-sm text-muted-foreground">กำลังโหลด...</p> : null}
          {redemptions.isError ? (
            <p role="alert" className="py-6 text-sm text-destructive">
              โหลดการใช้โค้ดไม่สำเร็จ{" "}
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void redemptions.refetch()}>
                ลองอีกครั้ง
              </Button>
            </p>
          ) : null}
          {redemptions.data?.items.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">ยังไม่มีการใช้โค้ด</p>
          ) : null}
          {redemptions.data && redemptions.data.items.length > 0 ? (
            <table className="promotion-redemption-table">
              <thead>
                <tr>
                  <th scope="col">คำสั่งซื้อ</th>
                  <th scope="col">ผู้ซื้อ</th>
                  <th scope="col">ส่วนลด</th>
                  <th scope="col">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <Link
                        className="text-primary underline-offset-2 hover:underline"
                        to={`/admin/orders?q=${encodeURIComponent(entry.orderNumber)}`}
                      >
                        {entry.orderNumber}
                      </Link>
                    </td>
                    <td>{maskBuyer(entry.buyer)}</td>
                    <td>{formatBaht(entry.amount)}</td>
                    <td>
                      <RedemptionStatusPill status={entry.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                หน้า {page + 1} จาก {totalPages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
                  ก่อนหน้า
                </Button>
                <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>
                  ถัดไป
                </Button>
              </div>
            </div>
          ) : null}
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
