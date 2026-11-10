import { useState } from "react";
import { CirclePlay, Info, Pause, Square, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { hasErrorCode } from "@/lib/api";

import { formatBaht } from "../promotions.format";
import { PROMOTION_DANGER_BUTTON } from "../promotions.styles";
import { saleErrorMessage, salePeriod } from "../sales.format";
import { useDeleteSale, useEndSale, usePauseSale, useResumeSale } from "../sales.queries";
import type { AdminSale } from "../sales.types";
import { PromotionDialog } from "./PromotionDialog";
import { CheckRow } from "@/features/promotions/shared/PromotionFormControls";
import { intlLocale, translate, useTranslate } from "@/lib/i18n";

const SUMMARY_BOX = "grid gap-1.5 rounded-md bg-muted px-3.5 py-2.5 text-xs";
const SUMMARY_ROW = "flex justify-between gap-3 text-muted-foreground [&>strong]:font-semibold [&>strong]:text-foreground";

export type SaleActionKind = "pause" | "resume" | "end" | "delete" | "blocked";
export type SaleActionState = { kind: SaleActionKind; sale: AdminSale };

/** หยุด / เปิด / จบทันที / ลบ / ลบไม่ได้ ตามบอร์ด Figma SAL-M1 (Admin) */
export function SaleActionDialog({
  action,
  onChange,
}: {
  action: SaleActionState | null;
  onChange: (action: SaleActionState | null) => void;
}) {
  const close = () => onChange(null);
  if (!action) return null;
  const key = `${action.kind}-${action.sale.id}`;
  switch (action.kind) {
    case "pause":
      return action.sale.ownerType === "SELLER" ? (
        <PauseSellerSaleDialog key={key} sale={action.sale} onClose={close} />
      ) : (
        <PausePlatformSaleDialog key={key} sale={action.sale} onClose={close} />
      );
    case "resume":
      return <ResumeSaleDialog key={key} sale={action.sale} onClose={close} />;
    case "end":
      return <EndSaleDialog key={key} sale={action.sale} onClose={close} />;
    case "delete":
      return (
        <DeleteSaleDialog
          key={key}
          sale={action.sale}
          onClose={close}
          onBlocked={() => onChange({ kind: "blocked", sale: action.sale })}
        />
      );
    case "blocked":
      return (
        <DeleteBlockedSaleDialog
          key={key}
          sale={action.sale}
          onClose={close}
          onEnd={() => onChange({ kind: "end", sale: action.sale })}
        />
      );
  }
}

function errorToast(title: string, error: unknown) {
  toast.add({ title, description: saleErrorMessage(error, translate("sale", "admin.tryAgain", "กรุณาลองอีกครั้ง")), type: "error" });
}

function PausePlatformSaleDialog({ sale, onClose }: { sale: AdminSale; onClose: () => void }) {
  const { t } = useTranslate("sale");
  const pause = usePauseSale();
  const submit = () =>
    pause.mutate(
      { id: sale.id, reason: null, notifySeller: false },
      {
        onSuccess: () => {
          toast.add({ title: t("admin.action.pause.success", "หยุด {name} แล้ว", { name: sale.name }), type: "success" });
          onClose();
        },
        onError: (error) => errorToast(t("admin.action.pause.failed", "หยุดแคมเปญไม่สำเร็จ"), error),
      },
    );
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="warning"
      icon={<Pause />}
      title={t("admin.action.pause.title", "หยุด {name} ชั่วคราว?", { name: sale.name })}
      description={t("admin.action.pause.description", "{count} listing กลับเป็นราคาปกติภายใน 1 นาที จนกว่าจะเปิดอีกครั้ง · ออเดอร์ที่จ่ายแล้วไม่กระทบ", { count: sale.listingCount.toLocaleString(intlLocale()) })}
      actions={
        <>
          <Button variant="outline" disabled={pause.isPending} onClick={onClose}>
            {t("actions.cancel", "ยกเลิก", { ns: "common" })}
          </Button>
          <Button className={PROMOTION_DANGER_BUTTON} disabled={pause.isPending} onClick={submit}>
            {t("admin.action.pause.confirm", "หยุดแคมเปญ")}
          </Button>
        </>
      }
    />
  );
}

