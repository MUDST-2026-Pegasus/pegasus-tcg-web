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
import { CheckRow } from "./PromotionFormControls";

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
  toast.add({ title, description: saleErrorMessage(error, "กรุณาลองอีกครั้ง"), type: "error" });
}

function PausePlatformSaleDialog({ sale, onClose }: { sale: AdminSale; onClose: () => void }) {
  const pause = usePauseSale();
  const submit = () =>
    pause.mutate(
      { id: sale.id, reason: null, notifySeller: false },
      {
        onSuccess: () => {
          toast.add({ title: `หยุด ${sale.name} แล้ว`, type: "success" });
          onClose();
        },
        onError: (error) => errorToast("หยุดแคมเปญไม่สำเร็จ", error),
      },
    );
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="warning"
      icon={<Pause />}
      title={`หยุด ${sale.name} ชั่วคราว?`}
      description={`${sale.listingCount.toLocaleString("th-TH")} listing กลับเป็นราคาปกติภายใน 1 นาที จนกว่าจะเปิดอีกครั้ง · ออเดอร์ที่จ่ายแล้วไม่กระทบ`}
      actions={
        <>
          <Button variant="outline" disabled={pause.isPending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button className={PROMOTION_DANGER_BUTTON} disabled={pause.isPending} onClick={submit}>
            หยุดแคมเปญ
          </Button>
        </>
      }
    />
  );
}

/** Figma SAL-M1 "การลดราคาของร้าน → หยุด" — เหตุผลบังคับ (ร้านเห็น) + แจ้งร้าน */
function PauseSellerSaleDialog({ sale, onClose }: { sale: AdminSale; onClose: () => void }) {
  const pause = usePauseSale();
  const [reason, setReason] = useState("");
  const [notifySeller, setNotifySeller] = useState(true);
  const shop = sale.owner?.username ?? "ร้านค้า";

  const submit = () =>
    pause.mutate(
      { id: sale.id, reason: reason.trim(), notifySeller },
      {
        onSuccess: () => {
          toast.add({ title: `หยุด “${sale.name}” แล้ว${notifySeller ? " · แจ้งร้านแล้ว" : ""}`, type: "success" });
          onClose();
        },
        onError: (error) => errorToast("หยุดการลดราคาไม่สำเร็จ", error),
      },
    );

  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="danger"
      icon={<Pause />}
      title={`หยุด “${sale.name}” ของ ${shop}?`}
      description="ร้านเป็นผู้ออกเงิน แอดมินแก้ไม่ได้ · หยุดแล้วร้านจะเห็นเหตุผลนี้และติดต่อทีมงานได้"
      footerNote="บันทึกใน Activity Log"
      actions={
        <>
          <Button variant="outline" disabled={pause.isPending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            className={PROMOTION_DANGER_BUTTON}
            disabled={!reason.trim() || pause.isPending}
            onClick={submit}
          >
            หยุดการลดราคา
          </Button>
        </>
      }
    >
      <Field className="gap-1.5">
        <FieldLabel htmlFor="sale-pause-reason" className="text-xs">
          เหตุผล (ร้านเห็น) *
        </FieldLabel>
        <Textarea
          id="sale-pause-reason"
          autoFocus
          className="min-h-16 text-sm"
          maxLength={300}
          placeholder="เช่น ราคาลดต่ำผิดปกติ กรุณาตรวจสอบราคา"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      <CheckRow id="sale-notify-paused" label="ส่งอีเมลแจ้งร้าน" checked={notifySeller} onChange={setNotifySeller} />
    </PromotionDialog>
  );
}

function ResumeSaleDialog({ sale, onClose }: { sale: AdminSale; onClose: () => void }) {
  const resume = useResumeSale();
  const submit = () =>
    resume.mutate(sale.id, {
      onSuccess: () => {
        toast.add({ title: `เปิด ${sale.name} อีกครั้งแล้ว`, type: "success" });
        onClose();
      },
      onError: (error) => errorToast("เปิดแคมเปญไม่สำเร็จ", error),
    });
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="success"
      icon={<CirclePlay />}
      title={`เปิด ${sale.name} อีกครั้ง?`}
      description="listing ที่เข้าเงื่อนไขได้ราคาลดกลับภายใน 1 นาที"
      actions={
        <>
          <Button variant="outline" disabled={resume.isPending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button disabled={resume.isPending} onClick={submit}>
            เปิดอีกครั้ง
          </Button>
        </>
      }
    >
      <div className={SUMMARY_BOX}>
        <p className={SUMMARY_ROW}>
          <span>เหตุผลที่หยุด</span>
          <strong>{sale.pauseReason || "ไม่ได้ระบุ"}</strong>
        </p>
        <p className={SUMMARY_ROW}>
          <span>ช่วงเวลา</span>
          <strong>{salePeriod(sale)}</strong>
        </p>
      </div>
    </PromotionDialog>
  );
}

