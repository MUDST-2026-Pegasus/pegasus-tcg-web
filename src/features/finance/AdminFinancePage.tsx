import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getErrorMessage } from "@/lib/api";
import { financeApi } from "./finance.api";
import type { Payout } from "./finance.types";

const money = (value: number) => `฿${Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;

function RefundTransferHistory({ refundId }: { refundId: number }) {
  const [open, setOpen] = useState(false);
  const history = useQuery({
    queryKey: ["finance", "refund-transfers", refundId],
    queryFn: () => financeApi.refundTransfers(refundId),
    enabled: open,
  });
  return <div className="space-y-2">
    <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>{open ? "ปิดประวัติการโอน" : "ประวัติการโอน"}</Button>
    {open && history.isPending && <p>กำลังโหลดประวัติ...</p>}
    {open && history.isError && <p role="alert">โหลดประวัติไม่สำเร็จ</p>}
    {open && history.data?.length === 0 && <p>ยังไม่มีการโอน</p>}
    {open && history.data?.map((attempt) => <p key={attempt.id} className="text-sm">
      {new Date(attempt.startedAt).toLocaleString("th-TH")} · {attempt.status} · {attempt.accountNumber ?? "—"}
      {attempt.transferReference ? ` · ${attempt.transferReference}` : ""}
    </p>)}
  </div>;
}

function PaidPayout({ payout, onSaved }: { payout: Payout; onSaved: () => void }) {
  const slip = useFileUpload({ purpose: "PAYOUT_SLIP" });
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    const key = slip.objectKeys[0];
    if (!key || !reference.trim() || !window.confirm("ยืนยันว่าโอนเงินจริงแล้ว?")) return;
    setSaving(true);
    try {
      await financeApi.completePayout(payout.id, reference.trim(), key);
      toast.add({ type: "success", title: "บันทึกการโอนแล้ว" });
      onSaved();
    } catch (error) {
      toast.add({ type: "error", title: "บันทึกไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") });
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input className="max-w-56" aria-label={`เลขอ้างอิงถอนเงิน ${payout.id}`} placeholder="เลขอ้างอิงการโอน" value={reference} onChange={(event) => setReference(event.target.value)} />
      <Input className="max-w-56" type="file" accept={slip.accept} aria-label={`สลิปถอนเงิน ${payout.id}`} onChange={(event) => { if (event.target.files?.length) slip.addFiles(event.target.files); }} />
      {slip.items[0]?.status === "error" && <p role="alert" className="text-destructive">{slip.items[0].error}</p>}
      <Button disabled={!reference.trim() || !slip.objectKeys.length || slip.isUploading || saving} onClick={save}>ยืนยันว่าโอนแล้ว</Button>
    </div>
  );
}

function ActionWithInput({ label, inputLabel, variant = "outline", busy, confirmMessage, onSubmit }: {
  label: string;
  inputLabel: string;
  variant?: "outline" | "destructive" | "default";
  busy: boolean;
  confirmMessage?: string;
  onSubmit: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  return <div className="flex flex-wrap items-center gap-2">
    <Input className="max-w-56" aria-label={inputLabel} placeholder={inputLabel} value={value} onChange={(event) => setValue(event.target.value)} />
    <Button variant={variant} disabled={busy || !value.trim()} onClick={() => {
      if (confirmMessage && !window.confirm(confirmMessage)) return;
      void onSubmit(value.trim()).then(() => setValue(""));
    }}>{label}</Button>
  </div>;
}

export function AdminFinancePage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"payments" | "refunds" | "payouts">("payments");
  const [busy, setBusy] = useState<number | null>(null);
  const payments = useQuery({ queryKey: ["finance", "admin-payments"], queryFn: financeApi.adminPayments, enabled: tab === "payments" });
  const refunds = useQuery({ queryKey: ["finance", "admin-refunds"], queryFn: financeApi.adminRefunds, enabled: tab === "refunds" });
  const payouts = useQuery({ queryKey: ["finance", "admin-payouts"], queryFn: financeApi.adminPayouts, enabled: tab === "payouts" });

  async function act(id: number, queue: string, action: () => Promise<unknown>) {
    setBusy(id);
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: ["finance", queue] });
      if (queue === "admin-refunds") {
        await queryClient.invalidateQueries({ queryKey: ["finance", "refund-transfers", id] });
      }
      toast.add({ type: "success", title: "บันทึกสถานะแล้ว" });
    } catch (error) {
      toast.add({ type: "error", title: "ดำเนินการไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") });
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">จัดการการเงิน</h1>
      <div className="flex flex-wrap gap-2">
        <Button variant={tab === "payments" ? "default" : "outline"} onClick={() => setTab("payments")}>ตรวจสลิปชำระเงิน</Button>
        <Button variant={tab === "refunds" ? "default" : "outline"} onClick={() => setTab("refunds")}>คืนเงิน</Button>
        <Button variant={tab === "payouts" ? "default" : "outline"} onClick={() => setTab("payouts")}>ถอนเงินผู้ขาย</Button>
      </div>
      {tab === "payments" && <Card>
        <CardHeader><CardTitle>สลิปรอตรวจสอบ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {payments.isPending && <p>กำลังโหลด...</p>}
          {payments.isError && <p role="alert">โหลดไม่สำเร็จ <Button variant="link" onClick={() => void payments.refetch()}>ลองใหม่</Button></p>}
          {payments.data?.length === 0 && <p>ไม่มีรายการรอตรวจ</p>}
          {payments.data?.map((payment) => <div key={payment.id} className="space-y-2 border-b pb-4">
            <p>ชำระเงิน #{payment.id} · คำสั่งซื้อ #{payment.salesOrderId} · {money(payment.amount)} · {payment.status}</p>
            {payment.referenceCode && <p>เลขอ้างอิง: {payment.referenceCode}</p>}
            {payment.slipUrl && <a className="text-primary underline" href={payment.slipUrl} target="_blank" rel="noreferrer">เปิดสลิป</a>}
            <div className="flex gap-2">
              <Button disabled={busy !== null || !payment.slipUrl} onClick={() => {
                if (window.confirm("ตรวจสอบยอดเงินเข้าบัญชีแล้วและต้องการอนุมัติใช่ไหม?")) void act(payment.id, "admin-payments", () => financeApi.verifyPayment(payment.id, true));
              }}>อนุมัติ</Button>
              <ActionWithInput label="ปฏิเสธ" inputLabel={`เหตุผลที่ปฏิเสธสลิป ${payment.id}`} variant="destructive" busy={busy !== null}
                onSubmit={(reason) => act(payment.id, "admin-payments", () => financeApi.verifyPayment(payment.id, false, reason))} />
            </div>
          </div>)}
        </CardContent>
      </Card>}
      {tab === "refunds" && <Card>
        <CardHeader><CardTitle>รายการคืนเงิน</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {refunds.isPending && <p>กำลังโหลด...</p>}
          {refunds.isError && <p role="alert">โหลดไม่สำเร็จ <Button variant="link" onClick={() => void refunds.refetch()}>ลองใหม่</Button></p>}
          {refunds.data?.length === 0 && <p>ไม่มีรายการคืนเงินที่รอดำเนินการ</p>}
          {refunds.data?.map((refund) => <div key={refund.id} className="space-y-2 border-b pb-4">
            <p>คืนเงิน #{refund.id} · คำสั่งซื้อ #{refund.salesOrderId} · {money(refund.amount)} · {refund.status}</p>
            <p>บัญชีปลายทาง: {refund.bankName ?? "—"} {refund.accountNumber ?? "—"} ({refund.accountName ?? "—"})</p>
            <RefundTransferHistory refundId={refund.id} />
            {refund.status === "APPROVED" && refund.method === "BANK_TRANSFER" && <Button disabled={busy !== null || !refund.accountNumber} onClick={() => {
              if (window.confirm(`ยืนยันบัญชีปลายทาง ${refund.accountNumber} ก่อนเริ่มโอน?`)) void act(refund.id, "admin-refunds", () => financeApi.startRefund(refund.id, refund.accountNumber!));
            }}>เริ่มโอน</Button>}
            {refund.status === "PROCESSING" && <div className="flex flex-wrap gap-2">
              <ActionWithInput label="ยืนยันว่าโอนแล้ว" inputLabel={`เลขอ้างอิงคืนเงิน ${refund.id}`} variant="default" busy={busy !== null}
                confirmMessage="ยืนยันว่าโอนเงินคืนจริงแล้ว?"
                onSubmit={(reference) => act(refund.id, "admin-refunds", () => financeApi.completeRefund(refund.id, reference))} />
              <ActionWithInput label="โอนล้มเหลว" inputLabel={`เหตุผลที่โอนคืนไม่สำเร็จ ${refund.id}`} busy={busy !== null}
                onSubmit={(reason) => act(refund.id, "admin-refunds", () => financeApi.failRefund(refund.id, reason))} />
            </div>}
          </div>)}
        </CardContent>
      </Card>}
      {tab === "payouts" && <Card>
        <CardHeader><CardTitle>คำขอถอนเงิน</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {payouts.isPending && <p>กำลังโหลด...</p>}
          {payouts.isError && <p role="alert">โหลดไม่สำเร็จ <Button variant="link" onClick={() => void payouts.refetch()}>ลองใหม่</Button></p>}
          {payouts.data?.length === 0 && <p>ไม่มีคำขอถอนเงินที่รอดำเนินการ</p>}
          {payouts.data?.map((payout) => <div key={payout.id} className="space-y-2 border-b pb-4">
            <p>ถอนเงิน #{payout.id} · ผู้ขาย #{payout.sellerProfileId} · {money(payout.amount)} · {payout.status}</p>
            {payout.status === "REQUESTED" && <div className="flex gap-2">
              <Button disabled={busy !== null} onClick={() => void act(payout.id, "admin-payouts", () => financeApi.approvePayout(payout.id))}>อนุมัติ</Button>
              <ActionWithInput label="ปฏิเสธ" inputLabel={`เหตุผลที่ปฏิเสธถอนเงิน ${payout.id}`} variant="destructive" busy={busy !== null}
                onSubmit={(reason) => act(payout.id, "admin-payouts", () => financeApi.rejectPayout(payout.id, reason))} />
            </div>}
            {payout.status === "APPROVED" && <Button disabled={busy !== null} onClick={() => void act(payout.id, "admin-payouts", () => financeApi.processPayout(payout.id))}>เริ่มดำเนินการโอน</Button>}
            {payout.status === "PROCESSING" && <div className="space-y-2">
              <p className="text-sm">ตรวจสอบบัญชีที่ยืนยันในระบบธนาคารก่อนโอน</p>
              <PaidPayout payout={payout} onSaved={() => void queryClient.invalidateQueries({ queryKey: ["finance", "admin-payouts"] })} />
              <ActionWithInput label="โอนล้มเหลว" inputLabel={`เหตุผลที่โอนถอนเงินไม่สำเร็จ ${payout.id}`} busy={busy !== null}
                onSubmit={(reason) => act(payout.id, "admin-payouts", () => financeApi.failPayout(payout.id, reason))} />
            </div>}
          </div>)}
        </CardContent>
      </Card>}
    </div>
  );
}
