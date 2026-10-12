import { useState } from "react";

import { toast } from "@/components/ui/toast";

import type { CatalogCategory, Game } from "../catalog.types";
import { taxonomyErrorMessage } from "../taxonomy.format";
import { useCategoryImages, useSaveCategory } from "../taxonomy.queries";
import { categoryWithActive } from "../taxonomy.schema";

import { CategoryFormDialog } from "./CategoryFormDialog";
import { CategoryTable } from "./CategoryTable";

type CategoriesSectionProps = {
  game: Game;
  categories: CatalogCategory[];
};

/** แท็บ "หมวดหมู่" — ตาราง + หน้าต่างเพิ่ม/แก้ สวิตช์เปิดใช้งานบันทึกทันที */
export function CategoriesSection({ game, categories }: CategoriesSectionProps) {
  const saveCategory = useSaveCategory();
  // ตัว admin ไม่มี URL รูป — รูปพังหรือโหลดไม่ขึ้นก็แค่โชว์ไอคอนแทน ไม่ต้องขวางทั้งตาราง
  const images = useCategoryImages(game.id);
  const imageUrls = images.data ?? new Map<number, string>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogCategory | undefined>();

  const toggleActive = (category: CatalogCategory, active: boolean) =>
    saveCategory.mutate(
      { categoryId: category.id, payload: categoryWithActive(category, active) },
      {
        onSuccess: () =>
          toast.add({
            type: "success",
            title: active
              ? `เปิดใช้หมวด ${category.name} แล้ว`
              : `ปิดหมวด ${category.name} แล้ว`,
            description:
              category.gameId === null ? "หมวดนี้ใช้ร่วมกันทุกเกม" : undefined,
          }),
        onError: (error) =>
          toast.add({
            type: "error",
            title: `บันทึก ${category.name} ไม่สำเร็จ`,
            description: taxonomyErrorMessage(error, "ลองใหม่อีกครั้ง"),
          }),
      },
    );

  return (
    <>
      <CategoryTable
        game={game}
        categories={categories}
        imageUrls={imageUrls}
        isBusy={(categoryId) =>
          saveCategory.isPending &&
          saveCategory.variables?.categoryId === categoryId
        }
        onAdd={() => {
          setEditing(undefined);
          setFormOpen(true);
        }}
        onEdit={(category) => {
          setEditing(category);
          setFormOpen(true);
        }}
        onToggleActive={toggleActive}
      />

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        game={game}
        categories={categories}
        category={editing}
        imageUrl={editing ? imageUrls.get(editing.id) : undefined}
      />
    </>
  );
}
