import {
  ArrowDown,
  ArrowUp,
  Ellipsis,
  ListPlus,
  Pencil,
  Trash2,
} from "lucide-react";

import { EmptyState, DataTable, type DataTableColumn } from "@/components/common";
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
import { useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("admin");
  const flagColumn = (flag: AttributeFlag, label: string): DataTableColumn<GameAttribute> => ({
    id: flag,
    header: label,
    meta: { headClassName: cn(HEAD_CLASS, "w-[70px]"), cellClassName: "py-2.5" },
    cell: ({ row: { original: attribute } }) => (
      <Switch
        checked={attribute[flag]}
        disabled={isBusy(attribute.id)}
        onCheckedChange={(checked) => onToggle(attribute, flag, checked)}
        aria-label={`${label}: ${attribute.label}`}
        className={ROW_SWITCH}
      />
    ),
  });
  const columns: DataTableColumn<GameAttribute>[] = [
    {
      id: "label",
      header: t("cardAttributes.fields.col.label", "ชื่อฟิลด์"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[260px] pl-5"), cellClassName: "py-2.5 pl-5" },
      cell: ({ row: { original: attribute } }) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-foreground">{attribute.label}</span>
          <code className="text-[11px] text-[#9aa5ad]">{attribute.attrKey}</code>
        </div>
      ),
    },
    {
      id: "type",
      header: t("cardAttributes.fields.col.type", "ประเภท"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[110px]"), cellClassName: "py-2.5" },
      cell: ({ row }) => <FieldTypeBadge type={row.original.dataType} />,
    },
    {
      id: "values",
      header: t("cardAttributes.fields.col.values", "ค่าที่รับ"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[280px]"), cellClassName: "max-w-[280px] truncate py-2.5 text-xs text-muted-foreground" },
      cell: ({ row }) => acceptedValues(row.original),
    },
    flagColumn("required", t("cardAttributes.fields.required", "จำเป็น")),
    flagColumn("filterable", t("cardAttributes.fields.filterable", "ใช้กรอง")),
    {
      id: "actions",
      header: () => <span className="sr-only">{t("cardAttributes.col.actions", "จัดการ")}</span>,
      meta: { headClassName: cn(HEAD_CLASS, "pr-5"), cellClassName: "py-2 pr-5 text-right" },
      cell: ({ row: { original: attribute, index } }) => {
        const busy = isBusy(attribute.id);
        return (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("cardAttributes.fields.manage", "จัดการฟิลด์ {label}", { label: attribute.label })}
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
                          {t("cardAttributes.fields.edit", "แก้ไข")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isReordering || index === 0}
                          onClick={() => onMove(attribute, -1)}
                        >
                          <ArrowUp />
                          {t("cardAttributes.fields.moveUp", "เลื่อนขึ้น")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={
                            isReordering || index === attributes.length - 1
                          }
                          onClick={() => onMove(attribute, 1)}
                        >
                          <ArrowDown />
                          {t("cardAttributes.fields.moveDown", "เลื่อนลง")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(attribute)}
                        >
                          <Trash2 />
                          {t("cardAttributes.fields.delete", "ลบฟิลด์")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
        );
      },
    },
  ];

  return (
    <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3.5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-semibold text-foreground">
            {t("cardAttributes.fields.heading", "คุณสมบัติการ์ดของ {game}", { game: game.name })}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {t("cardAttributes.fields.count", "{count} ฟิลด์", { count: attributes.length })}
            {productCount === undefined
              ? ""
              : ` · ${t("cardAttributes.fields.usedBy", "ใช้กับการ์ด {count} ใบ", { count: formatCount(productCount) })}`}
          </p>
        </div>

        <Button variant="outline" className="rounded-md px-2.5" onClick={onAdd}>
          {t("cardAttributes.fields.add", "+ เพิ่มฟิลด์")}
        </Button>
      </div>

      {attributes.length === 0 ? (
        <EmptyState
          icon={ListPlus}
          title={t("cardAttributes.fields.emptyTitle", "ยังไม่มีฟิลด์")}
          description={t("cardAttributes.fields.emptyDescription", "เพิ่มฟิลด์แรกของ {game} เช่น HP หรือความหายาก แล้วฟอร์มเพิ่มการ์ดจะมีช่องนี้ทันที", { game: game.name })}
          className={CARD_EMPTY_CLASS}
        />
      ) : (
        <DataTable
          columns={columns}
          data={attributes}
          getRowId={(attribute) => String(attribute.id)}
          headerRowClassName={HEAD_ROW_CLASS}
          bodyClassName="[&_tr]:border-muted"
          rowClassName={() => "hover:bg-[#fafbfb]"}
        />
      )}
    </Card>
  );
}
