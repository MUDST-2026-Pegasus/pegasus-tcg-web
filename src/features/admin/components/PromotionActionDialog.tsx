import { useState } from "react";
import { CirclePlay, Pause, ShieldAlert, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { hasErrorCode } from "@/lib/api";

import {
  sellerPauseReasons,
  formatPromoDate,
  formatPromoDateTime,
  limitLabel,
  maskBuyer,
  promotionErrorMessage,
} from "../promotions.format";
import {
  useDeletePromotion,
  useEndPromotion,
  usePausePromotion,
  useResumePromotion,
  useSetHomeOrder,
} from "../promotions.queries";
import type { AdminPromotion } from "../promotions.types";
import { PromotionDialog } from "./PromotionDialog";
import { PROMOTION_DANGER_BUTTON } from "../promotions.styles";
import { CheckRow } from "@/features/promotions/shared/PromotionFormControls";
import { intlLocale, useTranslate } from "@/lib/i18n";

const SUMMARY_BOX = "grid gap-1 rounded-md bg-muted px-3.5 py-2.5 text-xs";
const SUMMARY_ROW = "flex justify-between gap-3 text-muted-foreground [&>strong]:font-semibold [&>strong]:text-foreground";
const INFO_BOX = "rounded-md bg-[#e8f1fc] px-3.5 py-2.5 text-xs text-[#0058bc]";
const pauseReasonItems = () => sellerPauseReasons().map((reason) => ({ value: reason, label: reason }));

export type PromotionActionKind = "pause" | "resume" | "delete" | "blocked";
export type PromotionActionState = { kind: PromotionActionKind; promotion: AdminPromotion };

type PromotionActionDialogProps = {
  action: PromotionActionState | null;
  /** id ของโค้ดบนหน้าแรกตามลำดับ — ใช้ตอน "ซ่อนจากหน้าแรกระหว่างหยุด" */
  homeIds: number[];
  now: number;
  onChange: (action: PromotionActionState | null) => void;
};

/** หยุด / เปิดใช้อีกครั้ง / ลบ / ลบไม่ได้ ตามบอร์ด Figma PRM-M1 */
export function PromotionActionDialog({ action, homeIds, now, onChange }: PromotionActionDialogProps) {
  const close = () => onChange(null);
  if (!action) return null;
  // key ล้างช่องกรอกทุกครั้งที่เปิดโค้ดใหม่หรือเปลี่ยนแบบ
  const key = `${action.kind}-${action.promotion.id}`;
  switch (action.kind) {
    case "pause":
      return action.promotion.ownerType === "SELLER" ? (
        <PauseSellerDialog key={key} promotion={action.promotion} onClose={close} />
      ) : (
        <PausePlatformDialog key={key} promotion={action.promotion} homeIds={homeIds} onClose={close} />
      );
    case "resume":
      return <ResumeDialog key={key} promotion={action.promotion} onClose={close} />;
    case "delete":
      return (
        <DeleteDialog
          key={key}
          promotion={action.promotion}
          onClose={close}
          onBlocked={() => onChange({ kind: "blocked", promotion: action.promotion })}
        />
      );
    case "blocked":
      return (
        <DeleteBlockedDialog
          key={key}
          promotion={action.promotion}
          now={now}
          onClose={close}
          onPause={() => onChange({ kind: "pause", promotion: action.promotion })}
        />
      );
  }
}

function PausePlatformDialog({
  promotion,
  homeIds,
  onClose,
}: {
  promotion: AdminPromotion;
  homeIds: number[];
  onClose: () => void;
}) {
  const { t } = useTranslate("promotions");
  const pause = usePausePromotion();
  const setHomeOrder = useSetHomeOrder();
  const onHome = homeIds.includes(promotion.id);
  const [hideFromHome, setHideFromHome] = useState(onHome);
  const pending = pause.isPending || setHomeOrder.isPending;

  const submit = async () => {
    try {
      await pause.mutateAsync({ id: promotion.id, reason: null, notifySeller: false });
      if (onHome && hideFromHome) await setHomeOrder.mutateAsync(homeIds.filter((id) => id !== promotion.id));
      toast.add({ title: t("admin.promotionActionDialog.title", "หยุดโค้ด {code} แล้ว", { code: promotion.code }), type: "success" });
      onClose();
    } catch (error) {
      toast.add({ title: t("admin.promotionActionDialog.title2", "หยุดโค้ดไม่สำเร็จ"), description: promotionErrorMessage(error, t("admin.promotionActionDialog.promotionErrorMessage", "กรุณาลองอีกครั้ง")), type: "error" });
    }
  };

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="warning"
      icon={<Pause />}
      title={t("admin.promotionActionDialog.title3", "หยุดโค้ด {code} ชั่วคราว?", { code: promotion.code })}
      description={t("admin.promotionActionDialog.description", "ผู้ซื้อจะเก็บหรือใช้โค้ดนี้ไม่ได้จนกว่าจะเปิดอีกครั้ง · ออเดอร์ที่ชำระแล้วไม่ถูกกระทบ")}
      actions={
        <>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            {t("admin.promotionActionDialog.button", "ยกเลิก")}
          </Button>
          <Button className={PROMOTION_DANGER_BUTTON} disabled={pending} onClick={() => void submit()}>
            {t("admin.promotionActionDialog.button2", "หยุดโค้ด")}
          </Button>
        </>
      }
    >
      <div className={SUMMARY_BOX}>
        <p className={SUMMARY_ROW}>
          <span>{t("admin.promotionActionDialog.span", "ผู้ที่เก็บไว้")}</span>
          <strong>{promotion.claimedCount.toLocaleString(intlLocale())} {t("admin.promotionActionDialog.strong", "คน")}</strong>
        </p>
        <p className={SUMMARY_ROW}>
          <span>{t("admin.promotionActionDialog.span2", "ออเดอร์รอชำระที่ใช้โค้ดนี้")}</span>
          <strong>{promotion.reservedOrders.toLocaleString(intlLocale())} {t("admin.promotionActionDialog.strong2", "รายการ")}</strong>
        </p>
      </div>
      <p className="text-[11px] leading-4 text-muted-foreground">
        {t("admin.promotionActionDialog.p", "ผู้ที่เก็บไว้ยังเห็นโค้ดในกระเป๋าพร้อมป้าย “หยุดชั่วคราว” · ออเดอร์รอชำระยังได้ส่วนลดเดิมจนหมดเวลาชำระ")}
      </p>
      {onHome ? (
        <CheckRow
          id="promotion-hide-from-home"
          label={t("admin.promotionActionDialog.label", "ซ่อนจากหน้าแรกระหว่างหยุด")}
          checked={hideFromHome}
          onChange={setHideFromHome}
        />
      ) : null}
    </PromotionDialog>
  );
}

