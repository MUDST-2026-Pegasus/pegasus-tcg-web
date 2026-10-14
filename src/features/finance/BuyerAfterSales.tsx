import { BuyerOrderReview } from './BuyerOrderReview';
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TextLinesSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getErrorMessage } from "@/lib/api";
import type { SellerOrderDetails } from "@/features/account/orders.types";
import { afterSalesApi } from "./after-sales.api";
import { returnReasonLabel, returnStatusLabel } from "./after-sales.format";

const reasons = ["NOT_AS_DESCRIBED", "DAMAGED", "WRONG_ITEM", "NOT_RECEIVED", "COUNTERFEIT", "OTHER"];

export function BuyerAfterSales({ order }: { order: SellerOrderDetails }) {
  const cache = useQueryClient();
  const returns = useQuery({ queryKey: ["finance", "buyer-returns", order.id], queryFn: () => afterSalesApi.buyerReturns(order.id) });
  const evidence = useFileUpload({ purpose: "RETURN_EVIDENCE", multiple: true, maxFiles: 10 });
  const [reason, setReason] = useState(reasons[0]);
  const [description, setDescription] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [tracking, setTracking] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const canReturn = ["SHIPPED", "DELIVERED"].includes(order.status) && !!order.autoCompleteAt
    && Date.parse(order.autoCompleteAt) > returns.dataUpdatedAt;

  async function act(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try { await action(); await cache.invalidateQueries({ queryKey: ["finance", "buyer-returns", order.id] }); toast.add({ type: "success", title: success }); }
    catch (error) { toast.add({ type: "error", title: "ดำเนินการไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") }); }
    finally { setBusy(false); }
  }
  async function createReturn() {
    const items = (order.items ?? []).map((item) => ({ orderItemId: item.id, quantity: quantities[item.id] ?? 0 })).filter((item) => item.quantity > 0);
    if (!items.length) return;
    await act(() => afterSalesApi.requestReturn(order.id, { reasonCode: reason, description, evidenceKeys: evidence.objectKeys, items }), "ส่งคำขอคืนสินค้าแล้ว");
  }
  return <section className="space-y-3 border-t pt-3 text-sm">
    <h4 className="font-semibold">คืนสินค้าและรีวิวร้าน</h4>
    {returns.isPending && <div role="status" aria-busy="true" aria-label="กำลังโหลดคำขอคืนสินค้า"><TextLinesSkeleton lines={2} /></div>}
    {returns.isError && <p role="alert">โหลดคำขอคืนสินค้าไม่สำเร็จ <Button variant="outline" size="sm" onClick={() => void returns.refetch()}>ลองอีกครั้ง</Button></p>}
    {returns.data?.map((item) => <div key={item.id} className="space-y-2 rounded border p-3">
      <p>คำขอคืน #{item.id} · {returnStatusLabel(item.status)} · {returnReasonLabel(item.reasonCode)}</p>
      {item.refundAmount != null && <p>ยอดคืน ฿{item.refundAmount}</p>}
      {item.status === "AWAITING_RETURN_SHIPMENT" && <div className="flex gap-2"><Input aria-label={`เลขพัสดุคืน ${item.id}`} placeholder="เลขพัสดุส่งคืน" value={tracking[item.id] ?? ""} onChange={(e) => setTracking((old) => ({ ...old, [item.id]: e.target.value }))} /><Button disabled={busy || !tracking[item.id]?.trim()} onClick={() => void act(() => afterSalesApi.shipReturn(order.id, item.id, tracking[item.id].trim()), "บันทึกเลขพัสดุแล้ว")}>แจ้งส่งคืน</Button></div>}
    </div>)}
    {canReturn && returns.data?.length === 0 && <div className="space-y-3 rounded border p-3">
      <p className="font-medium">ขอคืนสินค้า (ก่อนสิ้นสุดระยะคืนสินค้า)</p>
      <select aria-label="สาเหตุคืนสินค้า" className="w-full rounded border p-2" value={reason} onChange={(e) => setReason(e.target.value)}>{reasons.map((code) => <option key={code} value={code}>{returnReasonLabel(code)}</option>)}</select>
      <Input aria-label="รายละเอียดการคืน" placeholder="รายละเอียด" value={description} onChange={(e) => setDescription(e.target.value)} />
      {(order.items ?? []).map((item) => <label key={item.id} className="flex items-center gap-2">{item.productName} (สูงสุด {item.quantity})<Input className="max-w-24" type="number" min="0" max={item.quantity} value={quantities[item.id] ?? 0} onChange={(e) => setQuantities((old) => ({ ...old, [item.id]: Math.min(item.quantity, Math.max(0, Number(e.target.value))) }))} /></label>)}
      <label>หลักฐานประกอบ (ไม่บังคับ)<Input type="file" multiple accept={evidence.accept} onChange={(e) => { if (e.target.files?.length) evidence.addFiles(e.target.files); }} /></label>
      {evidence.items.map((item) => <p key={item.id}>{item.file.name}: {item.status === "error" ? item.error : item.status === "done" ? "อัปโหลดแล้ว" : "กำลังอัปโหลด"}</p>)}
      <Button disabled={busy || evidence.isUploading || !Object.values(quantities).some((value) => value > 0)} onClick={() => void createReturn()}>ส่งคำขอคืนสินค้า</Button>
    </div>}
    <BuyerOrderReview orderId={order.id} status={order.status}/>
  </section>;
}
