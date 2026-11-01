import { useState } from "react";
import { CirclePlay, Pause, ShieldAlert, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { hasErrorCode } from "@/lib/api";

import {
  SELLER_PAUSE_REASONS,
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
import { CheckRow } from "./PromotionFormControls";

const SUMMARY_BOX = "grid gap-1 rounded-lg bg-muted px-3.5 py-2.5 text-xs";
const SUMMARY_ROW = "flex justify-between gap-3 text-muted-foreground [&>strong]:font-semibold [&>strong]:text-foreground";
const INFO_BOX = "rounded-lg bg-[#e8f1fc] px-3.5 py-2.5 text-xs text-[#0058bc]";

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
  const pause = usePausePromotion();
  const setHomeOrder = useSetHomeOrder();
  const onHome = homeIds.includes(promotion.id);
  const [hideFromHome, setHideFromHome] = useState(onHome);
  const pending = pause.isPending || setHomeOrder.isPending;

  const submit = async () => {
    try {
      await pause.mutateAsync({ id: promotion.id, reason: null, notifySeller: false });
      if (onHome && hideFromHome) await setHomeOrder.mutateAsync(homeIds.filter((id) => id !== promotion.id));
      toast.add({ title: `หยุดโค้ด ${promotion.code} แล้ว`, type: "success" });
      onClose();
    } catch (error) {
      toast.add({ title: "หยุดโค้ดไม่สำเร็จ", description: promotionErrorMessage(error, "กรุณาลองอีกครั้ง"), type: "error" });
    }
  };

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="warning"
      icon={<Pause />}
      title={`หยุดโค้ด ${promotion.code} ชั่วคราว?`}
      description="ผู้ซื้อจะเก็บหรือใช้โค้ดนี้ไม่ได้จนกว่าจะเปิดอีกครั้ง · ออเดอร์ที่ชำระแล้วไม่ถูกกระทบ"
      actions={
        <>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="destructive" disabled={pending} onClick={() => void submit()}>
            หยุดโค้ด
          </Button>
        </>
      }
    >
      <div className={SUMMARY_BOX}>
        <p className={SUMMARY_ROW}>
          <span>ผู้ที่เก็บไว้</span>
          <strong>{promotion.claimedCount.toLocaleString("th-TH")} คน</strong>
        </p>
        <p className={SUMMARY_ROW}>
          <span>ออเดอร์รอชำระที่ใช้โค้ดนี้</span>
          <strong>{promotion.reservedOrders.toLocaleString("th-TH")} รายการ</strong>
        </p>
      </div>
      <p className="text-[11px] leading-4 text-muted-foreground">
        ผู้ที่เก็บไว้ยังเห็นโค้ดในกระเป๋าพร้อมป้าย “หยุดชั่วคราว” · ออเดอร์รอชำระยังได้ส่วนลดเดิมจนหมดเวลาชำระ
      </p>
      {onHome ? (
        <CheckRow
          id="promotion-hide-from-home"
          label="ซ่อนจากหน้าแรกระหว่างหยุด"
          checked={hideFromHome}
          onChange={setHideFromHome}
        />
      ) : null}
    </PromotionDialog>
  );
}

