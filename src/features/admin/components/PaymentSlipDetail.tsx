import { useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, FileImage, Landmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { formatAccountNumber, formatBaht, formatThaiDateTime } from "../finance.format";
import { useTransferAccount } from "../finance.queries";
import type { PaymentReview } from "../finance.types";
import { InfoField, PartyAvatar } from "./FinanceShared";

type PaymentSlipDetailProps = {
  payment: PaymentReview;
  busy: "approve" | "reject" | null;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onSkip: (() => void) | null;
};

/**
 * คอลัมน์ขวาของหน้าตรวจสลิป — รูปสลิป + ข้อมูลที่ต้องตรงกับสลิป + ผลที่ระบบตรวจให้แล้ว
 * + การแบ่งเงินเข้า escrow ของแต่ละร้าน แล้วจบด้วยการ์ดผลการตรวจสอบ
 *
 * ผู้เรียกใส่ `key={payment.id}` ให้ช่องเหตุผลล้างเองเมื่อเปลี่ยนรายการ
 */
export function PaymentSlipDetail({ payment, busy, onApprove, onReject, onSkip }: PaymentSlipDetailProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const platformAccount = useTransferAccount();
  const amountMatches = payment.unpaidTotal === payment.amount;
  const splitTotal = payment.splits.reduce((sum, split) => sum + split.grandTotal, 0);

  const reject = () => {
    if (!reason.trim()) {
      setReasonError(true);
      return;
    }
    onReject(reason.trim());
  };

  const account = platformAccount.data;
  const fields = [
    { label: "ยอดที่ต้องชำระ", value: formatBaht(payment.amount), large: true },
    { label: "เลขอ้างอิงที่ผู้ซื้อกรอก", value: payment.referenceCode ?? "—" },
    {
      label: "โอนเข้าบัญชี (แพลตฟอร์ม)",
      value: account?.accountNumber
        ? `${account.bankName ?? ""} · ${formatAccountNumber(account.accountNumber)}`
        : "—",
    },
    { label: "ชื่อบัญชีปลายทาง", value: account?.accountName ?? "—" },
    { label: "วิธีชำระ", value: payment.method === "BANK_TRANSFER" ? "โอนผ่านธนาคาร" : payment.method },
    { label: "สร้างรายการเมื่อ", value: formatThaiDateTime(payment.createdAt) },
  ];

  const checks = [
    { ok: payment.slipUrl !== null, label: "อัปโหลดไฟล์สลิปสำเร็จ", failLabel: "ยังไม่มีไฟล์สลิป" },
    {
      ok: amountMatches,
      label: `ยอดตรงกับยอดค้างชำระ ${formatBaht(payment.unpaidTotal)}`,
      failLabel: `ยอดไม่ตรงกับยอดค้างชำระ ${formatBaht(payment.unpaidTotal)} — อนุมัติไม่ได้`,
    },
    // ไฟล์สลิปซ้ำถูกกันไว้ตั้งแต่ตอนแนบ (unique index บน slip_image_key) ถ้าอยู่ในคิวแปลว่าผ่านแล้ว
    { ok: true, label: "สลิปนี้ไม่เคยใช้กับรายการชำระอื่น", failLabel: "" },
  ];
  const allPassed = checks.every((check) => check.ok);

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
      <Card className="gap-5 rounded-xl border border-border p-5 shadow-none ring-0">
        <div className="flex items-center gap-3.5">
          <PartyAvatar party={payment.buyer} className="size-[52px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{payment.buyer.username}</h2>
              <Badge className="h-5 rounded-full bg-[#fdf0dd] px-2 text-[11px] font-medium text-[#b45309]">
                รอตรวจสอบ
              </Badge>
              <Badge className="h-5 rounded-[5px] bg-muted px-2 text-[10px] font-medium text-muted-foreground">
                {payment.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              PAY-{payment.id} · คำสั่งซื้อ {payment.orderNumber} · สร้างรายการเมื่อ{" "}
              {formatThaiDateTime(payment.createdAt)} · หมดเวลาชำระ {formatThaiDateTime(payment.expiresAt)}
            </p>
          </div>
        </div>

        <Separator className="w-60! bg-muted" />

        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <SlipPreview url={payment.slipUrl} paymentId={payment.id} />

          <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
            <p className="text-[13px] font-semibold text-foreground">ข้อมูลที่ต้องตรงกับสลิป</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <InfoField key={field.label} label={field.label} value={field.value} large={field.large} />
              ))}
            </div>

            <div
              className={cn(
                "flex flex-col gap-2 rounded-[10px] p-3.5",
                allPassed ? "bg-[#e3f4ec]" : "bg-[#fbe9e8]",
              )}
            >
              <p className={cn("text-xs font-semibold", allPassed ? "text-[#007a4a]" : "text-[#d0342c]")}>
                ระบบตรวจให้แล้วตอนแนบสลิป
              </p>
              {checks.map((check) => (
                <div key={check.label} className="flex items-center gap-2 text-xs text-[#414755]">
                  {check.ok ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-[#007a4a]" />
                  ) : (
                    <AlertTriangle className="size-3.5 shrink-0 text-[#d0342c]" />
                  )}
                  {check.ok ? check.label : check.failLabel}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 rounded-[10px] border border-border p-3.5">
              <div className="flex items-center gap-1.5">
                <Landmark className="size-[13px] text-foreground" />
                <p className="text-xs font-semibold text-foreground">
                  เมื่ออนุมัติ เงินจะถูกพักใน escrow แยกตามร้าน
                </p>
              </div>
              {payment.splits.map((split) => (
                <div key={split.sellerOrderId} className="flex items-center gap-2 text-xs">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate font-medium text-foreground">{split.seller.username}</span>
                    <span className="truncate text-[11px] text-[#9aa5ad]">{split.sellerOrderNumber}</span>
                  </div>
                  <span className="font-medium text-foreground">{formatBaht(split.grandTotal)}</span>
                </div>
              ))}
              <div className="flex items-start gap-2 border-t border-border pt-2 text-xs text-foreground">
                <span className="flex-1 font-semibold">รวม</span>
                <span className="font-bold">{formatBaht(splitTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="gap-3 rounded-xl border border-border px-5 py-[18px] shadow-none ring-0">
        <div className="flex flex-col gap-[3px]">
          <p className="text-sm font-semibold text-foreground">ผลการตรวจสอบ</p>
          <p className="text-xs text-muted-foreground">
            ตรวจยอด วันเวลา และบัญชีปลายทางในสลิปให้ตรงกับข้อมูลด้านบน · ถ้าปฏิเสธต้องระบุเหตุผล
            และผู้ซื้อต้องสร้างรายการชำระใหม่
          </p>
        </div>
        <Textarea
          aria-label="เหตุผลที่ปฏิเสธ"
          rows={3}
          maxLength={255}
          value={reason}
          aria-invalid={reasonError}
          onChange={(event) => {
            setReason(event.target.value);
            setReasonError(false);
          }}
          placeholder="เหตุผลที่ปฏิเสธ (จำเป็นเมื่อปฏิเสธ) เช่น ยอดในสลิปไม่ตรง, สลิปไม่ชัด, โอนเข้าบัญชีผิด"
          className="min-h-[72px] rounded-lg border-input bg-background"
        />
        {reasonError && (
          <p role="alert" className="text-xs text-destructive">
            กรอกเหตุผลก่อนปฏิเสธสลิป
          </p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            disabled={onSkip === null || busy !== null}
            onClick={() => onSkip?.()}
          >
            ข้ามไปรายการถัดไป
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-md bg-destructive px-2.5 text-white hover:bg-destructive/90"
            disabled={busy !== null}
            onClick={reject}
          >
            {busy === "reject" && <Spinner data-icon="inline-start" />}
            ปฏิเสธสลิป
          </Button>
          <Button
            size="sm"
            className="rounded-md px-2.5"
            disabled={busy !== null || !amountMatches || payment.slipUrl === null}
            onClick={onApprove}
          >
            {busy === "approve" && <Spinner data-icon="inline-start" />}
            อนุมัติการชำระเงิน
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** รูปสลิปจาก presigned URL — เป็น PDF หรือลิงก์หมดอายุก็ยังมีปุ่มเปิดไฟล์ให้ */
function SlipPreview({ url, paymentId }: { url: string | null; paymentId: number }) {
  const [broken, setBroken] = useState(false);
  const fileName = url ? fileNameOf(url) : null;

  return (
    <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-[10px] border border-border bg-card md:w-[250px]">
      <a
        href={url ?? undefined}
        target="_blank"
        rel="noreferrer"
        aria-label="เปิดสลิปขนาดเต็ม"
        className={cn(
          "flex h-[330px] flex-col items-center justify-center gap-2 bg-secondary",
          url === null && "pointer-events-none",
        )}
      >
        {url && !broken ? (
          <img
            src={url}
            alt={`สลิปโอนเงินของ PAY-${paymentId}`}
            className="size-full object-contain"
            onError={() => setBroken(true)}
          />
        ) : (
          <>
            <FileImage className="size-[26px] text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {url ? "ภาพสลิปโอนเงิน" : "ไม่มีไฟล์สลิป"}
            </span>
            {url && <span className="text-[10px] text-[#9aa5ad]">คลิกเพื่อเปิดไฟล์</span>}
          </>
        )}
      </a>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-xs font-medium text-foreground">
            {fileName || `slip_PAY-${paymentId}`}
          </span>
          <span className="text-[10px] text-[#9aa5ad]">ลิงก์ชั่วคราว · ดึงคิวใหม่ถ้าเปิดไม่ขึ้น</span>
        </div>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" aria-label="เปิดสลิปในแท็บใหม่">
            <ExternalLink className="size-[15px] text-muted-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}

function fileNameOf(url: string): string {
  try {
    return decodeURIComponent(new URL(url, window.location.origin).pathname.split("/").pop() ?? "");
  } catch {
    return "";
  }
}
