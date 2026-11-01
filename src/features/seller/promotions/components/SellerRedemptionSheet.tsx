import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RedemptionStatusPill } from "@/features/admin/components/PromotionBadges";
import { useSellerRedemptions } from "../promotions.queries";
import {
  discountLabel, formatPeriod, limitLabel, minSpendLabel, money, maskBuyer,
} from "../promotions.format";
import type { SellerPromotion } from "../promotions.types";
import { SellerPromotionPagination } from "./SellerPromotionPagination";

export function SellerRedemptionSheet({
  promotion, page, onPageChange, onClose,
}: {
  promotion: SellerPromotion | null;
  page: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
}) {
  const redemptions = useSellerRedemptions(promotion?.id ?? null, page);
  return (
    <Sheet open={promotion != null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-[600px]">
        <SheetHeader className="gap-2 px-6 pt-6 pr-14">
          <SheetTitle className="text-2xl font-bold">การใช้โค้ด {promotion?.code}</SheetTitle>
          {promotion && (
            <SheetDescription>
              {discountLabel(promotion)} · {minSpendLabel(promotion.minSpend)} · {formatPeriod(
                promotion.startsAt, promotion.endsAt)}
            </SheetDescription>
          )}
        </SheetHeader>
        {promotion && (
          <div className="grid gap-3 px-6 pt-5 sm:grid-cols-3">
            <Metric label="ใช้แล้ว" value={`${promotion.usedCount} / ${limitLabel(promotion.usageLimitTotal)}`} />
            <Metric label="เก็บแล้ว" value={`${promotion.claimedCount} / ${limitLabel(promotion.claimLimit)}`} />
            <Metric label="ส่วนลดรวม" value={money(promotion.discountTotal)} />
          </div>
        )}
        <div className="min-w-0 flex-1 overflow-x-auto px-6 py-5">
          {redemptions.isPending && <p className="py-6 text-sm text-muted-foreground">กำลังโหลด...</p>}
          {redemptions.isError && (
            <p role="alert" className="py-6 text-sm text-destructive">
              โหลดประวัติไม่สำเร็จ
              <Button variant="link" size="sm" onClick={() => void redemptions.refetch()}>ลองอีกครั้ง</Button>
            </p>
          )}
          {redemptions.data?.items.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">ยังไม่มีการใช้โค้ด</p>
          )}
          {!!redemptions.data?.items.length && (
            <Table>
              <TableHeader><TableRow>
                <TableHead>คำสั่งซื้อ</TableHead><TableHead>ลูกค้า</TableHead>
                <TableHead>ส่วนลด</TableHead><TableHead>สถานะ</TableHead>
              </TableRow></TableHeader>
              <TableBody>{redemptions.data.items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.sellerOrderNumber ? (
                    <Link className="text-primary hover:underline" to={entry.sellerOrderId
                      ? `/seller/orders/${entry.sellerOrderId}`
                      : `/seller/orders?q=${encodeURIComponent(entry.sellerOrderNumber)}`}>
                      {entry.sellerOrderNumber}
                    </Link>
                  ) : "—"}</TableCell>
                  <TableCell>{maskBuyer(entry.buyerDisplayName)}</TableCell>
                  <TableCell>{money(entry.amount)}</TableCell>
                  <TableCell><RedemptionStatusPill status={entry.status} /></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            ชื่อลูกค้าถูกปิดบางส่วน · กดเลขคำสั่งซื้อเพื่อไปหน้ารายละเอียด
          </p>
          <SellerPromotionPagination page={page}
            totalPages={redemptions.data?.totalPages ?? 0}
            onPageChange={onPageChange} label="หน้าประวัติการใช้โค้ด" />
        </div>
        <div className="flex justify-end gap-2 border-t bg-muted px-6 py-4">
          <Button variant="outline" onClick={onClose}>ปิด</Button>
          <Button render={<Link to="/seller/orders" />} nativeButton={false}>ดูคำสั่งซื้อทั้งหมด</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted p-3">
    <span className="block text-xs text-muted-foreground">{label}</span>
    <strong className="text-base">{value}</strong>
  </div>;
}
