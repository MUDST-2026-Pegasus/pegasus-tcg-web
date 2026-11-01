import { useState } from "react";
import { AlertTriangle, Pause, Play, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/toast";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { getErrorMessage, hasErrorCode } from "@/lib/api";
import {
  useDeleteSellerPromotion, usePauseSellerPromotion, useResumeSellerPromotion,
} from "../promotions.queries";
import { thaiDate, formatPromoDateTime, limitLabel } from "../promotions.format";
import type { PromotionAction } from "./SellerPromotionCard";

export function SellerPromotionActionDialog({
  action, onClose, onAction,
}: {
  action: PromotionAction | null;
  onClose: () => void;
  onAction: (action: PromotionAction) => void;
}) {
  const pause = usePauseSellerPromotion();
  const resume = useResumeSellerPromotion();
  const remove = useDeleteSellerPromotion();
  const [blockedId, setBlockedId] = useState<number | null>(null);
  const [resumeBlocked, setResumeBlocked] = useState(false);
  if (!action) return null;
  const { code, kind } = action;
  const blocked = kind === "delete" &&
    (blockedId === code.id || code.usedCount > 0 || code.claimedCount > 0);
  const canPauseInstead = code.status === "ACTIVE" || code.status === "SCHEDULED";
  const busy = pause.isPending || resume.isPending || remove.isPending;

  async function perform() {
    try {
      if (kind === "pause") await pause.mutateAsync(code.id);
      if (kind === "resume") await resume.mutateAsync(code.id);
      if (kind === "delete") await remove.mutateAsync(code.id);
      toast.add({
        title: `${kind === "pause" ? "หยุด" : kind === "resume" ? "เปิดใช้" : "ลบ"}โค้ด ${code.code} แล้ว`,
        type: "success",
      });
      onClose();
    } catch (error) {
      if (hasErrorCode(error, "PROMO_IN_USE")) {
        setBlockedId(code.id);
        return;
      }
      if (hasErrorCode(error, "PROMO_PAUSED")) {
        setResumeBlocked(true);
        return;
      }
      toast.add({
        title: "ทำรายการไม่สำเร็จ",
        description: hasErrorCode(error, "SELLER_NOT_VERIFIED")
          ? "กรุณายืนยันตัวตนผู้ขายก่อนทำรายการ"
          : getErrorMessage(error, "กรุณาลองอีกครั้ง"),
        type: "error",
      });
    }
  }

  const title = kind === "admin" || resumeBlocked
    ? `ทีมงานหยุดโค้ด ${code.code}`
    : kind === "delete"
      ? blocked ? `ลบโค้ด ${code.code} ไม่ได้` : `ลบโค้ด ${code.code}?`
      : kind === "pause" ? `หยุดโค้ด ${code.code} ชั่วคราว?`
        : `เปิดใช้ ${code.code} อีกครั้ง?`;
  const tone = kind === "admin" || resumeBlocked ? "info" :
    blocked || kind === "pause" ? "warning" : kind === "delete" ? "danger" : "success";
  const icon = kind === "admin" || resumeBlocked ? <ShieldAlert /> :
    blocked ? <AlertTriangle /> : kind === "pause" ? <Pause /> :
      kind === "delete" ? <Trash2 /> : <Play />;
  const description = kind === "admin" || resumeBlocked
    ? `หยุดเมื่อ ${code.pausedAt ? formatPromoDateTime(code.pausedAt) : "—"} · คุณเปิดใช้เองไม่ได้`
    : kind === "pause" ? "ลูกค้าจะเก็บหรือใช้โค้ดนี้ไม่ได้จนกว่าคุณจะเปิดอีกครั้ง"
      : kind === "resume" ? "ลูกค้าที่เก็บไว้จะใช้ได้ทันที และโค้ดกลับมาแสดงบนหน้าร้าน"
        : blocked
          ? `ลูกค้าใช้แล้ว ${code.usedCount} ครั้ง ต้องเก็บโค้ดไว้เพื่อให้ใบเสร็จและรายได้ย้อนหลังถูกต้อง`
          : "ยังไม่มีลูกค้าเก็บหรือใช้โค้ดนี้ ลบแล้วกู้คืนไม่ได้";

  return (
    <PromotionDialog open onOpenChange={(open) => { if (!open) onClose(); }}
      tone={tone} icon={icon} title={title} description={description}
      footerNote={kind === "admin" || resumeBlocked ? `อ้างอิง #PRM-${code.id}` : undefined}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            {kind === "admin" || blocked || resumeBlocked ? "ปิด" : "ยกเลิก"}
          </Button>
          {kind === "admin" || resumeBlocked ? (
            <Button render={<a href="mailto:support@pegasus.gg" />} nativeButton={false}>
              ติดต่อทีมงาน
            </Button>
          ) : blocked ? canPauseInstead && (
            <Button onClick={() => { setBlockedId(null); onAction({ kind: "pause", code }); }}>
              หยุดชั่วคราวแทน
            </Button>
          ) : (
            <Button disabled={busy} onClick={() => void perform()}
              className={kind === "pause" || kind === "delete"
                ? "bg-destructive text-white hover:bg-destructive/90" : undefined}>
              {kind === "pause" ? "หยุดโค้ด" : kind === "resume" ? "เปิดใช้โค้ด" : "ลบโค้ด"}
            </Button>
          )}
        </>
      }>
      {kind === "pause" && (
        <>
          <div className="grid gap-1.5 rounded-lg bg-muted p-3 text-xs [&_span]:flex [&_span]:justify-between [&_span]:gap-2">
            <span>ลูกค้าเก็บไว้ <strong>{code.claimedCount} คน</strong></span>
            <span>ออเดอร์รอชำระ <strong>{code.pendingOrderCount == null
              ? "—" : `${code.pendingOrderCount} ออเดอร์`}</strong></span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            โค้ดยังอยู่ในกระเป๋าลูกค้าพร้อมป้าย “หยุดชั่วคราว” · ออเดอร์รอชำระยังได้ส่วนลดจนหมดเวลาชำระ · แถบโค้ดบนหน้าร้านซ่อนโค้ดนี้
          </p>
        </>
      )}
      {kind === "resume" && !resumeBlocked && (
        <div className="grid gap-1.5 rounded-lg bg-muted p-3 text-xs [&_span]:flex [&_span]:justify-between [&_span]:gap-2">
          <span>สิทธิ์คงเหลือ <strong>{code.usageLimitTotal == null
            ? "ไม่จำกัด" : limitLabel(Math.max(0, code.usageLimitTotal - code.usedCount))}</strong></span>
          <span>หมดอายุ <strong>{thaiDate(code.endsAt)}</strong></span>
        </div>
      )}
      {blocked && (
        <Alert className="border-sky-200 bg-sky-50 text-sky-800">
          <AlertDescription>ใช้ “หยุดชั่วคราว” แทน หรือแก้วันสิ้นสุดให้เป็นวันนี้</AlertDescription>
        </Alert>
      )}
      {(kind === "admin" || resumeBlocked) && (
        <>
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
            เหตุผล: {code.pauseReason || "โปรดติดต่อทีมงาน"}
          </div>
          <div className="text-xs text-muted-foreground">
            <strong className="text-foreground">สิ่งที่ทำได้</strong>
            <ul className="mt-1 list-disc pl-5">
              <li>ติดต่อทีมงานพร้อมแจ้งรหัสโค้ด {code.code}</li>
              <li>ตรวจสอบเหตุผลและขอรายละเอียดก่อนเปิดใช้อีกครั้ง</li>
            </ul>
          </div>
        </>
      )}
    </PromotionDialog>
  );
}