function PauseSellerDialog({ promotion, onClose }: { promotion: AdminPromotion; onClose: () => void }) {
  const { t } = useTranslate("promotions");
  const pause = usePausePromotion();
  const [category, setCategory] = useState("");
  const [detail, setDetail] = useState("");
  const [notifySeller, setNotifySeller] = useState(true);
  const shop = promotion.owner?.username ?? t("admin.promotionActionDialog.shop", "ร้านค้า");
  const valid = category !== "" && detail.trim() !== "";

  const submit = () =>
    pause.mutate(
      { id: promotion.id, reason: `${category}: ${detail.trim()}`, notifySeller },
      {
        onSuccess: () => {
          toast.add({
            title: t("admin.promotionActionDialog.title5", "หยุดโค้ด {code} แล้ว{value}", { code: promotion.code, value: notifySeller ? t("admin.promotionActionDialog.title4", " · แจ้งร้านแล้ว") : "" }),
            type: "success",
          });
          onClose();
        },
        onError: (error) =>
          toast.add({ title: t("admin.promotionActionDialog.title2", "หยุดโค้ดไม่สำเร็จ"), description: promotionErrorMessage(error, t("admin.promotionActionDialog.promotionErrorMessage", "กรุณาลองอีกครั้ง")), type: "error" }),
      },
    );

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="danger"
      icon={<ShieldAlert />}
      title={t("admin.promotionActionDialog.title6", "หยุดโค้ด {code} ของร้าน {shop}?", { code: promotion.code, shop })}
      description={t("admin.promotionActionDialog.description2", "โค้ดใช้ไม่ได้ทันที ร้านจะเห็นเหตุผลนี้และเปิดใช้เองไม่ได้ · ออเดอร์ที่ใช้ไปแล้วไม่ถูกกระทบ")}
      footerNote={t("admin.promotionActionDialog.footerNote", "บันทึกใน Activity Log")}
      actions={
        <>
          <Button variant="outline" disabled={pause.isPending} onClick={onClose}>
            {t("admin.promotionActionDialog.button", "ยกเลิก")}
          </Button>
          <Button className={PROMOTION_DANGER_BUTTON} disabled={!valid || pause.isPending} onClick={submit}>
            {t("admin.promotionActionDialog.button3", "หยุดโค้ดร้าน")}
          </Button>
        </>
      }
    >
      <Field className="gap-1.5">
        <FieldLabel htmlFor="promotion-pause-reason" className="text-xs">
          {t("admin.promotionActionDialog.fieldLabel", "เหตุผล *")}
        </FieldLabel>
        <Select
          items={pauseReasonItems()}
          value={category || null}
          onValueChange={(value) => setCategory(value ?? "")}
        >
          <SelectTrigger id="promotion-pause-reason" aria-label={t("admin.promotionActionDialog.ariaLabel", "เหตุผลที่หยุดโค้ด")} className="w-full">
            <SelectValue placeholder={t("admin.promotionActionDialog.placeholder", "เลือกเหตุผล")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {pauseReasonItems().map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="promotion-pause-detail" className="text-xs">
          {t("admin.promotionActionDialog.fieldLabel2", "รายละเอียดถึงร้าน *")}
        </FieldLabel>
        <Textarea
          id="promotion-pause-detail"
          className="min-h-16 text-sm"
          maxLength={230}
          placeholder={t("admin.promotionActionDialog.placeholder2", "ระบุรายละเอียดที่ร้านจะได้รับ")}
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
        />
      </Field>
      <CheckRow
        id="promotion-notify-paused"
        label={t("admin.promotionActionDialog.label2", "แจ้งร้านทางอีเมลและแจ้งเตือนในแอป")}
        checked={notifySeller}
        onChange={setNotifySeller}
        tone="danger"
      />
    </PromotionDialog>
  );
}

function ResumeDialog({ promotion, onClose }: { promotion: AdminPromotion; onClose: () => void }) {
  const { t } = useTranslate("promotions");
  const resume = useResumePromotion();
  const isSeller = promotion.ownerType === "SELLER";
  const [notifySeller, setNotifySeller] = useState(true);
  const remaining =
    promotion.usageLimitTotal == null
      ? t("admin.promotionActionDialog.remaining", "ไม่จำกัด")
      : `${Math.max(0, promotion.usageLimitTotal - promotion.usedCount).toLocaleString(intlLocale())} / ${limitLabel(promotion.usageLimitTotal)}`;

  const submit = () =>
    resume.mutate(
      { id: promotion.id, notifySeller: isSeller && notifySeller },
      {
        onSuccess: () => {
          toast.add({ title: t("admin.promotionActionDialog.title7", "เปิดใช้ {code} อีกครั้งแล้ว", { code: promotion.code }), type: "success" });
          onClose();
        },
        onError: (error) =>
          toast.add({ title: t("admin.promotionActionDialog.title8", "เปิดใช้โค้ดไม่สำเร็จ"), description: promotionErrorMessage(error, t("admin.promotionActionDialog.promotionErrorMessage", "กรุณาลองอีกครั้ง")), type: "error" }),
      },
    );

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="success"
      icon={<CirclePlay />}
      title={t("admin.promotionActionDialog.title9", "เปิดใช้ {code} อีกครั้ง?", { code: promotion.code })}
      description={
        promotion.pausedAt
          ? t("admin.promotionActionDialog.description4", "หยุด{value}เมื่อ {value2}", { value: promotion.pausedBy ? t("admin.promotionActionDialog.description3", "โดย {value} ", { value: maskBuyer(promotion.pausedBy) }) : "", value2: formatPromoDateTime(promotion.pausedAt) })
          : undefined
      }
      footerNote={isSeller ? t("admin.promotionActionDialog.footerNote", "บันทึกใน Activity Log") : undefined}
      actions={
        <>
          <Button variant="outline" disabled={resume.isPending} onClick={onClose}>
            {t("admin.promotionActionDialog.button", "ยกเลิก")}
          </Button>
          <Button disabled={resume.isPending} onClick={submit}>
            {t("admin.promotionActionDialog.button4", "เปิดใช้โค้ด")}
          </Button>
        </>
      }
    >
      <div className="grid gap-1 rounded-md bg-muted px-3.5 py-2.5 text-[11px] text-muted-foreground [&>strong]:text-xs [&>strong]:font-medium [&>strong]:text-foreground">
        <span>{t("admin.promotionActionDialog.span3", "เหตุผลที่หยุด")}</span>
        <strong>{promotion.pauseReason || t("admin.promotionActionDialog.strong3", "ไม่ได้ระบุเหตุผล")}</strong>
      </div>
      <div className={SUMMARY_BOX}>
        <p className={SUMMARY_ROW}>
          <span>{t("admin.promotionActionDialog.span4", "สิทธิ์คงเหลือ")}</span>
          <strong>{remaining}</strong>
        </p>
        <p className={SUMMARY_ROW}>
          <span>{t("admin.promotionActionDialog.span5", "หมดอายุ")}</span>
          <strong>{formatPromoDate(promotion.endsAt)}</strong>
        </p>
      </div>
      {isSeller ? (
        <CheckRow
          id="promotion-notify-resumed"
          label={t("admin.promotionActionDialog.label3", "แจ้งร้านว่าเปิดใช้แล้ว")}
          checked={notifySeller}
          onChange={setNotifySeller}
        />
      ) : null}
    </PromotionDialog>
  );
}

