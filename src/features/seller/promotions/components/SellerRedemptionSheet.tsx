import { Link } from "react-router-dom";
import { ChartColumn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { RedemptionStatusPill } from "@/features/admin/components/PromotionBadges";

import { useSellerRedemptions } from "../promotions.queries";
import { discountLabel, formatPeriod, limitLabel, maskBuyer, minSpendLabel, money } from "../promotions.format";
import type { SellerPromotion } from "../promotions.types";
import { SellerPromotionPagination } from "./SellerPromotionPagination";

/**
 * การใช้โค้ด (Figma PRM-M2 SHEET) — ช่อง "ยอดขาย" ในบอร์ดยังไม่มีข้อมูลจาก backend จึงแสดงสามช่อง
 * เลขคำสั่งซื้อลิงก์ไปหน้ารายละเอียดเมื่อ backend ส่ง `sellerOrderId` ไม่งั้นค้นหาในหน้ารายการคำสั่งซื้อ
 */
export function SellerRedemptionSheet({
  promotion,
  page,
  onPageChange,
  onClose,
}: {
  promotion: SellerPromotion | null;
  page: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
}) {
  const redemptions = useSellerRedemptions(promotion?.id ?? null, page);
  if (!promotion) return null;

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      tone="teal"
      icon={<ChartColumn />}
      title={`การใช้โค้ด ${promotion.code}`}
      description={`${discountLabel(promotion)} · ${minSpendLabel(promotion.minSpend)} · ${formatPeriod(
        promotion.startsAt,
        promotion.endsAt,
      )}`}
      className="sm:max-w-[500px]"
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            ปิด
          </Button>
          <Button render={<Link to="/seller/orders" />} nativeButton={false}>
            ดูคำสั่งซื้อทั้งหมด
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-2">
        <Metric label="ใช้แล้ว" value={`${promotion.usedCount} / ${limitLabel(promotion.usageLimitTotal)}`} />
        <Metric label="เก็บแล้ว" value={`${promotion.claimedCount} / ${limitLabel(promotion.claimLimit)}`} />
        <Metric label="ร้านออกส่วนลด" value={money(promotion.discountTotal)} />
      </div>
      <div className="min-w-0 overflow-x-auto">
        {redemptions.isPending ? <p className="py-6 text-xs text-muted-foreground">กำลังโหลด...</p> : null}
        {redemptions.isError ? (
          <p role="alert" className="py-6 text-xs text-destructive">
            โหลดประวัติไม่สำเร็จ
            <Button variant="link" size="sm" onClick={() => void redemptions.refetch()}>
              ลองอีกครั้ง
            </Button>
          </p>
        ) : null}
        {redemptions.data?.items.length === 0 ? (
          <p className="py-6 text-xs text-muted-foreground">ยังไม่มีการใช้โค้ด</p>
        ) : null}
        {redemptions.data?.items.length ? (
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="h-8 px-0">คำสั่งซื้อ</TableHead>
                <TableHead className="h-8">ลูกค้า</TableHead>
                <TableHead className="h-8">ส่วนลด</TableHead>
                <TableHead className="h-8">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redemptions.data.items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="px-0">
                    {entry.sellerOrderNumber ? (
                      <Link
                        className="text-primary hover:underline"
                        to={
                          entry.sellerOrderId
                            ? `/seller/orders/${entry.sellerOrderId}`
                            : `/seller/orders?q=${encodeURIComponent(entry.sellerOrderNumber)}`
                        }
                      >
                        {entry.sellerOrderNumber}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{maskBuyer(entry.buyerDisplayName)}</TableCell>
                  <TableCell>{money(entry.amount)}</TableCell>
                  <TableCell>
                    <RedemptionStatusPill status={entry.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </div>
      <SellerPromotionPagination
        page={page}
        totalPages={redemptions.data?.totalPages ?? 0}
        onPageChange={onPageChange}
        label="หน้าประวัติการใช้โค้ด"
      />
      <p className="text-[11px] text-muted-foreground">ชื่อลูกค้าถูกปิดบางส่วน · กดเลขคำสั่งซื้อเพื่อไปหน้ารายละเอียด</p>
    </PromotionDialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 rounded-lg bg-muted px-2.5 py-2.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <strong className="text-sm font-bold">{value}</strong>
    </div>
  );
}
