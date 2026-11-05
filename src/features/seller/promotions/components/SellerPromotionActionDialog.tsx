import { useState, type ReactNode } from "react";
import { AlertTriangle, CirclePause, CirclePlay, ShieldAlert, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { PROMOTION_DANGER_BUTTON } from "@/features/admin/promotions.styles";
import { getErrorMessage, hasErrorCode } from "@/lib/api";

import { useDeleteSellerPromotion, usePauseSellerPromotion, useResumeSellerPromotion } from "../promotions.queries";
import { formatPromoDateTime, limitLabel, thaiDate } from "../promotions.format";
import type { SellerPromotion } from "../promotions.types";
import type { PromotionAction } from "./SellerPromotionCard";

const SUPPORT_EMAIL = "support@pegasus.gg";
/**
 * Modal ของการกระทำบนการ์ดโค้ด (Figma PRM-M2): หยุดชั่วคราว, เปิดใช้อีกครั้ง, ลบ, ลบไม่ได้ (`PROMO_IN_USE`)
 * และทีมงานหยุดโค้ด — `key` ตาม action ให้ state ของ error รอบก่อนไม่ค้างมาถึงโค้ดถัดไป
 */
export function SellerPromotionActionDialog({
  action,
  onClose,
  onAction,
}: {
  action: PromotionAction | null;
  onClose: () => void;
  onAction: (action: PromotionAction) => void;
}) {
  if (!action) return null;
  return (
    <ActionDialog key={`${action.kind}-${action.code.id}`} action={action} onClose={onClose} onAction={onAction} />
  );
}

function ActionDialog({
  action,
  onClose,
  onAction,
}: {
  action: PromotionAction;
  onClose: () => void;
  onAction: (action: PromotionAction) => void;
}) {
  const pause = usePauseSellerPromotion();
  const resume = useResumeSellerPromotion();
  const remove = useDeleteSellerPromotion();
  const [serverBlocked, setServerBlocked] = useState(false);
  const [resumeBlocked, setResumeBlocked] = useState(false);
  const { code, kind } = action;
  const busy = pause.isPending || resume.isPending || remove.isPending;
  const close = (open: boolean) => {
    if (!open) onClose();
  };

  async function perform() {
    try {
      if (kind === "pause") await pause.mutateAsync(code.id);
      if (kind === "resume") await resume.mutateAsync(code.id);
      if (kind === "delete") await remove.mutateAsync(code.id);
      const verb = kind === "pause" ? "หยุด" : kind === "resume" ? "เปิดใช้" : "ลบ";
      toast.add({ title: `${verb}โค้ด ${code.code} แล้ว`, type: "success" });
      onClose();
    } catch (error) {
      if (hasErrorCode(error, "PROMO_IN_USE")) return setServerBlocked(true);
      if (hasErrorCode(error, "PROMO_PAUSED")) return setResumeBlocked(true);
      toast.add({
        title: "ทำรายการไม่สำเร็จ",
        description: hasErrorCode(error, "SELLER_NOT_VERIFIED")
          ? "กรุณายืนยันตัวตนผู้ขายก่อนทำรายการ"
          : getErrorMessage(error, "กรุณาลองอีกครั้ง"),
        type: "error",
      });
    }
  }

  if (kind === "admin" || resumeBlocked) return <StaffPausedDialog code={code} onClose={onClose} />;

  if (kind === "delete" && (serverBlocked || code.usedCount > 0 || code.claimedCount > 0)) {
    const canPauseInstead = code.status === "ACTIVE" || code.status === "SCHEDULED";
    return (
      <PromotionDialog
        open
        onOpenChange={close}
        tone="warning"
        icon={<AlertTriangle />}
        title={`ลบโค้ด ${code.code} ไม่ได้`}
        description={
          code.usedCount > 0
            ? `ลูกค้าใช้แล้ว ${code.usedCount} ครั้ง ต้องเก็บไว้เพื่อให้ใบเสร็จและรายได้ย้อนหลังถูกต้อง`
            : code.claimedCount > 0
              ? `ลูกค้าเก็บโค้ดไว้แล้ว ${code.claimedCount} คน ต้องเก็บไว้เพื่อไม่ให้โค้ดในกระเป๋าลูกค้าหายไป`
              : "มีคำสั่งซื้อที่ใช้โค้ดนี้แล้ว ต้องเก็บไว้เพื่อให้ใบเสร็จและรายได้ย้อนหลังถูกต้อง"
        }
        actions={
          <>
            <Button variant="outline" onClick={onClose}>
              ปิด
            </Button>
            {canPauseInstead ? (
              <Button onClick={() => onAction({ kind: "pause", code })}>หยุดชั่วคราวแทน</Button>
            ) : null}
          </>
        }
      >
        <p className="rounded-[10px] bg-sky-50 px-3 py-2.5 text-xs text-primary">
          ใช้ “หยุดชั่วคราว” แทน หรือแก้วันสิ้นสุดให้เป็นวันนี้
        </p>
      </PromotionDialog>
    );
  }

  const confirm = (label: string, danger: boolean) => (
    <>
      <Button variant="outline" onClick={onClose}>
        ยกเลิก
      </Button>
      <Button disabled={busy} className={danger ? PROMOTION_DANGER_BUTTON : undefined} onClick={() => void perform()}>
        {label}
      </Button>
    </>
  );

  if (kind === "pause") {
    return (
      <PromotionDialog
        open
        onOpenChange={close}
        tone="warning"
        icon={<CirclePause />}
        title={`หยุดโค้ด ${code.code} ชั่วคราว?`}
        description="ลูกค้าจะเก็บหรือใช้โค้ดนี้ไม่ได้จนกว่าคุณจะเปิดอีกครั้ง"
        actions={confirm("หยุดโค้ด", true)}
      >
        <SummaryBox
          rows={[
            ["ลูกค้าที่เก็บไว้", `${code.claimedCount} คน`],
            [
              "ออเดอร์รอชำระที่ใช้โค้ดนี้",
              code.pendingOrderCount == null ? "—" : `${code.pendingOrderCount} รายการ`,
            ],
          ]}
        />
        <p className="text-[11px] text-muted-foreground">
          โค้ดยังอยู่ในกระเป๋าลูกค้าพร้อมป้าย “หยุดชั่วคราว” · ออเดอร์รอชำระยังได้ส่วนลดจนหมดเวลาชำระ ·
          แถบโค้ดบนหน้าร้านซ่อนโค้ดนี้
        </p>
      </PromotionDialog>
    );
  }

  if (kind === "resume") {
    const remaining =
      code.usageLimitTotal == null ? "ไม่จำกัด" : limitLabel(Math.max(0, code.usageLimitTotal - code.usedCount));
    return (
      <PromotionDialog
        open
        onOpenChange={close}
        tone="success"
        icon={<CirclePlay />}
        title={`เปิดใช้ ${code.code} อีกครั้ง?`}
        description={
          code.claimedCount > 0
            ? `ลูกค้าที่เก็บไว้ ${code.claimedCount} คนใช้ได้ทันที และโค้ดกลับมาแสดงบนหน้าร้าน`
            : "ลูกค้าใช้โค้ดได้ทันที และโค้ดกลับมาแสดงบนหน้าร้าน"
        }
        actions={confirm("เปิดใช้โค้ด", false)}
      >
        <SummaryBox
          rows={[
            ["สิทธิ์คงเหลือ", remaining],
            ["หมดอายุ", thaiDate(code.endsAt)],
          ]}
        />
      </PromotionDialog>
    );
  }

  return (
    <PromotionDialog
      open
      onOpenChange={close}
      tone="danger"
      icon={<Trash2 />}
      title={`ลบโค้ด ${code.code}?`}
      description="ยังไม่มีลูกค้าเก็บหรือใช้โค้ดนี้ ลบแล้วกู้คืนไม่ได้"
      actions={confirm("ลบโค้ด", true)}
    />
  );
}

/** INFO — โค้ดที่ทีมงานหยุด ร้านเปิดใช้เองไม่ได้ */
function StaffPausedDialog({ code, onClose }: { code: SellerPromotion; onClose: () => void }) {
  const reference = `PRM-${code.id}`;
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      tone="danger"
      icon={<ShieldAlert />}
      title={`ทีมงานหยุดโค้ด ${code.code}`}
      description={`หยุดเมื่อ ${code.pausedAt ? formatPromoDateTime(code.pausedAt) : "—"} · คุณเปิดใช้เองไม่ได้`}
      footerNote={`อ้างอิง #${reference}`}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            ปิด
          </Button>
          <Button
            nativeButton={false}
            render={
              <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`โค้ด ${code.code} (#${reference})`)}`} />
            }
          >
            ติดต่อทีมงาน
          </Button>
        </>
      }
    >
      <p className="rounded-[10px] bg-red-50 px-3 py-2.5 text-xs text-red-700">
        เหตุผล: {code.pauseReason || "โปรดติดต่อทีมงานเพื่อสอบถามรายละเอียด"}
      </p>
      <div className="grid gap-1.5 text-xs">
        <strong className="font-semibold">สิ่งที่ทำได้</strong>
        <ul className="grid list-disc gap-1.5 pl-4 text-foreground/80">
          <li>สร้างโค้ดใหม่ที่มีขั้นต่ำและเพดานส่วนลด</li>
          <li>ติดต่อทีมงานพร้อมเลขอ้างอิงด้านล่าง ถ้าคิดว่าเป็นความผิดพลาด</li>
        </ul>
      </div>
    </PromotionDialog>
  );
}

function SummaryBox({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-2 rounded-[10px] bg-muted px-3.5 py-3 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start gap-3">
          <dt className="flex-1 text-muted-foreground">{label}</dt>
          <dd className="font-semibold whitespace-nowrap">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
