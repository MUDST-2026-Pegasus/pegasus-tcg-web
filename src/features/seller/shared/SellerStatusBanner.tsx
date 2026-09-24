import type { UseQueryResult } from "@tanstack/react-query";
import {
  OctagonX,
  Palmtree,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

import { publishBlockedReason } from "./seller.format";
import type { SellerProfile } from "./seller.types";

const TONE_CLASS = {
  danger: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-orange-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
} as const;

type BannerProps = {
  tone: keyof typeof TONE_CLASS;
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

function Banner({ tone, icon: Icon, title, children, action }: BannerProps) {
  return (
    <Alert className={cn("rounded-xl", TONE_CLASS[tone])}>
      <Icon aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="text-xs text-current">
        {children}
      </AlertDescription>
      {action ? <AlertAction>{action}</AlertAction> : null}
    </Alert>
  );
}

type SellerStatusBannerProps = {
  profile: UseQueryResult<SellerProfile>;
};

/**
 * แถบแจ้งสถานะร้านบนสุดของทุกหน้าใต้ `/seller/*`
 * - SUSPENDED → แดง พร้อมเหตุผลจากแอดมิน
 * - สถานะอื่นที่ยังลงขายไม่ได้ → เหลือง บอกว่าต้องทำอะไรต่อ
 * - `vacationMode` → ฟ้า บอกว่าผู้ซื้อไม่เห็นประกาศ
 * ร้านปกติไม่มีแถบอะไรเลย
 */
export function SellerStatusBanner({ profile }: SellerStatusBannerProps) {
  const { data, isError, error, refetch, isRefetching } = profile;
  const banners: ReactNode[] = [];

  if (!data && isError) {
    banners.push(
      <Banner
        key="error"
        tone="warning"
        icon={TriangleAlert}
        title="โหลดสถานะร้านไม่สำเร็จ"
        action={
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={isRefetching}
            onClick={() => void refetch()}
          >
            ลองใหม่
          </Button>
        }
      >
        {getErrorMessage(error, "ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง")}
      </Banner>,
    );
  }

  if (data?.status === "SUSPENDED") {
    banners.push(
      <Banner
        key="suspended"
        tone="danger"
        icon={OctagonX}
        title="ร้านของคุณถูกระงับ"
      >
        {data.suspendedReason ? <>เหตุผล: {data.suspendedReason} · </> : null}
        ประกาศทั้งหมดถูกซ่อนจากผู้ซื้อ
        และลงขายหรือแก้ประกาศไม่ได้จนกว่าแอดมินจะยกเลิกการระงับ
      </Banner>,
    );
  } else if (data && !data.canPublish) {
    banners.push(
      <Banner
        key="unverified"
        tone="warning"
        icon={TriangleAlert}
        title="ยังลงขายไม่ได้"
      >
        {publishBlockedReason(data)}
      </Banner>,
    );
  }

  if (data?.vacationMode) {
    banners.push(
      <Banner
        key="vacation"
        tone="info"
        icon={Palmtree}
        title="โหมดพักร้อนเปิดอยู่"
      >
        ผู้ซื้อจะไม่เห็นประกาศของคุณทุกใบจนกว่าจะปิดโหมดพักร้อน
        สถานะของแต่ละประกาศไม่เปลี่ยน
      </Banner>,
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return <div className="mb-6 flex flex-col gap-3">{banners}</div>;
}