/** Figma SAL-M1 "การลดราคาของร้าน → หยุด" — เหตุผลบังคับ (ร้านเห็น) + แจ้งร้าน */
function PauseSellerSaleDialog({ sale, onClose }: { sale: AdminSale; onClose: () => void }) {
  const { t } = useTranslate("sale");
  const pause = usePauseSale();
  const [reason, setReason] = useState("");
  const [notifySeller, setNotifySeller] = useState(true);
  const shop = sale.owner?.username ?? t("admin.type.shop", "ร้านค้า");

  const submit = () =>
    pause.mutate(
      { id: sale.id, reason: reason.trim(), notifySeller },
      {
        onSuccess: () => {
          toast.add({ title: t("admin.action.pauseShop.success", "หยุด “{name}” แล้ว{notified}", { name: sale.name, notified: notifySeller ? t("admin.action.pauseShop.notified", " · แจ้งร้านแล้ว") : "" }), type: "success" });
          onClose();
        },
        onError: (error) => errorToast(t("admin.action.pauseShop.failed", "หยุดการลดราคาไม่สำเร็จ"), error),
      },
    );

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="danger"
      icon={<Pause />}
      title={t("admin.action.pauseShop.title", "หยุด “{name}” ของ {shop}?", { name: sale.name, shop })}
      description={t("admin.action.pauseShop.description", "ร้านเป็นผู้ออกเงิน แอดมินแก้ไม่ได้ · หยุดแล้วร้านจะเห็นเหตุผลนี้และติดต่อทีมงานได้")}
      footerNote={t("admin.action.pauseShop.footer", "บันทึกใน Activity Log")}
      actions={
        <>
          <Button variant="outline" disabled={pause.isPending} onClick={onClose}>
            {t("actions.cancel", "ยกเลิก", { ns: "common" })}
          </Button>
          <Button
            className={PROMOTION_DANGER_BUTTON}
            disabled={!reason.trim() || pause.isPending}
            onClick={submit}
          >
            {t("admin.action.pauseShop.confirm", "หยุดการลดราคา")}
          </Button>
        </>
      }
    >
      <Field className="gap-1.5">
        <FieldLabel htmlFor="sale-pause-reason" className="text-xs">
          {t("admin.action.pauseShop.reason", "เหตุผล (ร้านเห็น) *")}
        </FieldLabel>
        <Textarea
          id="sale-pause-reason"
          autoFocus
          className="min-h-16 text-sm"
          maxLength={300}
          placeholder={t("admin.action.pauseShop.reasonPlaceholder", "เช่น ราคาลดต่ำผิดปกติ กรุณาตรวจสอบราคา")}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      <CheckRow id="sale-notify-paused" label={t("admin.action.pauseShop.notify", "ส่งอีเมลแจ้งร้าน")} checked={notifySeller} onChange={setNotifySeller} />
    </PromotionDialog>
  );
}

function ResumeSaleDialog({ sale, onClose }: { sale: AdminSale; onClose: () => void }) {
  const { t } = useTranslate("sale");
  const resume = useResumeSale();
  const submit = () =>
    resume.mutate(sale.id, {
      onSuccess: () => {
        toast.add({ title: t("admin.action.resume.success", "เปิด {name} อีกครั้งแล้ว", { name: sale.name }), type: "success" });
        onClose();
      },
      onError: (error) => errorToast(t("admin.action.resume.failed", "เปิดแคมเปญไม่สำเร็จ"), error),
    });
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="success"
      icon={<CirclePlay />}
      title={t("admin.action.resume.title", "เปิด {name} อีกครั้ง?", { name: sale.name })}
      description={t("admin.action.resume.description", "listing ที่เข้าเงื่อนไขได้ราคาลดกลับภายใน 1 นาที")}
      actions={
        <>
          <Button variant="outline" disabled={resume.isPending} onClick={onClose}>
            {t("actions.cancel", "ยกเลิก", { ns: "common" })}
          </Button>
          <Button disabled={resume.isPending} onClick={submit}>
            {t("admin.menu.resume", "เปิดอีกครั้ง")}
          </Button>
        </>
      }
    >
      <div className={SUMMARY_BOX}>
        <p className={SUMMARY_ROW}>
          <span>{t("admin.action.resume.reason", "เหตุผลที่หยุด")}</span>
          <strong>{sale.pauseReason || t("admin.action.noReason", "ไม่ได้ระบุ")}</strong>
        </p>
        <p className={SUMMARY_ROW}>
          <span>{t("admin.action.resume.period", "ช่วงเวลา")}</span>
          <strong>{salePeriod(sale)}</strong>
        </p>
      </div>
    </PromotionDialog>
  );
}

