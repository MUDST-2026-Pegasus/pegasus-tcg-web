import {
  ArrowDown,
  ArrowUp,
  Ellipsis,
  ListPlus,
  Pencil,
  Trash2,
} from "lucide-react";

import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { formatCount } from "../catalog.format";
import type { Game, GameAttribute } from "../catalog.types";
import { acceptedValues } from "../taxonomy.format";

import { FieldTypeBadge } from "./FieldTypeBadge";
import {
  CARD_EMPTY_CLASS,
  HEAD_CLASS,
  HEAD_ROW_CLASS,
  ROW_SWITCH,
} from "./taxonomy.styles";

export type AttributeFlag = "required" | "filterable";

type CardSchemaTableProps = {
  game: Game;
  /** เรียงตาม `displayOrder` มาจาก backend แล้ว */
  attributes: GameAttribute[];
  productCount: number | undefined;
  /** แถวที่กำลังบันทึก — ปิดสวิตช์และเมนูไว้กันกดซ้ำ */
  isBusy: (attributeId: number) => boolean;
  /** กำลังเรียงลำดับใหม่ — ปิดปุ่มเลื่อนทั้งตาราง */
  isReordering: boolean;
  onAdd: () => void;
  onEdit: (attribute: GameAttribute) => void;
  onDelete: (attribute: GameAttribute) => void;
  onToggle: (attribute: GameAttribute, flag: AttributeFlag, value: boolean) => void;
  onMove: (attribute: GameAttribute, direction: -1 | 1) => void;
};

/**
 * ตารางฟิลด์ของเกมที่เลือก — สวิตช์ "จำเป็น" / "ใช้กรอง" บันทึกทันทีที่กด
 *
 * หมายเหตุ: ใช้ <table> จริงเพื่อให้ screen reader อ่านหัวคอลัมน์ได้
 * คุมความกว้างผ่าน w-* บน <th> ให้หน้าตาตรงกับดีไซน์
 */
export function CardSchemaTable({
  game,
  attributes,
  productCount,
  isBusy,
  isReordering,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  onMove,
}: CardSchemaTableProps) {
  return (
    <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3.5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-semibold text-foreground">
            คุณสมบัติการ์ดของ {game.name}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {attributes.length} ฟิลด์
            {productCount === undefined
              ? ""
              : ` · ใช้กับการ์ด ${formatCount(productCount)} ใบ`}
          </p>
        </div>

        <Button variant="outline" className="rounded-md px-2.5" onClick={onAdd}>
          + เพิ่มฟิลด์
        </Button>
      </div>

      {attributes.length === 0 ? (
        <EmptyState
          icon={ListPlus}
          title="ยังไม่มีฟิลด์"
          description={`เพิ่มฟิลด์แรกของ ${game.name} เช่น HP หรือความหายาก แล้วฟอร์มเพิ่มการ์ดจะมีช่องนี้ทันที`}
          className={CARD_EMPTY_CLASS}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className={HEAD_ROW_CLASS}>
              <TableHead className={cn(HEAD_CLASS, "w-[260px] pl-5")}>
                ชื่อฟิลด์
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[110px]")}>ประเภท</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[280px]")}>
                ค่าที่รับ
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[70px]")}>จำเป็น</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[70px]")}>ใช้กรอง</TableHead>
              <TableHead className={cn(HEAD_CLASS, "pr-5")}>
                <span className="sr-only">จัดการ</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="[&_tr]:border-[#eef1f2]">
            {attributes.map((attribute, index) => {
              const busy = isBusy(attribute.id);

              return (
                <TableRow key={attribute.id} className="hover:bg-[#fafbfb]">
                  <TableCell className="py-2.5 pl-5">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-foreground">
                        {attribute.label}
                      </span>
                      <code className="text-[11px] text-[#9aa5ad]">
                        {attribute.attrKey}
                      </code>
                    </div>
                  </TableCell>

                  <TableCell className="py-2.5">
                    <FieldTypeBadge type={attribute.dataType} />
                  </TableCell>

                  <TableCell className="max-w-[280px] truncate py-2.5 text-xs text-muted-foreground">
                    {acceptedValues(attribute)}
                  </TableCell>

                  <TableCell className="py-2.5">
                    <Switch
                      checked={attribute.required}
                      disabled={busy}
                      onCheckedChange={(checked) =>
                        onToggle(attribute, "required", checked)
                      }
                      aria-label={`จำเป็น: ${attribute.label}`}
                      className={ROW_SWITCH}
                    />
                  </TableCell>

                  <TableCell className="py-2.5">
                    <Switch
                      checked={attribute.filterable}
                      disabled={busy}
                      onCheckedChange={(checked) =>
                        onToggle(attribute, "filterable", checked)
                      }
                      aria-label={`ใช้กรอง: ${attribute.label}`}
                      className={ROW_SWITCH}
                    />
                  </TableCell>

                  <TableCell className="py-2 pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`จัดการฟิลด์ ${attribute.label}`}
                            disabled={busy}
                            className="rounded-md text-[#9aa5ad]"
                          />
                        }
                      >
                        <Ellipsis className="size-6" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => onEdit(attribute)}>
                          <Pencil />
                          แก้ไข
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isReordering || index === 0}
                          onClick={() => onMove(attribute, -1)}
                        >
                          <ArrowUp />
                          เลื่อนขึ้น
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={
                            isReordering || index === attributes.length - 1
                          }
                          onClick={() => onMove(attribute, 1)}
                        >
                          <ArrowDown />
                          เลื่อนลง
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(attribute)}
                        >
                          <Trash2 />
                          ลบฟิลด์
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
