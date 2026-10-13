import { Link } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { initialsOf } from "../../orders.format";
import type { OrderBuyer } from "../../orders.types";

type BuyerCardProps = {
  buyer: OrderBuyer;
  /** จำนวนครั้งที่จ่ายเงินกับร้านนี้ รวมออเดอร์นี้ */
  orderCount: number;
  note: string | null;
};

/** ยังไม่มีแชท — ลิงก์ไปหน้าคอลเลกชันสาธารณะของผู้ซื้อแทน */
export function BuyerCard({ buyer, orderCount, note }: BuyerCardProps) {
  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-xs font-medium text-gray-500">ผู้ซื้อ</p>

      <div className="flex items-center gap-2.5">
        <Avatar className="size-9">
          <AvatarFallback className="bg-sky-700 text-sm font-normal text-white">
            {initialsOf(buyer.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <p className="truncate text-xs font-semibold text-zinc-950">
            {buyer.displayName ?? buyer.username}
          </p>
          <p className="text-[10px] text-gray-400">
            @{buyer.username} ·{" "}
            {orderCount > 1 ? `ซื้อจากร้านคุณ ${orderCount} ครั้ง` : "ลูกค้าใหม่ของร้าน"}
          </p>
        </div>
      </div>

      {note ? (
        <p className="rounded-lg bg-neutral-50 p-3 text-xs leading-4 text-gray-700">
          หมายเหตุจากผู้ซื้อ: {note}
        </p>
      ) : null}

      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-md px-2.5"
        render={<Link to={`/users/${buyer.username}`} />}
        nativeButton={false}
      >
        ดูโปรไฟล์ผู้ซื้อ
      </Button>
    </Card>
  );
}
