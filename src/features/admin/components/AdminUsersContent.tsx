import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminUsersData } from "@/features/admin/admin.types";
import { UsersTable } from "@/features/admin/components/UsersTable";
import { UsersToolbar } from "@/features/admin/components/UsersToolbar";

type AdminUsersContentProps = {
  data: AdminUsersData;
};

export function AdminUsersContent({ data }: AdminUsersContentProps) {
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
            {data.actions.addAdminLabel}
          </Button>
        </div>
      </div>

      {/* การ์ดเดียวครอบทั้งแถบเครื่องมือ ตาราง และเลขหน้า ตามดีไซน์ */}
      <Card className="gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-none ring-0">
        <UsersToolbar {...data.toolbar} />
        <UsersTable
          users={data.users}
          table={data.table}
          pagination={data.pagination}
        />
      </Card>
    </div>
  );
}
