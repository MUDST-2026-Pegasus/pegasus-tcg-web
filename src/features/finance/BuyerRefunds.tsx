import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TextLinesSkeleton } from "@/components/common/PageSkeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api";
import { financeApi } from "./finance.api";
import type { Refund } from "./finance.types";
import { refundMethodLabel, refundStatusLabel } from "./refund.format";
import { refundKeys, useBuyerRefunds } from "./refunds.queries";

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
      queryClient.setQueryData<Refund[]>(refundKeys.mine, (current) =>
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
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <Input aria-label={`ธนาคารสำหรับคืนเงิน ${refund.id}`} placeholder="ธนาคาร" value={bankName} onChange={(event) => setBankName(event.target.value)} />
      <Input aria-label={`ชื่อบัญชีสำหรับคืนเงิน ${refund.id}`} placeholder="ชื่อบัญชี" value={accountName} onChange={(event) => setAccountName(event.target.value)} />
      <Input aria-label={`เลขบัญชีสำหรับคืนเงิน ${refund.id}`} placeholder="เลขบัญชี" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
      <Button disabled={saving || !hasChanges || !bankName.trim() || !accountName.trim() || !accountNumber.trim()} onClick={() => void save()}>
        {saving ? "กำลังบันทึก..." : "บันทึกบัญชีรับเงินคืน"}
      </Button>
      <p className="text-xs text-muted-foreground sm:col-span-4">กรอกบัญชีที่จะรับเงินคืน แอดมินจะโอนให้หลังบันทึก — แก้ไขได้จนกว่าจะเริ่มโอน</p>
      {hasDestination && <Button variant="outline" className="sm:col-span-4" disabled={saving} onClick={() => setEditing(false)}>ยกเลิกการแก้ไข</Button>}
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
      {open && detail.isPending && <div role="status" aria-busy="true" aria-label="กำลังโหลดรายละเอียด"><TextLinesSkeleton lines={3} /></div>}
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

/**
 * Refunds of one order, shown inside that order's card rather than as a list of
 * their own: a refund only makes sense next to the order it pays back.
 */
export function OrderRefunds({ salesOrderId }: { salesOrderId: number }) {
  const refunds = useBuyerRefunds();
  const mine = refunds.data?.filter((refund) => refund.salesOrderId === salesOrderId) ?? [];
  if (mine.length === 0) return null;
  return (
    <section aria-label="การคืนเงิน" className="flex flex-col gap-4 border-t bg-violet-50/60 px-4 py-3.5 text-sm">
      {mine.map((refund) => (
        <div key={refund.id} className="flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                การคืนเงิน ฿{Number(refund.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">
                เหตุผล: {refund.reason} · {refundMethodLabel(refund.method)}
              </p>
              {refund.transferReference && (
                <p className="text-xs text-muted-foreground">เลขอ้างอิงการโอน: {refund.transferReference}</p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0 bg-white">{refundStatusLabel(refund.status)}</Badge>
          </div>
          {refund.method === "BANK_TRANSFER" && refund.status === "APPROVED" && <RefundDestination refund={refund} />}
          <RefundDetails refund={refund} />
        </div>
      ))}
    </section>
  );
}