/** Figma SAL-M1 "แคมเปญที่กำลังลด → จบทันที" */
function EndSaleDialog({ sale, onClose }: { sale: AdminSale; onClose: () => void }) {
  const end = useEndSale();
  const submit = () =>
    end.mutate(sale.id, {
      onSuccess: () => {
        toast.add({ title: `จบ ${sale.name} แล้ว`, type: "success" });
        onClose();
      },
      onError: (error) => errorToast("จบแคมเปญไม่สำเร็จ", error),
    });
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="warning"
      icon={<Square />}
      title={`จบ ${sale.name} ตอนนี้?`}
      description={`${sale.listingCount.toLocaleString("th-TH")} listing กลับเป็นราคาปกติทันที · ผู้ซื้อที่มีสินค้าในตะกร้าจะเห็น “ราคาเปลี่ยน” · ออเดอร์ที่จ่ายแล้วไม่กระทบ`}
      actions={
        <>
          <Button variant="outline" disabled={end.isPending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button className={PROMOTION_DANGER_BUTTON} disabled={end.isPending} onClick={submit}>
            จบแคมเปญ
          </Button>
        </>
      }
    >
      <div className={SUMMARY_BOX}>
        <p className={SUMMARY_ROW}>
          <span>ขายไปแล้ว</span>
          <strong>{sale.soldUnits.toLocaleString("th-TH")} ชิ้น</strong>
        </p>
        {sale.ownerType === "PLATFORM" ? (
          <p className={SUMMARY_ROW}>
            <span>อุดหนุนแล้ว</span>
            <strong>
              {formatBaht(sale.subsidyReserved)} / {sale.budgetCap == null ? "ไม่จำกัด" : formatBaht(sale.budgetCap)}
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
  const remove = useDeleteSale();
  const submit = () =>
    remove.mutate(sale.id, {
      onSuccess: () => {
        toast.add({ title: `ลบ ${sale.name} แล้ว`, type: "success" });
        onClose();
      },
      onError: (error) => {
        // มีออเดอร์เข้ามาระหว่างที่เปิดหน้าไว้
        if (hasErrorCode(error, "SALE_IN_USE")) onBlocked();
        else errorToast("ลบไม่สำเร็จ", error);
      },
    });
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="danger"
      icon={<Trash2 />}
      title={`ลบ “${sale.name}”?`}
      description="ยังไม่มีออเดอร์ที่ใช้ราคานี้ ลบแล้วกู้คืนไม่ได้"
      actions={
        <>
          <Button variant="outline" disabled={remove.isPending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button className={PROMOTION_DANGER_BUTTON} disabled={remove.isPending} onClick={submit}>
            ลบ
          </Button>
        </>
      }
    />
  );
}

/** Figma SAL-M1 "ลบแคมเปญที่มีออเดอร์แล้ว → SALE_IN_USE" */
function DeleteBlockedSaleDialog({ sale, onClose, onEnd }: { sale: AdminSale; onClose: () => void; onEnd: () => void }) {
  const canEnd = sale.status === "ACTIVE" || sale.status === "PAUSED";
  return (
    <PromotionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="info"
      icon={<Info />}
      title="ลบแคมเปญนี้ไม่ได้"
      description={`แคมเปญมีออเดอร์แล้ว (ขายไป ${sale.soldUnits.toLocaleString("th-TH")} ชิ้น) ต้องเก็บไว้เพื่อบัญชีและการคืนเงิน${canEnd ? " · ใช้ “จบแคมเปญ” แทน" : ""}`}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            ปิด
          </Button>
          {canEnd ? <Button onClick={onEnd}>จบแคมเปญแทน</Button> : null}
        </>
      }
    />
  );
}