function DeleteDialog({
  promotion,
  onClose,
  onBlocked,
}: {
  promotion: AdminPromotion;
  onClose: () => void;
  onBlocked: () => void;
}) {
  const { t } = useTranslate("promotions");
  const remove = useDeletePromotion();
  const [typed, setTyped] = useState("");
  const confirmed = typed.trim().toUpperCase() === promotion.code;

  const submit = () =>
    remove.mutate(promotion.id, {
      onSuccess: () => {
        toast.add({ title: t("admin.promotionActionDialog.title10", "ลบโค้ด {code} แล้ว", { code: promotion.code }), type: "success" });
        onClose();
      },
      onError: (error) => {
        // มีคนเก็บหรือใช้ระหว่างที่เปิดหน้าไว้
        if (hasErrorCode(error, "PROMO_IN_USE")) onBlocked();
        else toast.add({ title: t("admin.promotionActionDialog.title11", "ลบไม่สำเร็จ"), description: promotionErrorMessage(error, t("admin.promotionActionDialog.promotionErrorMessage", "กรุณาลองอีกครั้ง")), type: "error" });
      },
    });

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="danger"
      icon={<Trash2 />}
      title={t("admin.promotionActionDialog.title12", "ลบโค้ด {code}?", { code: promotion.code })}
      description={t("admin.promotionActionDialog.description5", "ยังไม่มีใครเก็บหรือใช้โค้ดนี้ ลบแล้วกู้คืนไม่ได้")}
      actions={
        <>
          <Button variant="outline" disabled={remove.isPending} onClick={onClose}>
            {t("admin.promotionActionDialog.button", "ยกเลิก")}
          </Button>
          <Button className={PROMOTION_DANGER_BUTTON} disabled={!confirmed || remove.isPending} onClick={submit}>
            {t("admin.promotionActionDialog.button5", "ลบโค้ด")}
          </Button>
        </>
      }
    >
      <Field className="gap-1.5">
        <FieldLabel htmlFor="promotion-delete-confirm" className="text-xs">
          {t("admin.promotionActionDialog.fieldLabel3", "พิมพ์")} {promotion.code} {t("admin.promotionActionDialog.fieldLabel4", "เพื่อยืนยัน")}
        </FieldLabel>
        <Input
          id="promotion-delete-confirm"
          autoFocus
          autoComplete="off"
          placeholder={promotion.code}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
        />
      </Field>
    </PromotionDialog>
  );
}

