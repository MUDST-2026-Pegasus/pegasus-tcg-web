import { FolderTree, ImageIcon, Info, Pencil } from "lucide-react";

import { EmptyState, DataTable, type DataTableColumn } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { CatalogCategory, Game } from "../catalog.types";
import { categoryTree } from "../taxonomy.format";

import {
  CARD_EMPTY_CLASS,
  HEAD_CLASS,
  HEAD_ROW_CLASS,
  ROW_SWITCH,
} from "./taxonomy.styles";
import { useTranslate } from "@/lib/i18n";

type CategoryTableProps = {
  game: Game;
  /** หมวดของเกมนี้ + หมวดข้ามเกม รวมที่ปิดแล้ว */
  categories: CatalogCategory[];
  /** `categoryId` → URL รูปที่เปิดได้ */
  imageUrls: Map<number, string>;
  isBusy: (categoryId: number) => boolean;
  onAdd: () => void;
  onEdit: (category: CatalogCategory) => void;
  onToggleActive: (category: CatalogCategory, active: boolean) => void;
};

/**
 * แท็บ "หมวดหมู่" — ต้นไม้สองชั้น หมวดแม่แล้วตามด้วยหมวดลูก
 * หมวดลบไม่ได้ (สินค้าชี้อยู่) เลิกใช้แล้วให้ปิดสวิตช์ "เปิดใช้งาน"
 */
export function CategoryTable({
  game,
  categories,
  imageUrls,
  isBusy,
  onAdd,
  onEdit,
  onToggleActive,
}: CategoryTableProps) {
  const { t } = useTranslate("admin");
  const rows = categoryTree(categories);
  const crossGame = categories.filter((category) => category.gameId === null).length;
  const ownGame = categories.length - crossGame;

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      id: "name",
      header: t("cardAttributes.categories.col.category", "หมวดหมู่"),
      meta: { headClassName: cn(HEAD_CLASS, "pl-5"), cellClassName: "py-2.5 pl-5" },
      cell: ({ row: { original: { category, depth } } }) => {
        const image = imageUrls.get(category.id);
        return (
          <div className={cn("flex items-center gap-2.5", depth === 1 && "pl-2", !category.active && "opacity-55")}>
            {depth === 1 && (
              <span aria-hidden="true" className="text-sm text-[#9aa5ad]">
                └
              </span>
            )}
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-[#9aa5ad]">
              {image ? <img src={image} alt="" className="size-full object-cover" /> : <ImageIcon aria-hidden="true" className="size-4" />}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-medium text-foreground">{category.name}</span>
              <span className="truncate text-[11px] text-[#9aa5ad]">/{category.slug}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "code",
      header: t("cardAttributes.col.code", "รหัส"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[120px]"), cellClassName: "py-2.5 text-xs font-medium text-muted-foreground" },
      cell: ({ row }) => row.original.category.code,
    },
    {
      id: "scope",
      header: t("cardAttributes.categories.col.scope", "ใช้กับ"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[130px]"), cellClassName: "py-2.5" },
      cell: ({ row }) =>
        row.original.category.gameId === null ? (
          <Badge className="h-5 rounded-[5px] bg-[#e8f1fc] px-2 text-[10px] font-medium text-[#0058bc]">{t("cardAttributes.categories.allGames", "ทุกเกม")}</Badge>
        ) : (
          <Badge variant="outline" className="h-5 max-w-full rounded-[5px] px-1.5 text-[10px] font-medium">
            <span className="truncate">{t("cardAttributes.categories.onlyGame", "เฉพาะ {game}", { game: game.name })}</span>
          </Badge>
        ),
    },
    {
      id: "order",
      header: t("cardAttributes.categories.col.order", "ลำดับ"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[60px]"), cellClassName: "py-2.5 text-xs text-muted-foreground" },
      cell: ({ row }) => row.original.category.displayOrder,
    },
    {
      id: "active",
      header: t("cardAttributes.categories.col.active", "เปิดใช้งาน"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[80px]"), cellClassName: "py-2.5" },
      cell: ({ row: { original: { category } } }) => (
        <Switch
          checked={category.active}
          disabled={isBusy(category.id)}
          onCheckedChange={(checked) => onToggleActive(category, checked)}
          aria-label={t("cardAttributes.categories.activeToggle", "เปิดใช้งาน: {name}", { name: category.name })}
          className={ROW_SWITCH}
        />
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("cardAttributes.col.actions", "จัดการ")}</span>,
      meta: { headClassName: cn(HEAD_CLASS, "w-[56px] pr-5"), cellClassName: "py-2 pr-5 text-right" },
      cell: ({ row: { original: { category } } }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("cardAttributes.categories.edit", "แก้ไขหมวด {name}", { name: category.name })}
          className="rounded-md text-[#9aa5ad]"
          onClick={() => onEdit(category)}
        >
          <Pencil />
        </Button>
      ),
    },
  ];

  return (
    <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-4 pb-3.5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-semibold text-foreground">
            {t("cardAttributes.categories.heading", "หมวดหมู่ของ {game}", { game: game.name })}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {t("cardAttributes.categories.count", "{shared} หมวดใช้ร่วมทุกเกม · {own} หมวดเฉพาะ {game}", { shared: crossGame, own: ownGame, game: game.name })}
          </p>
        </div>

        <Button variant="outline" className="rounded-md px-2.5" onClick={onAdd}>
          {t("cardAttributes.categories.add", "+ เพิ่มหมวดหมู่")}
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-[#e8f1fc] px-5 py-2.5 text-[#0058bc]">
        <Info aria-hidden="true" className="size-[18px] shrink-0" />
        <p className="text-xs">
          {t("cardAttributes.categories.notice", "หมวดที่มีป้าย \"ทุกเกม\" ใช้ร่วมกันทุกเกม แก้แล้วมีผลทุกเกม · หมวดหมู่ลบไม่ได้เพราะมีสินค้าอ้างอิงอยู่ ให้ปิดใช้งานแทน")}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title={t("cardAttributes.categories.emptyTitle", "ยังไม่มีหมวดหมู่")}
          description={t("cardAttributes.categories.emptyDescription", "เพิ่มหมวดแรก เช่น การ์ดเดี่ยว ของซีล หรืออุปกรณ์เสริม")}
          className={CARD_EMPTY_CLASS}
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(row) => String(row.category.id)}
          headerRowClassName={HEAD_ROW_CLASS}
          bodyClassName="[&_tr]:border-muted"
          rowClassName={() => "hover:bg-[#fafbfb]"}
        />
      )}
    </Card>
  );
}
