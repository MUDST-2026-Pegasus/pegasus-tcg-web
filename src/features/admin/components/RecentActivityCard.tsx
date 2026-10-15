import { Link } from "react-router-dom";

import { QueryBoundary } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  avatarAccentFor,
  formatThaiDateTime,
  initialsFor,
  legalName,
  VERIFICATION_STATUS_META,
} from "../verification.format";
import { useVerificationQueue } from "../verification.queries";
import { SellerAvatar } from "./SellerAvatar";

const SHOWN = 5;

/**
 * การ์ดฝั่งขวาของหน้าภาพรวม — คำขอเปิดร้านที่ยังไม่มีใครรับตรวจ เก่าสุดก่อน
 *
 * ดีไซน์เดิมเป็น "กิจกรรมล่าสุด" ซึ่งต้องใช้ audit log (ADM-09) ที่ backend ยังไม่มี
 * ระหว่างนี้จึงโชว์สิ่งที่แอดมินต้องจัดการจริงจาก `/admin/verifications`
 * พอ audit log มาแล้วค่อยเปลี่ยนแหล่งข้อมูลของการ์ดนี้
 */
export function RecentActivityCard() {
  const queue = useVerificationQueue("SUBMITTED", 0, SHOWN);
  const badge = VERIFICATION_STATUS_META.SUBMITTED;

  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0 lg:w-[400px]">
      <div className="flex flex-col gap-0.5 px-[18px] pt-[18px] pb-3.5">
        <p className="text-[15px] font-semibold text-foreground">
          คำขอเปิดร้านที่รอตรวจ
        </p>
        <p className="text-xs text-muted-foreground">
          ผู้ขายที่ส่งเอกสารยืนยันตัวตนแล้ว เรียงจากที่รอนานที่สุด
        </p>
      </div>

      <QueryBoundary
        query={queue}
        loading={<ActivitySkeleton />}
        errorTitle="โหลดคำขอเปิดร้านไม่สำเร็จ"
        isEmpty={(page) => page.items.length === 0}
        empty={
          <p className="px-[18px] py-6 text-center text-xs text-muted-foreground">
            ไม่มีคำขอที่รอตรวจ
          </p>
        }
      >
        {(page) => (
          <ul className="flex flex-col">
            {page.items.map((verification) => (
              <li
                key={verification.id}
                className="flex items-start gap-3 border-t border-[#eef1f2] px-[18px] py-3 first:border-t-0"
              >
                <SellerAvatar
                  initials={initialsFor(verification)}
                  accent={avatarAccentFor(verification)}
                  src={verification.sellerAvatarUrl}
                  className="size-7"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-semibold text-foreground">
                      {legalName(verification)}
                    </p>
                    <p className="text-[11px] text-[#9aa5ad]">
                      · {formatThaiDateTime(verification.submittedAt)}
                    </p>
                  </div>
                  <p className="text-xs leading-[17px] text-[#414755]">
                    ส่งเอกสารยืนยันตัวตนเพื่อขอเปิดร้าน
                  </p>
                  <Badge
                    className={cn(
                      "h-5 w-fit rounded-full px-2 text-[11px]",
                      badge.badgeClass,
                    )}
                  >
                    {badge.label}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>

      <div className="px-[18px] pt-3 pb-4">
        <Button
          variant="ghost"
          className="rounded-md px-2.5"
          render={<Link to="/admin/sellers" />}
        >
          ไปที่หน้าอนุมัติผู้ขาย
        </Button>
      </div>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3 px-[18px] py-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-14 rounded-md" />
      ))}
    </div>
  );
}