/** Figma SAL-M1 "แคมเปญที่กำลังลด → จบทันที" */
function EndSaleDialog({ sale, onClose }: { sale: AdminSale; onClose: () => void }) {
  const { t } = useTranslate("sale");
  const end = useEndSale();
  const submit = () =>
    end.mutate(sale.id, {
      onSuccess: () => {
        toast.add({ title: t("admin.action.end.success", "จบ {name} แล้ว", { name: sale.name }), type: "success" });
        onClose();
      },
      onError: (error) => errorToast(t("admin.action.end.failed", "จบแคมเปญไม่สำเร็จ"), error),
    });
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="warning"
      icon={<Square />}
      title={t("admin.action.end.title", "จบ {name} ตอนนี้?", { name: sale.name })}
      description={t("admin.action.end.description", "{count} listing กลับเป็นราคาปกติทันที · ผู้ซื้อที่มีสินค้าในตะกร้าจะเห็น “ราคาเปลี่ยน” · ออเดอร์ที่จ่ายแล้วไม่กระทบ", { count: sale.listingCount.toLocaleString(intlLocale()) })}
      actions={
        <>
          <Button variant="outline" disabled={end.isPending} onClick={onClose}>
            {t("actions.cancel", "ยกเลิก", { ns: "common" })}
          </Button>
          <Button className={PROMOTION_DANGER_BUTTON} disabled={end.isPending} onClick={submit}>
            {t("admin.action.end.confirm", "จบแคมเปญ")}
          </Button>
        </>
      }
    >
      <div className={SUMMARY_BOX}>
        <p className={SUMMARY_ROW}>
          <span>{t("admin.action.end.sold", "ขายไปแล้ว")}</span>
          <strong>{t("admin.action.pieces", "{count} ชิ้น", { count: sale.soldUnits.toLocaleString(intlLocale()) })}</strong>
        </p>
        {sale.ownerType === "PLATFORM" ? (
          <p className={SUMMARY_ROW}>
            <span>{t("admin.action.end.subsidy", "อุดหนุนแล้ว")}</span>
            <strong>
              {formatBaht(sale.subsidyReserved)} / {sale.budgetCap == null ? t("admin.action.unlimited", "ไม่จำกัด") : formatBaht(sale.budgetCap)}
            </strong>
          </p>
        ) : null}
      </div>
    </PromotionDialog>
  );
}

function DeleteSaleDialog({
  sale,
  onClose,
  onBlocked,
}: {
  sale: AdminSale;
  onClose: () => void;
  onBlocked: () => void;
}) {
  const { t } = useTranslate("sale");
  const remove = useDeleteSale();
  const submit = () =>
    remove.mutate(sale.id, {
      onSuccess: () => {
        toast.add({ title: t("admin.action.delete.success", "ลบ {name} แล้ว", { name: sale.name }), type: "success" });
        onClose();
      },
      onError: (error) => {
        // มีออเดอร์เข้ามาระหว่างที่เปิดหน้าไว้
        if (hasErrorCode(error, "SALE_IN_USE")) onBlocked();
        else errorToast(t("admin.action.delete.failed", "ลบไม่สำเร็จ"), error);
      },
    });
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="danger"
      icon={<Trash2 />}
      title={t("admin.action.delete.title", "ลบ “{name}”?", { name: sale.name })}
      description={t("admin.action.delete.description", "ยังไม่มีออเดอร์ที่ใช้ราคานี้ ลบแล้วกู้คืนไม่ได้")}
      actions={
        <>
          <Button variant="outline" disabled={remove.isPending} onClick={onClose}>
            {t("actions.cancel", "ยกเลิก", { ns: "common" })}
          </Button>
          <Button className={PROMOTION_DANGER_BUTTON} disabled={remove.isPending} onClick={submit}>
            {t("admin.menu.delete", "ลบ")}
          </Button>
        </>
      }
    />
  );
}

/** Figma SAL-M1 "ลบแคมเปญที่มีออเดอร์แล้ว → SALE_IN_USE" */
function DeleteBlockedSaleDialog({ sale, onClose, onEnd }: { sale: AdminSale; onClose: () => void; onEnd: () => void }) {
  const { t } = useTranslate("sale");
  const canEnd = sale.status === "ACTIVE" || sale.status === "PAUSED";
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="info"
      icon={<Info />}
      title={t("admin.action.deleteBlocked.title", "ลบแคมเปญนี้ไม่ได้")}
      description={t("admin.action.deleteBlocked.description", "แคมเปญมีออเดอร์แล้ว (ขายไป {count} ชิ้น) ต้องเก็บไว้เพื่อบัญชีและการคืนเงิน{hint}", { count: sale.soldUnits.toLocaleString(intlLocale()), hint: canEnd ? t("admin.action.deleteBlocked.endHint", " · ใช้ “จบแคมเปญ” แทน") : "" })}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("admin.action.close", "ปิด")}
          </Button>
          {canEnd ? <Button onClick={onEnd}>{t("admin.action.deleteBlocked.end", "จบแคมเปญแทน")}</Button> : null}
        </>
      }
    />
  );
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-744]
// @tolgee-key {"key": "admin.tryAgain", "ns": "sale", "defaultValue": "กรุณาลองอีกครั้ง"}
