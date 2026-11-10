import { useState } from "react";

import { toast } from "@/components/ui/toast";

import { formatCount } from "../catalog.format";
import type { CardSet, Game } from "../catalog.types";
import { formatReleaseDate } from "../taxonomy.format";
import { useCardSetUsage, useDeleteCardSet } from "../taxonomy.queries";

import { CardSetFormDialog } from "./CardSetFormDialog";
import { CardSetTable } from "./CardSetTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useTranslate } from "@/lib/i18n";

type CardSetsSectionProps = {
  game: Game;
  cardSets: CardSet[];
};

/**
 * แท็บ "ชุดการ์ด" — ตาราง + หน้าต่างเพิ่ม/แก้/ลบ
 *
 * ลบได้เฉพาะชุดที่ยังไม่มีการ์ดในแคตตาล็อก (backend ตอบ `CARD_SET_IN_USE`)
 * หน้าต่างลบจึงนับการ์ดในชุดให้ดูก่อน และปิดปุ่มลบถ้ายังมีการ์ดอยู่
 */
export function CardSetsSection({ game, cardSets }: CardSetsSectionProps) {
  const { t } = useTranslate("admin");
  const deleteCardSet = useDeleteCardSet(game.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CardSet | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CardSet | null>(null);

  // นับเฉพาะตอนหน้าต่างลบเปิดอยู่ — ไม่ต้องยิงนับทุกชุดทุกครั้งที่เปิดแท็บ
  const usage = useCardSetUsage(
    game.id,
    deleteOpen && deleteTarget ? deleteTarget.id : null,
  );
  const inUse = (usage.data ?? 0) > 0;

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    deleteCardSet.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.add({ type: "success", title: t("cardAttributes.sets.deleted", "ลบชุด {code} แล้ว", { code: deleteTarget.code }) });
        setDeleteOpen(false);
      },
    });
  };

  return (
    <>
      <CardSetTable
        game={game}
        cardSets={cardSets}
        onAdd={() => {
          setEditing(undefined);
          setFormOpen(true);
        }}
        onEdit={(cardSet) => {
          setEditing(cardSet);
          setFormOpen(true);
        }}
        onDelete={(cardSet) => {
          deleteCardSet.reset();
          setDeleteTarget(cardSet);
          setDeleteOpen(true);
        }}
      />

      <CardSetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        game={game}
        cardSet={editing}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("cardAttributes.sets.deleteTitle", "ลบชุด {code} · {name}?", { code: deleteTarget?.code ?? "", name: deleteTarget?.name ?? "" })}
        description={t("cardAttributes.sets.deleteDescription", "ลบแล้วกู้คืนไม่ได้ ชุดที่ยังมีการ์ดในแคตตาล็อกจะลบไม่ได้จนกว่าจะย้ายการ์ดไปชุดอื่น")}
        confirmLabel={t("cardAttributes.sets.deleteConfirm", "ลบชุดการ์ด")}
        isPending={deleteCardSet.isPending}
        confirmDisabled={usage.isPending || inUse}
        error={deleteCardSet.error}
        errorFallback={t("cardAttributes.sets.deleteFailed", "ลบชุดการ์ดไม่สำเร็จ ลองใหม่อีกครั้ง")}
        onConfirm={confirmDelete}
      >
        {deleteTarget && (
          <dl className="flex flex-col gap-2.5 rounded-lg border border-muted bg-[#fafbfb] px-4 py-3.5 text-xs">
            <SummaryRow
              label={t("cardAttributes.sets.usage", "การ์ดในแคตตาล็อกที่อยู่ในชุดนี้")}
              value={
                usage.isPending
                  ? t("cardAttributes.sets.counting", "กำลังนับ…")
                  : usage.isError
                    ? t("cardAttributes.sets.countFailed", "นับไม่สำเร็จ")
                    : t("cardAttributes.sets.items", "{count} รายการ", { count: formatCount(usage.data ?? 0) })
              }
            />
            <SummaryRow
              label={t("cardAttributes.sets.totalCards", "จำนวนการ์ดในชุด")}
              value={
                deleteTarget.totalCards === null
                  ? "—"
                  : t("cardAttributes.sets.cards", "{count} ใบ", { count: formatCount(deleteTarget.totalCards) })
              }
            />
            <SummaryRow
              label={t("cardAttributes.sets.col.release", "วันวางจำหน่าย")}
              value={formatReleaseDate(deleteTarget.releaseDate) ?? "—"}
            />
          </dl>
        )}
        {inUse && (
          <p className="rounded-lg bg-[#fbe9e8] px-3 py-2.5 text-xs text-[#d0342c]">
            {t("cardAttributes.sets.inUse", "ยังลบไม่ได้ — ย้ายการ์ด {count} รายการในหน้าจัดการแคตตาล็อกไปชุดอื่นก่อน", { count: formatCount(usage.data ?? 0) })}
          </p>
        )}
      </ConfirmDeleteDialog>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
