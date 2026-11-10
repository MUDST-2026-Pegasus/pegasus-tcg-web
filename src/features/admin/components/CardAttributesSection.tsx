import { useState } from "react";

import { toast } from "@/components/ui/toast";

import { formatCount } from "../catalog.format";
import type { Game, GameAttribute } from "../catalog.types";
import { taxonomyErrorMessage } from "../taxonomy.format";
import {
  useDeleteAttribute,
  useReorderAttributes,
  useSaveAttribute,
} from "../taxonomy.queries";
import { attributeWith } from "../taxonomy.schema";

import { AttributeFormDialog } from "./AttributeFormDialog";
import { CardSchemaTable, type AttributeFlag } from "./CardSchemaTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useTranslate } from "@/lib/i18n";

type CardAttributesSectionProps = {
  game: Game;
  attributes: GameAttribute[];
  productCount: number | undefined;
};

/**
 * แท็บ "คุณสมบัติการ์ด" — ตารางฟิลด์ + หน้าต่างเพิ่ม/แก้/ลบ
 * ทุกการกดบันทึกทันที (ไม่มีปุ่มบันทึกรวม) ตามแถบแจ้งเตือนบนหัวหน้า
 */
export function CardAttributesSection({
  game,
  attributes,
  productCount,
}: CardAttributesSectionProps) {
  const { t } = useTranslate("admin");
  const saveAttribute = useSaveAttribute(game.id);
  const reorder = useReorderAttributes(game.id);
  const deleteAttribute = useDeleteAttribute(game.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GameAttribute | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GameAttribute | null>(null);

  const nextDisplayOrder =
    Math.max(0, ...attributes.map((attribute) => attribute.displayOrder)) + 1;

  const toggle = (
    attribute: GameAttribute,
    flag: AttributeFlag,
    value: boolean,
  ) => {
    saveAttribute.mutate(
      {
        attributeId: attribute.id,
        payload: attributeWith(attribute, { [flag]: value }),
      },
      {
        onError: (error) =>
          toast.add({
            type: "error",
            title: t("cardAttributes.fields.saveFailed", "บันทึก {label} ไม่สำเร็จ", { label: attribute.label }),
            description: taxonomyErrorMessage(error, t("common.tryAgain", "ลองใหม่อีกครั้ง")),
          }),
      },
    );
  };

  const move = (attribute: GameAttribute, direction: -1 | 1) => {
    const from = attributes.findIndex((item) => item.id === attribute.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= attributes.length) {
      return;
    }
    const ordered = [...attributes];
    [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
    reorder.mutate(ordered, {
      onError: (error) =>
        toast.add({
          type: "error",
          title: t("cardAttributes.fields.reorderFailed", "เรียงลำดับไม่สำเร็จ"),
          description: taxonomyErrorMessage(error, t("common.tryAgain", "ลองใหม่อีกครั้ง")),
        }),
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    deleteAttribute.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.add({ type: "success", title: t("cardAttributes.fields.deleted", "ลบฟิลด์ {label} แล้ว", { label: deleteTarget.label }) });
        setDeleteOpen(false);
      },
    });
  };

  return (
    <>
      <CardSchemaTable
        game={game}
        attributes={attributes}
        productCount={productCount}
        isBusy={(attributeId) =>
          saveAttribute.isPending &&
          saveAttribute.variables?.attributeId === attributeId
        }
        isReordering={reorder.isPending}
        onAdd={() => {
          setEditing(undefined);
          setFormOpen(true);
        }}
        onEdit={(attribute) => {
          setEditing(attribute);
          setFormOpen(true);
        }}
        onDelete={(attribute) => {
          deleteAttribute.reset();
          setDeleteTarget(attribute);
          setDeleteOpen(true);
        }}
        onToggle={toggle}
        onMove={move}
      />

      <AttributeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        game={game}
        attribute={editing}
        nextDisplayOrder={nextDisplayOrder}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("cardAttributes.fields.deleteTitle", "ลบฟิลด์ {label}?", { label: deleteTarget?.label ?? "" })}
        description={t("cardAttributes.fields.deleteDescription", "ฟอร์มเพิ่มการ์ดและตัวกรองหน้าร้านจะไม่มีช่องนี้อีก ค่าที่การ์ดเก็บไว้ใต้คีย์ \"{key}\" ไม่ถูกลบ แต่จะไม่มีใครอ่าน", { key: deleteTarget?.attrKey ?? "" })}
        confirmLabel={t("cardAttributes.fields.delete", "ลบฟิลด์")}
        isPending={deleteAttribute.isPending}
        error={deleteAttribute.error}
        errorFallback={t("cardAttributes.fields.deleteFailed", "ลบฟิลด์ไม่สำเร็จ ลองใหม่อีกครั้ง")}
        onConfirm={confirmDelete}
      >
        {productCount ? (
          <p className="rounded-lg bg-[#fbe9e8] px-3 py-2.5 text-xs text-[#d0342c]">
            {t("cardAttributes.fields.deleteUsage", "{game} มีการ์ดในแคตตาล็อก {count} ใบ ที่อาจกรอกฟิลด์นี้ไว้แล้ว", { game: game.name, count: formatCount(productCount) })}
          </p>
        ) : null}
      </ConfirmDeleteDialog>
    </>
  );
}
