import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { maskAccountNumber } from "../application.format";
import type { Verification } from "../application.types";

type SubmittedDetailsCardProps = {
  verification: Verification;
};

/** ทวนข้อมูลที่ส่งไป — เลขบัญชีปิดไว้เหลือ 5 หลักท้าย */
export function SubmittedDetailsCard({
  verification,
}: SubmittedDetailsCardProps) {
  const rows = [
    {
      label: "ชื่อ-นามสกุลจริง",
      value: `${verification.legalFirstName} ${verification.legalLastName}`,
    },
    { label: "ธนาคาร", value: verification.bankName },
    {
      label: "เลขที่บัญชี",
      value: maskAccountNumber(verification.bankAccountNumber),
    },
  ];

  return (
    <Card className="gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center gap-2.5">
        <h2 className="text-sm font-semibold text-foreground">ข้อมูลที่ส่งไป</h2>
        {/* backend ยังไม่มี endpoint ให้ผู้สมัครแก้คำขอที่รอตรวจสอบ เปิดใช้เมื่อฝั่งนั้นพร้อม */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="ml-auto h-8 rounded-sm px-2.5"
        >
          ขอแก้ไขข้อมูล
        </Button>
      </div>

      <dl className="flex flex-col gap-3.5">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-3 py-2">
            <dt className="w-37.5 shrink-0 text-[11px] text-muted-foreground/75">
              {label}
            </dt>
            <dd className="min-w-0 flex-1 text-xs font-medium text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
