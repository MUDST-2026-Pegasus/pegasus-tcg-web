import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { initialsOf } from "../../orders.format";
import type { OrderBuyer } from "../../orders.types";
import { useTranslate } from "@/lib/i18n";

type BuyerCardProps = {
  buyer: OrderBuyer;
  /** จำนวนครั้งที่จ่ายเงินกับร้านนี้ รวมออเดอร์นี้ */
  orderCount: number;
  note: string | null;
};

/** ยังไม่มีแชท — ลิงก์ไปหน้าคอลเลกชันสาธารณะของผู้ซื้อแทน */
export function BuyerCard({ buyer, orderCount, note }: BuyerCardProps) {
  const { t } = useTranslate("seller");
  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-xs font-medium text-gray-500">{t("orderDetail.buyer.title", "ผู้ซื้อ")}</p>

      <div className="flex items-center gap-2.5">
        <Avatar className="size-9">
          {buyer.avatarUrl && <AvatarImage src={buyer.avatarUrl} alt="" />}
          <AvatarFallback className="bg-primary text-sm font-normal text-white">
            {initialsOf(buyer.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <p className="truncate text-xs font-semibold text-foreground">
            {buyer.displayName ?? buyer.username}
          </p>
          <p className="text-[10px] text-gray-400">
            @{buyer.username} ·{" "}
            {orderCount > 1
              ? t("orderDetail.buyer.orderCount", "ซื้อจากร้านคุณ {count} ครั้ง", { count: orderCount })
              : t("orderDetail.buyer.new", "ลูกค้าใหม่ของร้าน")}
          </p>
        </div>
      </div>

      {note ? (
        <p className="rounded-lg bg-neutral-50 p-3 text-xs leading-4 text-gray-700">
          {t("orderDetail.buyer.note", "หมายเหตุจากผู้ซื้อ: {note}", { note })}
        </p>
      ) : null}

      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-md px-2.5"
        render={<Link to={`/u/${buyer.username}`} />}
        nativeButton={false}
      >
        {t("orderDetail.buyer.viewProfile", "ดูโปรไฟล์ผู้ซื้อ")}
      </Button>
    </Card>
  );
}
