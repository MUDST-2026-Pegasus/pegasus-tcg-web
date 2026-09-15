import { Info } from "lucide-react";
import { Link } from "react-router-dom";

import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import type { Verification } from "../application.types";
import { ApplicationProgressCard } from "./ApplicationProgressCard";
import { Callout } from "./Callout";
import { SubmissionSummaryCard } from "./SubmissionSummaryCard";
import { SubmittedDetailsCard } from "./SubmittedDetailsCard";

const PROGRESS_CARD_ID = "seller-application-progress";

type ApplicationStatusViewProps = {
  verification: Verification;
  isRefreshing: boolean;
  onRefresh: () => void;
};

/**
 * แทนที่ฟอร์มเมื่อมีคำขอค้างอยู่ — backend ไม่ให้ส่งซ้ำระหว่างรอตรวจสอบ
 * Figma: V3 · Buyer / ส่งคำขอแล้ว (รอตรวจสอบ) node 1689:6622
 */
export function ApplicationStatusView({
  verification,
  isRefreshing,
  onRefresh,
}: ApplicationStatusViewProps) {
  const handleViewStatus = () => {
    // ดึงสถานะล่าสุดแล้วเลื่อนไปที่การ์ดสถานะ
    onRefresh();
    document
      .getElementById(PROGRESS_CARD_ID)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <SubmissionSummaryCard verification={verification} />
      <SubmittedDetailsCard verification={verification} />
      <ApplicationProgressCard
        id={PROGRESS_CARD_ID}
        verification={verification}
      />

      <Callout tone="info" icon={Info}>
        ถ้าชื่อบัญชีไม่ตรงกับชื่อที่กรอก ทีมงานจะส่งอีเมลให้แก้ไขเฉพาะส่วนนั้น
        ไม่ต้องสมัครใหม่ทั้งหมด
      </Callout>

      <div className="flex flex-wrap justify-center gap-2.5">
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 rounded-sm px-2.5",
          )}
        >
          กลับหน้าแรก
        </Link>
        <Button
          type="button"
          size="sm"
          disabled={isRefreshing}
          onClick={handleViewStatus}
          className="h-8 rounded-sm px-2.5"
        >
          {isRefreshing && <Spinner />}
          ดูสถานะคำขอ
        </Button>
      </div>
    </>
  );
}
