import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import {
  HOME_STRIP_MAX,
  currentHomeIds,
  discountCapLabel,
  discountLabel,
  formatPromoDate,
  isHomeCandidate,
  promotionErrorMessage,
} from "../promotions.format";
import { useSetHomeOrder } from "../promotions.queries";
import type { AdminPromotion } from "../promotions.types";
import { PromotionDialog } from "./PromotionDialog";

function homeStatus(promotion: AdminPromotion): { label: string; className: string } {
  if (promotion.status === "SCHEDULED") {
    return { label: `เริ่ม ${formatPromoDate(promotion.startsAt).replace(/ \d{4}$/, "")}`, className: "text-[#0058bc]" };
  }
  if (promotion.status === "ACTIVE") return { label: "ใช้งานอยู่", className: "text-[#007a4a]" };
  return { label: promotion.status === "PAUSED" ? "หยุดชั่วคราว" : "สิทธิ์เต็ม", className: "text-[#b45309]" };
}

type PromotionHomeOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** โค้ด Pegasus ทั้งหมด */
  promotions: AdminPromotion[];
};

export function PromotionHomeOrderDialog({ open, onOpenChange, promotions }: PromotionHomeOrderDialogProps) {
  // ล้างการแก้ทุกครั้งที่เปิดใหม่
  return open ? <HomeOrderEditor promotions={promotions} onClose={() => onOpenChange(false)} /> : null;
}

function HomeOrderEditor({ promotions, onClose }: { promotions: AdminPromotion[]; onClose: () => void }) {
  const save = useSetHomeOrder();
  const [ids, setIds] = useState(() => currentHomeIds(promotions));
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const byId = new Map(promotions.map((promotion) => [promotion.id, promotion]));
  const selected = ids.map((id) => byId.get(id)).filter((promotion): promotion is AdminPromotion => !!promotion);
  const available = promotions.filter(
    (promotion) =>
      isHomeCandidate(promotion) &&
      !ids.includes(promotion.id) &&
      (promotion.status === "ACTIVE" || promotion.status === "SCHEDULED"),
  );

  const move = (from: number, to: number) =>
    setIds((current) => {
      if (to < 0 || to >= current.length || from === to) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  const submit = () =>
    save.mutate(ids, {
      onSuccess: () => {
        toast.add({ title: "บันทึกลำดับหน้าแรกแล้ว", type: "success" });
        onClose();
      },
      onError: (error) =>
        toast.add({ title: "บันทึกลำดับไม่สำเร็จ", description: promotionErrorMessage(error, "กรุณาลองอีกครั้ง"), type: "error" }),
    });

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="info"
      icon={<ArrowUpDown />}
      title="จัดลำดับโค้ดบนหน้าแรก"
      description={`แสดงสูงสุด ${HOME_STRIP_MAX} ใบ เรียงจากซ้ายไปขวา · ลากหรือกดลูกศรเพื่อเปลี่ยนลำดับ`}
      className="sm:max-w-[460px]"
      actions={
        <>
          <Button variant="outline" disabled={save.isPending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button disabled={save.isPending} onClick={submit}>
            บันทึกลำดับ
          </Button>
        </>
      }
    >
      <ol className="grid max-h-72 gap-2 overflow-y-auto" aria-label="ลำดับโค้ดบนหน้าแรก">
        {selected.map((promotion, index) => {
          const status = homeStatus(promotion);
          return (
            <li
              key={promotion.id}
              draggable
              onDragStart={() => setDragId(promotion.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dragId != null && move(ids.indexOf(dragId), index)}
              className="flex min-h-13 min-w-0 cursor-grab items-center gap-2 rounded-lg border bg-card px-2.5 py-2 data-dragging:border-primary data-dragging:bg-primary/5"
              data-dragging={dragId === promotion.id || undefined}
            >
              <GripVertical aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <span className="w-3.5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
              <span aria-hidden className="h-7 w-1.5 shrink-0 rounded-sm bg-gradient-to-b from-[#00398a] to-[#1a8fe0]" />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <strong className="truncate text-xs">{promotion.code}</strong>
                <small className="truncate text-[10px] text-muted-foreground">
                  {discountLabel(promotion)}
                  {discountCapLabel(promotion) !== "—" ? ` ${discountCapLabel(promotion)}` : ""} · {promotion.name}
                </small>
              </div>
              <span className={cn("shrink-0 text-[11px] max-sm:hidden", status.className)}>{status.label}</span>
              <div className="flex shrink-0 items-center text-muted-foreground">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`เลื่อน ${promotion.code} ขึ้น`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`เลื่อน ${promotion.code} ลง`}
                  disabled={index === selected.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`นำ ${promotion.code} ออกจากหน้าแรก`}
                  onClick={() => setIds((current) => current.filter((id) => id !== promotion.id))}
                >
                  <X />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      {ids.length < HOME_STRIP_MAX ? (
        <Button type="button" variant="outline" className="w-full border-dashed text-primary" onClick={() => setAdding((show) => !show)}>
          <Plus />
          {adding ? "ซ่อนรายการโค้ด" : `เพิ่มโค้ด Pegasus (${ids.length} / ${HOME_STRIP_MAX})`}
        </Button>
      ) : null}
      {adding && ids.length < HOME_STRIP_MAX ? (
        <div className="grid max-h-40 gap-1 overflow-y-auto rounded-lg border bg-muted p-1.5" aria-label="โค้ด Pegasus ที่เพิ่มได้">
          {available.length === 0 ? (
            <p className="text-xs text-muted-foreground">ไม่มีโค้ดอื่นที่เพิ่มได้</p>
          ) : (
            available.map((promotion) => (
              <Button
                type="button"
                variant="ghost"
                key={promotion.id}
                className="h-auto justify-start gap-2 px-2 py-1.5 text-left"
                onClick={() => setIds((current) => [...current, promotion.id])}
              >
                <Plus aria-hidden className="text-primary" />
                <span className="grid min-w-0 gap-0.5">
                  <strong className="text-xs">{promotion.code}</strong>
                  <small className="truncate text-[10px] font-normal text-muted-foreground">
                    {discountLabel(promotion)} · {promotion.name}
                  </small>
                </span>
              </Button>
            ))
          )}
        </div>
      ) : null}
      <p className="text-[10px] leading-4 text-muted-foreground">
        แสดงเฉพาะโค้ดที่ “ให้กดเก็บได้” + สาธารณะ · โค้ดที่หมดอายุ/หยุด/สิทธิ์เต็ม หายจากหน้าแรกเอง ·
        โค้ดที่ตั้งเวลาไว้ขึ้นเมื่อถึงวันเริ่ม
      </p>
    </PromotionDialog>
  );
}
