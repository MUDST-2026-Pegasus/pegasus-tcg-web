import { useState } from "react";

import { toast } from "@/components/ui/toast";

import { formatCount } from "../catalog.format";
import type { CardSet, Game } from "../catalog.types";
import { formatReleaseDate } from "../taxonomy.format";
import { useCardSetUsage, useDeleteCardSet } from "../taxonomy.queries";

import { CardSetFormDialog } from "./CardSetFormDialog";
import { CardSetTable } from "./CardSetTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

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
        toast.add({ type: "success", title: `ลบชุด ${deleteTarget.code} แล้ว` });
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
        title={`ลบชุด ${deleteTarget?.code ?? ""} · ${deleteTarget?.name ?? ""}?`}
        description="ลบแล้วกู้คืนไม่ได้ ชุดที่ยังมีการ์ดในแคตตาล็อกจะลบไม่ได้จนกว่าจะย้ายการ์ดไปชุดอื่น"
        confirmLabel="ลบชุดการ์ด"
        isPending={deleteCardSet.isPending}
        confirmDisabled={usage.isPending || inUse}
        error={deleteCardSet.error}
        errorFallback="ลบชุดการ์ดไม่สำเร็จ ลองใหม่อีกครั้ง"
        onConfirm={confirmDelete}
      >
        {deleteTarget && (
          <dl className="flex flex-col gap-2.5 rounded-lg border border-[#eef1f2] bg-[#fafbfb] px-4 py-3.5 text-xs">
            <SummaryRow
              label="การ์ดในแคตตาล็อกที่อยู่ในชุดนี้"
              value={
                usage.isPending
                  ? "กำลังนับ…"
                  : usage.isError
                    ? "นับไม่สำเร็จ"
                    : `${formatCount(usage.data ?? 0)} รายการ`
              }
            />
            <SummaryRow
              label="จำนวนการ์ดในชุด"
              value={
                deleteTarget.totalCards === null
                  ? "—"
                  : `${formatCount(deleteTarget.totalCards)} ใบ`
              }
            />
            <SummaryRow
              label="วันวางจำหน่าย"
              value={formatReleaseDate(deleteTarget.releaseDate) ?? "—"}
            />
          </dl>
        )}
        {inUse && (
          <p className="rounded-lg bg-[#fbe9e8] px-3 py-2.5 text-xs text-[#d0342c]">
            ยังลบไม่ได้ — ย้ายการ์ด {formatCount(usage.data ?? 0)} รายการในหน้าจัดการแคตตาล็อกไปชุดอื่นก่อน
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
