import { useState } from "react";

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminCardAttributesData } from "@/features/admin/admin.types";
import { CardSchemaPanel } from "@/features/admin/components/CardSchemaPanel";
import { CardSchemaTable } from "@/features/admin/components/CardSchemaTable";

type AdminCardAttributesContentProps = {
  data: AdminCardAttributesData;
};

export function AdminCardAttributesContent({
  data,
}: AdminCardAttributesContentProps) {
  const [activeGameId, setActiveGameId] = useState(data.defaultGameId);

  // เผื่อ defaultGameId ใน fixture ชี้ไปเกมที่ไม่มีอยู่จริง จะได้ไม่พังทั้งหน้า
  const activeGame =
    data.games.find((game) => game.id === activeGameId) ?? data.games[0];

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
            {data.actions.viewJsonLabel}
          </Button>
          <Button className="rounded-md px-2.5">{data.actions.saveLabel}</Button>
        </div>
      </div>

      {/* แถบเตือนผลกระทบของการแก้ schema */}
      <div className="flex items-center gap-2.5 rounded-[10px] bg-[#e8f1fc] px-4 py-3 text-[#0058bc]">
        <Info aria-hidden="true" className="size-6 shrink-0" />
        <p className="text-xs">{data.notice}</p>
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <CardSchemaPanel
          gamePicker={data.gamePicker}
          fieldTypes={data.fieldTypes}
          games={data.games}
          activeGameId={activeGame.id}
          onSelectGame={setActiveGameId}
        />

        <div className="w-full min-w-0 flex-1">
          <CardSchemaTable game={activeGame} table={data.table} />
        </div>
      </div>
    </div>
  );
}