function PauseSellerDialog({ promotion, onClose }: { promotion: AdminPromotion; onClose: () => void }) {
  const pause = usePausePromotion();
  const [category, setCategory] = useState("");
  const [detail, setDetail] = useState("");
  const [notifySeller, setNotifySeller] = useState(true);
  const shop = promotion.owner?.username ?? "ร้านค้า";
  const valid = category !== "" && detail.trim() !== "";

  const submit = () =>
    pause.mutate(
      { id: promotion.id, reason: `${category}: ${detail.trim()}`, notifySeller },
      {
        onSuccess: () => {
          toast.add({
            title: `หยุดโค้ด ${promotion.code} แล้ว${notifySeller ? " · แจ้งร้านแล้ว" : ""}`,
            type: "success",
          });
          onClose();
        },
        onError: (error) =>
          toast.add({ title: "หยุดโค้ดไม่สำเร็จ", description: promotionErrorMessage(error, "กรุณาลองอีกครั้ง"), type: "error" }),
      },
    );

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="danger"
      icon={<ShieldAlert />}
      title={`หยุดโค้ด ${promotion.code} ของร้าน ${shop}?`}
      description="โค้ดใช้ไม่ได้ทันที ร้านจะเห็นเหตุผลนี้และเปิดใช้เองไม่ได้ · ออเดอร์ที่ใช้ไปแล้วไม่ถูกกระทบ"
      footerNote="บันทึกใน Activity Log"
      actions={
        <>
          <Button variant="outline" disabled={pause.isPending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="destructive" disabled={!valid || pause.isPending} onClick={submit}>
            หยุดโค้ดร้าน
          </Button>
        </>
      }
    >
      <label className="grid gap-1.5 text-xs font-medium">
        เหตุผล *
        <NativeSelect value={category} onChange={(event) => setCategory(event.target.value)} className="w-full">
          <NativeSelectOption value="">เลือกเหตุผล</NativeSelectOption>
          {SELLER_PAUSE_REASONS.map((reason) => (
            <NativeSelectOption key={reason} value={reason}>
              {reason}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>
      <label className="grid gap-1.5 text-xs font-medium">
        รายละเอียดถึงร้าน *
        <Textarea
          className="min-h-16 text-sm"
          maxLength={230}
          placeholder="ระบุรายละเอียดที่ร้านจะได้รับ"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
        />
      </label>
      <CheckRow
        id="promotion-notify-paused"
        label="แจ้งร้านทางอีเมลและแจ้งเตือนในแอป"
        checked={notifySeller}
        onChange={setNotifySeller}
        tone="danger"
      />
    </PromotionDialog>
  );
}

function ResumeDialog({ promotion, onClose }: { promotion: AdminPromotion; onClose: () => void }) {
  const resume = useResumePromotion();
  const isSeller = promotion.ownerType === "SELLER";
  const [notifySeller, setNotifySeller] = useState(true);
  const remaining =
    promotion.usageLimitTotal == null
      ? "ไม่จำกัด"
      : `${Math.max(0, promotion.usageLimitTotal - promotion.usedCount).toLocaleString("th-TH")} / ${limitLabel(promotion.usageLimitTotal)}`;

  const submit = () =>
    resume.mutate(
      { id: promotion.id, notifySeller: isSeller && notifySeller },
      {
        onSuccess: () => {
          toast.add({ title: `เปิดใช้ ${promotion.code} อีกครั้งแล้ว`, type: "success" });
          onClose();
        },
        onError: (error) =>
          toast.add({ title: "เปิดใช้โค้ดไม่สำเร็จ", description: promotionErrorMessage(error, "กรุณาลองอีกครั้ง"), type: "error" }),
      },
    );

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="success"
      icon={<CirclePlay />}
      title={`เปิดใช้ ${promotion.code} อีกครั้ง?`}
      description={
        promotion.pausedAt
          ? `หยุด${promotion.pausedBy ? `โดย ${maskBuyer(promotion.pausedBy)} ` : ""}เมื่อ ${formatPromoDateTime(promotion.pausedAt)}`
          : undefined
      }
      footerNote={isSeller ? "บันทึกใน Activity Log" : undefined}
      actions={
        <>
          <Button variant="outline" disabled={resume.isPending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button disabled={resume.isPending} onClick={submit}>
            เปิดใช้โค้ด
          </Button>
        </>
      }
    >
      <div className="grid gap-1 rounded-lg bg-muted px-3.5 py-2.5 text-[11px] text-muted-foreground [&>strong]:text-xs [&>strong]:font-medium [&>strong]:text-foreground">
        <span>เหตุผลที่หยุด</span>
        <strong>{promotion.pauseReason || "ไม่ได้ระบุเหตุผล"}</strong>
      </div>
      <div className={SUMMARY_BOX}>
        <p className={SUMMARY_ROW}>
          <span>สิทธิ์คงเหลือ</span>
          <strong>{remaining}</strong>
        </p>
        <p className={SUMMARY_ROW}>
          <span>หมดอายุ</span>
          <strong>{formatPromoDate(promotion.endsAt)}</strong>
        </p>
      </div>
      {isSeller ? (
        <CheckRow
          id="promotion-notify-resumed"
          label="แจ้งร้านว่าเปิดใช้แล้ว"
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
  const remove = useDeletePromotion();
  const [typed, setTyped] = useState("");
  const confirmed = typed.trim().toUpperCase() === promotion.code;

  const submit = () =>
    remove.mutate(promotion.id, {
      onSuccess: () => {
        toast.add({ title: `ลบโค้ด ${promotion.code} แล้ว`, type: "success" });
        onClose();
      },
      onError: (error) => {
        // มีคนเก็บหรือใช้ระหว่างที่เปิดหน้าไว้
        if (hasErrorCode(error, "PROMO_IN_USE")) onBlocked();
        else toast.add({ title: "ลบไม่สำเร็จ", description: promotionErrorMessage(error, "กรุณาลองอีกครั้ง"), type: "error" });
      },
    });

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="danger"
      icon={<Trash2 />}
      title={`ลบโค้ด ${promotion.code}?`}
      description="ยังไม่มีใครเก็บหรือใช้โค้ดนี้ ลบแล้วกู้คืนไม่ได้"
      actions={
        <>
          <Button variant="outline" disabled={remove.isPending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="destructive" disabled={!confirmed || remove.isPending} onClick={submit}>
            ลบโค้ด
          </Button>
        </>
      }
    >
      <label className="grid gap-1.5 text-xs font-medium">
        พิมพ์ {promotion.code} เพื่อยืนยัน
        <Input
          autoFocus
          autoComplete="off"
          placeholder={promotion.code}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
        />
      </label>
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
  const end = useEndPromotion();
  // โค้ดที่ยังไม่เริ่มไม่มีอะไรให้สิ้นสุด — ลบไม่ได้ก็หยุดไว้แทน
  const canEndToday = Date.parse(promotion.startsAt) < now;

  const endToday = () =>
    end.mutate(promotion.id, {
      onSuccess: () => {
        toast.add({ title: `สิ้นสุดโค้ด ${promotion.code} วันนี้แล้ว`, type: "success" });
        onClose();
      },
      onError: (error) =>
        toast.add({ title: "สิ้นสุดโค้ดไม่สำเร็จ", description: promotionErrorMessage(error, "กรุณาลองอีกครั้ง"), type: "error" }),
    });

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="warning"
      icon={<TriangleAlert />}
      title="ลบโค้ดนี้ไม่ได้"
      description={`${promotion.code} ถูกเก็บ ${promotion.claimedCount.toLocaleString("th-TH")} ครั้ง และใช้ในคำสั่งซื้อ ${promotion.usedCount.toLocaleString("th-TH")} รายการ ต้องเก็บไว้เพื่อให้ใบเสร็จและบัญชีย้อนหลังถูกต้อง`}
      actions={
        <>
          <Button variant="outline" disabled={end.isPending} onClick={onClose}>
            ปิด
          </Button>
          {canEndToday ? (
            <Button variant="outline" disabled={end.isPending} onClick={endToday}>
              สิ้นสุดวันนี้
            </Button>
          ) : null}
          <Button disabled={end.isPending} onClick={onPause}>
            หยุดชั่วคราว
          </Button>
        </>
      }
    >
      <p className={INFO_BOX}>
        {canEndToday
          ? "ทางเลือก: หยุดชั่วคราว (เปิดคืนได้) หรือ ตั้งวันสิ้นสุดเป็นวันนี้ (โค้ดหมดอายุตามปกติ)"
          : "ทางเลือก: หยุดชั่วคราว (เปิดคืนได้) — โค้ดยังไม่ถึงวันเริ่ม จึงสิ้นสุดวันนี้ไม่ได้"}
      </p>
    </PromotionDialog>
  );
}
