import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api";
import { financeApi } from "./finance.api";
import type { Refund } from "./finance.types";
import { refundMethodLabel, refundStatusLabel } from "./refund.format";

function RefundDestination({ refund }: { refund: Refund }) {
  const queryClient = useQueryClient();
  const [bankName, setBankName] = useState(refund.bankName ?? "");
  const [accountName, setAccountName] = useState(refund.accountName ?? "");
  const [accountNumber, setAccountNumber] = useState(refund.accountNumber ?? "");
  const [editing, setEditing] = useState(!refund.bankName || !refund.accountName || !refund.accountNumber);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const hasDestination = !!(refund.bankName && refund.accountName && refund.accountNumber);
  const hasChanges = bankName.trim() !== (refund.bankName ?? "")
    || accountName.trim() !== (refund.accountName ?? "")
    || accountNumber.replace(/[ -]/g, "") !== (refund.accountNumber ?? "").replace(/[ -]/g, "");
  async function save() {
    if (savingRef.current || !hasChanges || !bankName.trim() || !accountName.trim() || !accountNumber.trim()) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const updated = await financeApi.setRefundDestination(refund.id, bankName.trim(), accountName.trim(), accountNumber.trim());
      queryClient.setQueryData<Refund[]>(["finance", "my-refunds"], (current) =>
        current?.map((item) => item.id === refund.id ? updated : item));
      queryClient.setQueryData(["finance", "refund", refund.id], updated);
      setEditing(false);
      toast.add({ type: "success", title: "บันทึกบัญชีรับเงินคืนแล้ว" });
    } catch (error) {
      toast.add({ type: "error", title: "บันทึกไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") });
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }
  if (!editing && hasDestination) return (
    <div className="space-y-2 text-sm">
      <p>บันทึกบัญชีรับเงินคืนแล้ว: {refund.bankName} · {refund.accountName} · เลขบัญชีลงท้าย {refund.accountNumber?.slice(-4)}</p>
      <Button variant="outline" size="sm" onClick={() => {
        setBankName(refund.bankName ?? "");
        setAccountName(refund.accountName ?? "");
        setAccountNumber(refund.accountNumber ?? "");
        setEditing(true);
      }}>แก้ไขบัญชีรับเงินคืน</Button>
    </div>
  );
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Input aria-label={`ธนาคารสำหรับคืนเงิน ${refund.id}`} placeholder="ธนาคาร" value={bankName} onChange={(event) => setBankName(event.target.value)} />
      <Input aria-label={`ชื่อบัญชีสำหรับคืนเงิน ${refund.id}`} placeholder="ชื่อบัญชี" value={accountName} onChange={(event) => setAccountName(event.target.value)} />
      <Input aria-label={`เลขบัญชีสำหรับคืนเงิน ${refund.id}`} placeholder="เลขบัญชี" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
      <Button className="sm:col-span-3" disabled={saving || !hasChanges || !bankName.trim() || !accountName.trim() || !accountNumber.trim()} onClick={() => void save()}>
        {saving ? "กำลังบันทึก..." : "บันทึกบัญชีรับเงินคืน"}
      </Button>
      {hasDestination && <Button variant="outline" className="sm:col-span-3" disabled={saving} onClick={() => setEditing(false)}>ยกเลิกการแก้ไข</Button>}
    </div>
  );
}

function RefundDetails({ refund }: { refund: Refund }) {
  const [open, setOpen] = useState(false);
  const detail = useQuery({
    queryKey: ["finance", "refund", refund.id],
    queryFn: () => financeApi.getRefund(refund.id),
    enabled: open,
  });
  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>{open ? "ปิดรายละเอียด" : "ดูรายละเอียดล่าสุด"}</Button>
      {open && detail.isPending && <p>กำลังโหลดรายละเอียด...</p>}
      {open && detail.isError && <p role="alert" className="text-destructive">โหลดรายละเอียดไม่สำเร็จ</p>}
      {open && detail.data && <div className="space-y-2 text-sm">
        <p>สถานะล่าสุด: {refundStatusLabel(detail.data.status)}</p>
        <p>วิธีคืนเงิน: {refundMethodLabel(detail.data.method)}</p>
        {detail.data.bankName && <p>บัญชีรับเงินคืน: {detail.data.bankName} · {detail.data.accountName} · เลขบัญชีลงท้าย {detail.data.accountNumber?.slice(-4)}</p>}
        {detail.data.transferReference && <p>เลขอ้างอิงการโอน: {detail.data.transferReference}</p>}
      </div>}
    </div>
  );
}

export function BuyerRefunds() {
  const refunds = useQuery({ queryKey: ["finance", "my-refunds"], queryFn: financeApi.myRefunds });
  return (
    <Card>
      <CardHeader><CardTitle>การคืนเงิน</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {refunds.isPending && <p>กำลังโหลดข้อมูลการคืนเงิน...</p>}
        {refunds.isError && <p role="alert" className="text-destructive">โหลดข้อมูลการคืนเงินไม่สำเร็จ <Button variant="link" onClick={() => void refunds.refetch()}>ลองใหม่</Button></p>}
        {refunds.data?.length === 0 && <p>ยังไม่มีรายการคืนเงิน</p>}
        {refunds.data?.map((refund) => (
          <div key={refund.id} className="space-y-3 border-b pb-4">
            <p className="font-medium">คำสั่งซื้อ #{refund.salesOrderId} · คืน ฿{Number(refund.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
            <p className="text-sm">สถานะ: {refundStatusLabel(refund.status)} · เหตุผล: {refund.reason}</p>
            {refund.transferReference && <p className="text-sm">เลขอ้างอิงการโอน: {refund.transferReference}</p>}
            <RefundDetails refund={refund} />
            {refund.method === "BANK_TRANSFER" && refund.status === "APPROVED" && <RefundDestination refund={refund} />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
