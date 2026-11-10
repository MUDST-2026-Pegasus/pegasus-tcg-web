import { CirclePause, CirclePlay, Pause, Square, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { PROMOTION_DANGER_BUTTON } from "@/features/admin/promotions.styles";
import { hasErrorCode } from "@/lib/api";

import { sellerSaleErrorMessage } from "../sales.format";
import { useSellerSaleAction } from "../sales.queries";
import type { SellerSale } from "../sales.types";
import { intlLocale, useTranslate } from "@/lib/i18n";

export type SellerSaleActionKind = "pause" | "resume" | "end" | "delete" | "admin-paused";
export type SellerSaleActionState = { kind: SellerSaleActionKind; sale: SellerSale };

/** ช่องทางติดต่อทีมงานจากโมดัล "ทีมงานหยุด" */
const SUPPORT_HREF = "mailto:support@pegasus-tcg.com";

/** Figma SAL-M1 (Seller): จบก่อนกำหนด · ทีมงานหยุด (INFO ไม่มีปุ่มเปิด) · ลบ · หยุด/เปิดเอง */
export function SellerSaleActionDialog({
  action,
  onChange,
}: {
  action: SellerSaleActionState | null;
  onChange: (action: SellerSaleActionState | null) => void;
}) {
  const { t } = useTranslate("sale");
  const mutation = useSellerSaleAction();
  if (!action) return null;
  const { kind, sale } = action;
  const close = () => onChange(null);

  const run = (verb: "pause" | "resume" | "end" | "delete", success: string, failure: string) =>
    mutation.mutate(
      { id: sale.id, kind: verb },
      {
        onSuccess: () => {
          toast.add({ title: success, type: "success" });
          close();
        },
        onError: (error) => {
          if (verb === "resume" && hasErrorCode(error, "SALE_PAUSED")) {
            onChange({ kind: "admin-paused", sale: { ...sale, pausedByPegasus: true } });
            return;
          }
          if (verb === "delete" && hasErrorCode(error, "SALE_IN_USE")) {
            onChange({ kind: "end", sale });
            toast.add({ title: t("seller.action.inUse", "มีออเดอร์แล้ว ลบไม่ได้ — จบก่อนกำหนดแทน"), type: "info" });
            return;
          }
          toast.add({ title: failure, description: sellerSaleErrorMessage(error, t("seller.tryAgain", "กรุณาลองอีกครั้ง")), type: "error" });
        },
      },
    );

  const pending = mutation.isPending;
  const cancel = (
    <Button variant="outline" disabled={pending} onClick={close}>
      {t("actions.cancel", "ยกเลิก", { ns: "common" })}
    </Button>
  );

  switch (kind) {
    case "end":
      return (
        <PromotionDialog
          open
          onOpenChange={(open) => !open && close()}
          tone="warning"
          icon={<Square />}
          title={t("seller.action.end.title", "จบ “{name}” ตอนนี้?", { name: sale.name })}
          description={t("seller.action.end.description", "{count} listing กลับเป็นราคาปกติทันที · ขายไปแล้ว {sold} ชิ้น ไม่กระทบ", { count: sale.listingCount.toLocaleString(intlLocale()), sold: sale.soldUnits.toLocaleString(intlLocale()) })}
          actions={
            <>
              {cancel}
              <Button
                className={PROMOTION_DANGER_BUTTON}
                disabled={pending}
                onClick={() => run("end", t("seller.action.end.success", "จบ “{name}” แล้ว", { name: sale.name }), t("seller.action.end.failed", "จบการลดราคาไม่สำเร็จ"))}
              >
                {t("seller.action.end.confirm", "จบตอนนี้")}
              </Button>
            </>
          }
        />
      );
    case "admin-paused":
      return (
        <PromotionDialog
          open
          onOpenChange={(open) => !open && close()}
          tone="info"
          icon={<CirclePause />}
          title={t("seller.action.adminPaused.title", "ทีมงานหยุด “{name}”", { name: sale.name })}
          description={t("seller.action.adminPaused.description", "เหตุผล: {reason} · แก้ราคาแล้วขอให้ทีมงานเปิดอีกครั้ง", { reason: sale.pauseReason || t("seller.action.adminPaused.noReason", "ไม่ได้ระบุ") })}
          actions={
            <>
              <Button variant="outline" onClick={close}>
                {t("seller.action.close", "ปิด")}
              </Button>
              <Button render={<a href={SUPPORT_HREF} />} nativeButton={false}>
                {t("seller.action.contact", "ติดต่อทีมงาน")}
              </Button>
            </>
          }
        />
      );
    case "delete":
      return (
        <PromotionDialog
          open
          onOpenChange={(open) => !open && close()}
          tone="danger"
          icon={<Trash2 />}
          title={t("seller.action.delete.title", "ลบ “{name}”?", { name: sale.name })}
          description={
            sale.status === "SCHEDULED"
              ? t("seller.action.delete.scheduled", "ยังไม่เริ่มและยังไม่มีออเดอร์ ลบแล้วกู้คืนไม่ได้")
              : t("seller.action.delete.noOrders", "ยังไม่มีออเดอร์ที่ใช้ราคานี้ ลบแล้วกู้คืนไม่ได้")
          }
          actions={
            <>
              {cancel}
              <Button
                className={PROMOTION_DANGER_BUTTON}
                disabled={pending}
                onClick={() => run("delete", t("seller.action.delete.success", "ลบ “{name}” แล้ว", { name: sale.name }), t("seller.action.delete.failed", "ลบไม่สำเร็จ"))}
              >
                {t("seller.action.delete.confirm", "ลบ")}
              </Button>
            </>
          }
        />
      );
    case "pause":
      return (
        <PromotionDialog
          open
          onOpenChange={(open) => !open && close()}
          tone="warning"
          icon={<Pause />}
          title={t("seller.action.pause.title", "หยุด “{name}” ชั่วคราว?", { name: sale.name })}
          description={t("seller.action.pause.description", "{count} listing กลับเป็นราคาปกติจนกว่าจะเปิดอีกครั้ง", { count: sale.listingCount.toLocaleString(intlLocale()) })}
          actions={
            <>
              {cancel}
              <Button disabled={pending} onClick={() => run("pause", t("seller.action.pause.success", "หยุด “{name}” แล้ว", { name: sale.name }), t("seller.action.pause.failed", "หยุดไม่สำเร็จ"))}>
                {t("seller.action.pause.confirm", "หยุดชั่วคราว")}
              </Button>
            </>
          }
        />
      );
    case "resume":
      return (
        <PromotionDialog
          open
          onOpenChange={(open) => !open && close()}
          tone="success"
          icon={<CirclePlay />}
          title={t("seller.action.resume.title", "เปิด “{name}” อีกครั้ง?", { name: sale.name })}
          description={t("seller.action.resume.description", "listing ได้ราคาลดกลับภายใน 1 นาที")}
          actions={
            <>
              {cancel}
              <Button disabled={pending} onClick={() => run("resume", t("seller.action.resume.success", "เปิด “{name}” แล้ว", { name: sale.name }), t("seller.action.resume.failed", "เปิดไม่สำเร็จ"))}>
                {t("seller.action.resume.confirm", "เปิดอีกครั้ง")}
              </Button>
            </>
          }
        />
      );
  }
}
