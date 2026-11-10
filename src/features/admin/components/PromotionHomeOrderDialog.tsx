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
import { useTranslate, translate } from "@/lib/i18n";

// @tolgee-key {"key":"admin.promotionHomeOrderDialog.label","ns":"promotions","defaultValue":"เริ่ม {value}"}
// @tolgee-key {"key":"admin.promotionHomeOrderDialog.label2","ns":"promotions","defaultValue":"ใช้งานอยู่"}
// @tolgee-key {"key":"admin.promotionHomeOrderDialog.label3","ns":"promotions","defaultValue":"หยุดชั่วคราว"}
// @tolgee-key {"key":"admin.promotionHomeOrderDialog.label4","ns":"promotions","defaultValue":"สิทธิ์เต็ม"}

function homeStatus(promotion: AdminPromotion): { label: string; className: string } {
  if (promotion.status === "SCHEDULED") {
    return { label: translate("promotions", "admin.promotionHomeOrderDialog.label", "เริ่ม {value}", { value: formatPromoDate(promotion.startsAt).replace(/ \d{4}$/, "") }), className: "text-[#0058bc]" };
  }
  if (promotion.status === "ACTIVE") return { label: translate("promotions", "admin.promotionHomeOrderDialog.label2", "ใช้งานอยู่"), className: "text-[#007a4a]" };
  return { label: promotion.status === "PAUSED" ? translate("promotions", "admin.promotionHomeOrderDialog.label3", "หยุดชั่วคราว") : translate("promotions", "admin.promotionHomeOrderDialog.label4", "สิทธิ์เต็ม"), className: "text-[#b45309]" };
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
  const { t } = useTranslate("promotions");
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
        toast.add({ title: t("admin.promotionHomeOrderDialog.title", "บันทึกลำดับหน้าแรกแล้ว"), type: "success" });
        onClose();
      },
      onError: (error) =>
        toast.add({ title: t("admin.promotionHomeOrderDialog.title2", "บันทึกลำดับไม่สำเร็จ"), description: promotionErrorMessage(error, t("admin.promotionHomeOrderDialog.promotionErrorMessage", "กรุณาลองอีกครั้ง")), type: "error" }),
    });

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="info"
      icon={<ArrowUpDown />}
      title={t("admin.promotionHomeOrderDialog.title3", "จัดลำดับโค้ดบนหน้าแรก")}
      description={t("admin.promotionHomeOrderDialog.description", "แสดงสูงสุด {HOME_STRIP_MAX} ใบ เรียงจากซ้ายไปขวา · ลากหรือกดลูกศรเพื่อเปลี่ยนลำดับ", { HOME_STRIP_MAX })}
      className="sm:max-w-[460px]"
      actions={
        <>
          <Button variant="outline" disabled={save.isPending} onClick={onClose}>
            {t("admin.promotionHomeOrderDialog.button", "ยกเลิก")}
          </Button>
          <Button disabled={save.isPending} onClick={submit}>
            {t("admin.promotionHomeOrderDialog.button2", "บันทึกลำดับ")}
          </Button>
        </>
      }
    >
      <ol className="grid max-h-72 gap-2 overflow-y-auto" aria-label={t("admin.promotionHomeOrderDialog.ariaLabel", "ลำดับโค้ดบนหน้าแรก")}>
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
              className="flex min-h-[50px] min-w-0 cursor-grab items-center gap-2.5 rounded-md border bg-card px-2.5 py-2 data-dragging:border-primary data-dragging:bg-primary/5"
              data-dragging={dragId === promotion.id || undefined}
            >
              <GripVertical aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <span className="w-3.5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
              <span aria-hidden className="h-7 w-1.5 shrink-0 rounded-sm bg-gradient-to-b from-[#00398a] to-[#1a8fe0]" />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <strong className="truncate text-[13px]">{promotion.code}</strong>
                <small className="truncate text-[11px] text-muted-foreground">
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
                  aria-label={t("admin.promotionHomeOrderDialog.ariaLabel2", "เลื่อน {code} ขึ้น", { code: promotion.code })}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("admin.promotionHomeOrderDialog.ariaLabel3", "เลื่อน {code} ลง", { code: promotion.code })}
                  disabled={index === selected.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("admin.promotionHomeOrderDialog.ariaLabel4", "นำ {code} ออกจากหน้าแรก", { code: promotion.code })}
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
          {adding ? t("admin.promotionHomeOrderDialog.button3", "ซ่อนรายการโค้ด") : t("admin.promotionHomeOrderDialog.button4", "เพิ่มโค้ด Pegasus ({length} / {HOME_STRIP_MAX})", { length: ids.length, HOME_STRIP_MAX })}
        </Button>
      ) : null}
      {adding && ids.length < HOME_STRIP_MAX ? (
        <div className="grid max-h-40 gap-1 overflow-y-auto rounded-md border bg-muted p-1.5" aria-label={t("admin.promotionHomeOrderDialog.ariaLabel5", "โค้ด Pegasus ที่เพิ่มได้")}>
          {available.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("admin.promotionHomeOrderDialog.p", "ไม่มีโค้ดอื่นที่เพิ่มได้")}</p>
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
      <p className="text-[11px] leading-4 text-muted-foreground">
        {t("admin.promotionHomeOrderDialog.p2", "แสดงเฉพาะโค้ดที่ “ให้กดเก็บได้” + สาธารณะ · โค้ดที่หมดอายุ/หยุด/สิทธิ์เต็ม หายจากหน้าแรกเอง · โค้ดที่ตั้งเวลาไว้ขึ้นเมื่อถึงวันเริ่ม")}
      </p>
    </PromotionDialog>
  );
}
