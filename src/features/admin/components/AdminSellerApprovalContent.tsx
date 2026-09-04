import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { AdminSellerApprovalData } from "@/features/admin/admin.types";
import { SellerApprovalStats } from "@/features/admin/components/SellerApprovalStats";
import { SellerDetailPanel } from "@/features/admin/components/SellerDetailPanel";
import { SellerQueueList } from "@/features/admin/components/SellerQueueList";

type AdminSellerApprovalContentProps = {
  data: AdminSellerApprovalData;
};

export function AdminSellerApprovalContent({
  data,
}: AdminSellerApprovalContentProps) {
  const [activeId, setActiveId] = useState(data.defaultApplicationId);

  // เผื่อ defaultApplicationId ชี้ไปคำขอที่ไม่มีอยู่จริง จะได้ไม่พังทั้งหน้า
  const activeApplication =
    data.applications.find((application) => application.id === activeId) ??
    data.applications[0];

  // หัวข้อคิวใช้ตัวเลขจากช่อง "รอตรวจสอบ" ด้านบน ไม่ใช่จำนวนการ์ดที่โชว์
  const pendingCount =
    data.stats.find((stat) => stat.tone === "pending")?.value ??
    String(data.applications.length);

  return (
    <div className="flex flex-col gap-6">
      {/* หัวหน้า: ชื่อหน้า + ปุ่มการทำงาน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            {data.title}
          </h1>
          <p className="text-[13px] text-muted-foreground">{data.subtitle}</p>
        </div>

        <Button variant="outline" className="rounded-md px-2.5">
          {data.exportLabel}
        </Button>
      </div>

      <SellerApprovalStats stats={data.stats} />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <SellerQueueList
          queue={data.queue}
          pendingCount={pendingCount}
          applications={data.applications}
          activeId={activeApplication.id}
          onSelect={setActiveId}
        />

        <SellerDetailPanel
          application={activeApplication}
          documentsTitle={data.documentsTitle}
          documentHint={data.documentHint}
          reviewTitle={data.reviewTitle}
          actions={data.actions}
        />
      </div>
    </div>
  );
}
