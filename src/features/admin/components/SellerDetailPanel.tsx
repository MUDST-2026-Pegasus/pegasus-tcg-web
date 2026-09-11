import { File } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  AdminSellerApprovalData,
  SellerApplication,
  SellerApprovalTone,
} from "@/features/admin/admin.types";
import { SellerAvatar } from "@/features/admin/components/SellerAvatar";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<SellerApprovalTone, string> = {
  pending: "bg-[#fdf0dd] text-[#b45309]",
  approved: "bg-[#e3f4ec] text-[#12805c]",
  rejected: "bg-[#fbe9e8] text-[#d0342c]",
  total: "bg-[#eef1f2] text-muted-foreground",
};

type SellerDetailPanelProps = {
  application: SellerApplication;
  documentsTitle: string;
  documentHint: string;
  reviewTitle: string;
  actions: AdminSellerApprovalData["actions"];
};

/** คอลัมน์ขวา — รายละเอียด KYC ของคำขอที่เลือก + แถบปุ่มตัดสินใจ */
export function SellerDetailPanel({
  application,
  documentsTitle,
  documentHint,
  reviewTitle,
  actions,
}: SellerDetailPanelProps) {
  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
      <Card className="gap-5 rounded-xl border border-border p-5 shadow-none ring-0">
        {/* ชื่อผู้สมัคร + สถานะ + ช่องทางติดต่อ */}
        <div className="flex items-center gap-3.5">
          <SellerAvatar
            initials={application.initials}
            accent={application.avatarAccent}
            className="size-[52px]"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-[-0.3px] text-foreground">
                {application.handle}
              </h2>
              <Badge
                className={cn(
                  "h-5 rounded-full px-2 text-[11px] font-medium",
                  STATUS_BADGE[application.statusTone],
                )}
              >
                {application.statusLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {application.contactLine}
            </p>
          </div>
        </div>

        {/* ดีไซน์ใช้เส้นคั่นสั้น 240px ไม่ใช่เต็มความกว้างการ์ด
            ต้องใส่ ! ทับ data-horizontal:w-full ที่ ui/separator บังคับไว้ */}
        <Separator className="w-60! bg-[#eef1f2]" />

        <div className="grid grid-cols-1 gap-y-[18px] sm:grid-cols-2">
          {application.details.map((detail) => (
            <div key={detail.label} className="flex flex-col gap-[5px] pr-4">
              <span className="text-[11px] text-[#9aa5ad]">{detail.label}</span>
              <span className="text-[13px] font-medium text-foreground">
                {detail.value}
              </span>
            </div>
          ))}
        </div>

        {/* เอกสารที่แนบมา */}
        <div className="flex flex-col gap-2.5">
          <p className="text-[13px] font-semibold text-foreground">
            {documentsTitle}
          </p>

          {/* ดีไซน์เป็น 3 คอลัมน์ ใช้ grid แทนความกว้างตายตัว 224px
              เพราะพอมี scrollbar พื้นที่จะหายไป ~15px แล้วตกเหลือ 2 ใบต่อแถว */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {application.documents.map((document) => (
              <button
                key={document.id}
                type="button"
                className="overflow-hidden rounded-[10px] border border-border bg-background text-left transition-colors hover:border-[#0058bc]"
              >
                <span className="flex h-[118px] flex-col items-center justify-center gap-1.5 bg-[#f2f5f6]">
                  <File
                    aria-hidden="true"
                    className="size-[22px] text-[#9aa5ad]"
                  />
                  <span className="text-[10px] text-[#9aa5ad]">
                    {documentHint}
                  </span>
                </span>
                <span className="flex flex-col gap-[3px] px-3 py-2.5">
                  <span className="text-xs font-medium text-foreground">
                    {document.title}
                  </span>
                  <span className="text-[10px] text-[#9aa5ad]">
                    {document.meta}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* แถบสรุปผลตรวจ + ปุ่มตัดสินใจ */}
      <Card className="flex-row flex-wrap items-center gap-3 rounded-xl border border-border px-5 py-4 shadow-none ring-0">
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <p className="text-[13px] font-semibold text-foreground">
            {reviewTitle}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {application.review}
          </p>
        </div>

        <Button variant="outline" className="rounded-md px-2.5">
          {actions.requestMore}
        </Button>
        {/* ดีไซน์ใช้ปุ่มแดงทึบ ต่างจาก variant destructive ของ ui/button ที่เป็นพื้นอ่อน */}
        <Button
          variant="destructive"
          className="rounded-md bg-destructive px-2.5 text-white hover:bg-destructive/90"
        >
          {actions.reject}
        </Button>
        <Button className="rounded-md px-2.5">{actions.approve}</Button>
      </Card>
    </div>
  );
}
