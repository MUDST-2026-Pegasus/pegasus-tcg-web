import { Check } from "lucide-react";

import { Card } from "@/components/ui/card";

import {
  expectedDecisionDate,
  formatApplicationNumber,
  formatThaiDate,
  formatThaiDateTime,
} from "../application.format";
import type { Verification } from "../application.types";

type SubmissionSummaryCardProps = {
  verification: Verification;
};

/** การ์ดบนสุด — เครื่องหมายสำเร็จ หัวข้อ และแถบเลขที่คำขอ / เวลาส่ง / วันที่คาดว่าทราบผล */
export function SubmissionSummaryCard({
  verification,
}: SubmissionSummaryCardProps) {
  const approved = verification.status === "APPROVED";

  const meta = [
    {
      label: "เลขที่คำขอ",
      value: formatApplicationNumber(verification.id, verification.submittedAt),
    },
    { label: "ส่งเมื่อ", value: formatThaiDateTime(verification.submittedAt) },
    approved && verification.reviewedAt
      ? {
          label: "อนุมัติเมื่อ",
          value: formatThaiDateTime(verification.reviewedAt),
        }
      : {
          label: "คาดว่าทราบผล",
          value: `ภายใน ${formatThaiDate(expectedDecisionDate(verification.submittedAt))}`,
        },
  ];

  return (
    <Card className="items-center gap-3.5 rounded-xl border border-border px-7 pt-7.5 pb-6.5 text-center shadow-none ring-0">
      <span className="flex size-14 items-center justify-center rounded-full bg-teal-600/10">
        <span className="flex size-6.5 items-center justify-center">
          <Check aria-hidden className="size-6 text-teal-600" />
        </span>
      </span>

      <h1 className="text-[22px] font-bold text-foreground">
        {approved ? "คำขอของคุณได้รับการอนุมัติแล้ว" : "ส่งคำขอเรียบร้อยแล้ว"}
      </h1>
      <p className="text-xs text-muted-foreground">
        {approved
          ? "ออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้ง เพื่อเริ่มใช้งานหลังบ้านผู้ขาย"
          : "เราได้รับชื่อจริงและบัญชีรับเงินของคุณแล้ว ทีมงานจะตรวจสอบและแจ้งผลทางอีเมลภายใน 1 วันทำการ"}
      </p>

      <dl className="grid w-full gap-3 rounded-lg bg-muted/70 px-4 py-3.5 sm:grid-cols-3 sm:gap-0">
        {meta.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <dt className="text-[10px] text-muted-foreground/75">{label}</dt>
            <dd className="text-xs font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
