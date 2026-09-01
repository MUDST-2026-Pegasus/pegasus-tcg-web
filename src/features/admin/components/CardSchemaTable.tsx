import { Ellipsis, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdminCardAttributesData,
  CardSchemaGame,
} from "@/features/admin/admin.types";
import { FieldTypeBadge } from "@/features/admin/components/FieldTypeBadge";
import { cn } from "@/lib/utils";

type CardSchemaTableProps = {
  game: CardSchemaGame;
  table: AdminCardAttributesData["table"];
};

/**
 * สวิตช์ในตารางเล็กกว่าไซซ์ sm ของ ui/switch อยู่นิดหน่อย (ดีไซน์ 32×18)
 * เลยบังคับขนาดของตัวรากกับหัวสวิตช์ทับค่าที่มาจาก data-size
 */
const ROW_SWITCH =
  "h-[18px]! w-8! [&_[data-slot=switch-thumb]]:size-3.5! [&_[data-slot=switch-thumb]]:data-checked:translate-x-3.5!";

const HEAD_CLASS = "h-auto py-2 text-[11px] font-medium text-muted-foreground";

/**
 * การ์ดตาราง schema ของเกมที่เลือกอยู่
 *
 * หมายเหตุ: ในดีไซน์ตารางเป็น flex ที่กำหนดความกว้างคอลัมน์ตายตัว
 * ที่นี่ใช้ <table> จริงเพื่อให้ screen reader อ่านหัวคอลัมน์ได้
 * โดยคุมความกว้างผ่าน w-* บน <th> แทน — หน้าตายังเหมือนเดิม
 */
export function CardSchemaTable({ game, table }: CardSchemaTableProps) {
  return (
    <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3.5">
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-semibold text-foreground">
            schema ของ {game.name}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {game.fields.length} ฟิลด์ · ใช้กับการ์ด {game.cardCount} ใบ
          </p>
        </div>

        <Button variant="outline" className="rounded-md px-2.5">
          {table.addFieldLabel}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-y border-[#eef1f2] bg-[#fafbfb] hover:bg-[#fafbfb]">
            <TableHead className={cn(HEAD_CLASS, "w-[260px] pl-5")}>
              {table.columns.name}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[110px]")}>
              {table.columns.type}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[280px]")}>
              {table.columns.sample}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[70px]")}>
              {table.columns.required}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[70px]")}>
              {table.columns.filterable}
            </TableHead>
            {/* คอลัมน์สุดท้ายไม่มีหัวตารางในดีไซน์ และกินพื้นที่ที่เหลือแทน spacer */}
            <TableHead className={cn(HEAD_CLASS, "pr-5")}>
              <span className="sr-only">{table.columns.actions}</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="[&_tr]:border-[#eef1f2]">
          {game.fields.map((field) => (
            <TableRow key={field.id} className="hover:bg-[#fafbfb]">
              <TableCell className="py-3 pl-5">
                <div className="flex items-center gap-2">
                  {/* ที่จับลากเรียงลำดับฟิลด์ — ยังไม่ผูกกับตัวลากจริง */}
                  <GripVertical
                    aria-hidden="true"
                    className="size-6 shrink-0 text-[#9aa5ad]"
                  />
                  <span className="text-[13px] font-medium text-foreground">
                    {field.label}
                  </span>
                </div>
              </TableCell>

              <TableCell className="py-3">
                <FieldTypeBadge type={field.type} />
              </TableCell>

              <TableCell className="py-3 text-xs text-muted-foreground">
                {field.sample}
              </TableCell>

              <TableCell className="py-3">
                <Switch
                  defaultChecked={field.required}
                  aria-label={`${table.columns.required}: ${field.label}`}
                  className={ROW_SWITCH}
                />
              </TableCell>

              <TableCell className="py-3">
                <Switch
                  defaultChecked={field.filterable}
                  aria-label={`${table.columns.filterable}: ${field.label}`}
                  className={ROW_SWITCH}
                />
              </TableCell>

              <TableCell className="py-2 pr-5 text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${table.columns.actions}: ${field.label}`}
                  className="rounded-md text-[#9aa5ad]"
                >
                  <Ellipsis className="size-6" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
