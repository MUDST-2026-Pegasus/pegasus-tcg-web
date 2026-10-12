import { FolderTree, ImageIcon, Info, Pencil } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

import type { CatalogCategory, Game } from "../catalog.types";
import { categoryTree } from "../taxonomy.format";

import {
  CARD_EMPTY_CLASS,
  HEAD_CLASS,
  HEAD_ROW_CLASS,
  ROW_SWITCH,
} from "./taxonomy.styles";

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
  const rows = categoryTree(categories);
  const crossGame = categories.filter((category) => category.gameId === null).length;
  const ownGame = categories.length - crossGame;

  return (
    <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-4 pb-3.5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-semibold text-foreground">
            หมวดหมู่ของ {game.name}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {crossGame} หมวดใช้ร่วมทุกเกม · {ownGame} หมวดเฉพาะ {game.name}
          </p>
        </div>

        <Button variant="outline" className="rounded-md px-2.5" onClick={onAdd}>
          + เพิ่มหมวดหมู่
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-[#e8f1fc] px-5 py-2.5 text-[#0058bc]">
        <Info aria-hidden="true" className="size-[18px] shrink-0" />
        <p className="text-xs">
          หมวดที่มีป้าย "ทุกเกม" ใช้ร่วมกันทุกเกม แก้แล้วมีผลทุกเกม ·
          หมวดหมู่ลบไม่ได้เพราะมีสินค้าอ้างอิงอยู่ ให้ปิดใช้งานแทน
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="ยังไม่มีหมวดหมู่"
          description="เพิ่มหมวดแรก เช่น การ์ดเดี่ยว ของซีล หรืออุปกรณ์เสริม"
          className={CARD_EMPTY_CLASS}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className={HEAD_ROW_CLASS}>
              <TableHead className={cn(HEAD_CLASS, "pl-5")}>หมวดหมู่</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[120px]")}>รหัส</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[130px]")}>ใช้กับ</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[60px]")}>ลำดับ</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[80px]")}>เปิดใช้งาน</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[56px] pr-5")}>
                <span className="sr-only">จัดการ</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="[&_tr]:border-[#eef1f2]">
            {rows.map(({ category, depth }) => {
              const image = imageUrls.get(category.id);

              return (
                <TableRow key={category.id} className="hover:bg-[#fafbfb]">
                  <TableCell className="py-2.5 pl-5">
                    <div
                      className={cn(
                        "flex items-center gap-2.5",
                        depth === 1 && "pl-2",
                        !category.active && "opacity-55",
                      )}
                    >
                      {depth === 1 && (
                        <span aria-hidden="true" className="text-sm text-[#9aa5ad]">
                          └
                        </span>
                      )}
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f1f3f4] text-[#9aa5ad]">
                        {image ? (
                          <img src={image} alt="" className="size-full object-cover" />
                        ) : (
                          <ImageIcon aria-hidden="true" className="size-4" />
                        )}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[13px] font-medium text-foreground">
                          {category.name}
                        </span>
                        <span className="truncate text-[11px] text-[#9aa5ad]">
                          /{category.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-2.5 text-xs font-medium text-muted-foreground">
                    {category.code}
                  </TableCell>

                  <TableCell className="py-2.5">
                    {category.gameId === null ? (
                      <Badge className="h-5 rounded-[5px] bg-[#e8f1fc] px-2 text-[10px] font-medium text-[#0058bc]">
                        ทุกเกม
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="h-5 max-w-full rounded-[5px] px-1.5 text-[10px] font-medium"
                      >
                        <span className="truncate">เฉพาะ {game.name}</span>
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {category.displayOrder}
                  </TableCell>

                  <TableCell className="py-2.5">
                    <Switch
                      checked={category.active}
                      disabled={isBusy(category.id)}
                      onCheckedChange={(checked) => onToggleActive(category, checked)}
                      aria-label={`เปิดใช้งาน: ${category.name}`}
                      className={ROW_SWITCH}
                    />
                  </TableCell>

                  <TableCell className="py-2 pr-5 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`แก้ไขหมวด ${category.name}`}
                      className="rounded-md text-[#9aa5ad]"
                      onClick={() => onEdit(category)}
                    >
                      <Pencil />
                    </Button>
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
