import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminOrdersData } from "@/features/admin/admin.types";
import { OrderKanbanColumn } from "@/features/admin/components/OrderKanbanColumn";

type AdminOrdersContentProps = {
  data: AdminOrdersData;
};

export function AdminOrdersContent({ data }: AdminOrdersContentProps) {
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

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-md px-2.5">
            {data.actions.exportLabel}
          </Button>
          <Button className="rounded-md px-2.5">
            {data.actions.disputeLabel}
          </Button>
        </div>
      </div>

      {/* แถบเตือนสีพีช — โทนเดียวกับ badge "รอชำระเงิน" */}
      <div className="flex items-start gap-4 rounded-[10px] bg-[#fdf0dd] px-4 py-3.5 text-[#b45309]">
        <Clock aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
        <div className="flex flex-col gap-0.5 text-xs">
          <p className="font-medium">{data.notice.title}</p>
          <p className="text-[#b45309]/85">{data.notice.description}</p>
        </div>
      </div>

      {/* Kanban 5 คอลัมน์ — ใช้ grid ให้ขนาดยืดตามความกว้างที่เหลือ
          บนจอเล็กพับเป็น 2 คอลัมน์เพื่อให้ยังอ่านได้ */}
      <div className="grid grid-cols-1 items-start gap-[14.8px] sm:grid-cols-2 xl:grid-cols-5">
        {data.columns.map((column) => (
          <OrderKanbanColumn
            key={column.id}
            column={column}
            moreLabel={data.moreLabel}
          />
        ))}
      </div>
    </div>
  );
}