function DeleteBlockedDialog({
  promotion,
  now,
  onClose,
  onPause,
}: {
  promotion: AdminPromotion;
  now: number;
  onClose: () => void;
  onPause: () => void;
}) {
  const { t } = useTranslate("promotions");
  const end = useEndPromotion();
  // โค้ดที่ยังไม่เริ่มไม่มีอะไรให้สิ้นสุด — ลบไม่ได้ก็หยุดไว้แทน
  const canEndToday = Date.parse(promotion.startsAt) < now;

  const endToday = () =>
    end.mutate(promotion.id, {
      onSuccess: () => {
        toast.add({ title: t("admin.promotionActionDialog.title13", "สิ้นสุดโค้ด {code} วันนี้แล้ว", { code: promotion.code }), type: "success" });
        onClose();
      },
      onError: (error) =>
        toast.add({ title: t("admin.promotionActionDialog.title14", "สิ้นสุดโค้ดไม่สำเร็จ"), description: promotionErrorMessage(error, t("admin.promotionActionDialog.promotionErrorMessage", "กรุณาลองอีกครั้ง")), type: "error" }),
    });

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="warning"
      icon={<TriangleAlert />}
      title={t("admin.promotionActionDialog.title15", "ลบโค้ดนี้ไม่ได้")}
      description={t("admin.promotionActionDialog.description6", "{code} ถูกเก็บ {value} ครั้ง และใช้ในคำสั่งซื้อ {value3} รายการ ต้องเก็บไว้เพื่อให้ใบเสร็จและบัญชีย้อนหลังถูกต้อง", { code: promotion.code, value: promotion.claimedCount.toLocaleString(intlLocale()), value3: promotion.usedCount.toLocaleString(intlLocale()) })}
      actions={
        <>
          <Button variant="outline" disabled={end.isPending} onClick={onClose}>
            {t("admin.promotionActionDialog.button6", "ปิด")}
          </Button>
          {canEndToday ? (
            <Button variant="outline" disabled={end.isPending} onClick={endToday}>
              {t("admin.promotionActionDialog.button7", "สิ้นสุดวันนี้")}
            </Button>
          ) : null}
          <Button disabled={end.isPending} onClick={onPause}>
            {t("admin.promotionActionDialog.button8", "หยุดชั่วคราว")}
          </Button>
        </>
      }
    >
      <p className={INFO_BOX}>
        {canEndToday
          ? t("admin.promotionActionDialog.p2", "ทางเลือก: หยุดชั่วคราว (เปิดคืนได้) หรือ ตั้งวันสิ้นสุดเป็นวันนี้ (โค้ดหมดอายุตามปกติ)")
          : t("admin.promotionActionDialog.p3", "ทางเลือก: หยุดชั่วคราว (เปิดคืนได้) — โค้ดยังไม่ถึงวันเริ่ม จึงสิ้นสุดวันนี้ไม่ได้")}
      </p>
    </PromotionDialog>
  );
}
