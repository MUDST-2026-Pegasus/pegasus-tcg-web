import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api";
import { afterSalesApi } from "./after-sales.api";

export function SellerReturnsPage() {
  const cache = useQueryClient();
  const [status, setStatus] = useState("");
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [resolutions, setResolutions] = useState<Record<number, "FULL_REFUND" | "PARTIAL_REFUND">>({});
  const [shipBack, setShipBack] = useState<Record<number, boolean>>({});
  const [restock, setRestock] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const queue = useQuery({ queryKey: ["finance", "seller-returns", status], queryFn: () => afterSalesApi.sellerReturns(status || undefined) });

  async function act(id: number, action: () => Promise<unknown>, message: string) {
    setBusy(id);
    try { await action(); await cache.invalidateQueries({ queryKey: ["finance", "seller-returns"] }); toast.add({ type: "success", title: message }); }
    catch (error) { toast.add({ type: "error", title: "ดำเนินการไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") }); }
    finally { setBusy(null); }
  }
  return <div className="space-y-5 p-6"><h1 className="text-2xl font-bold">คำขอคืนสินค้า</h1>
    <select aria-label="กรองสถานะคืนสินค้า" className="rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">ทุกสถานะ</option>{["REQUESTED", "AWAITING_RETURN_SHIPMENT", "IN_TRANSIT", "APPROVED", "REJECTED", "REFUNDED", "CLOSED"].map((value) => <option key={value}>{value}</option>)}</select>
    {queue.isPending && <p>กำลังโหลด...</p>}{queue.isError && <p role="alert">โหลดคำขอไม่สำเร็จ <Button variant="outline" onClick={() => void queue.refetch()}>ลองอีกครั้ง</Button></p>}
    {queue.data?.length === 0 && <p>ไม่มีคำขอคืนสินค้า</p>}
    {queue.data?.map((item) => <Card key={item.id}><CardContent className="space-y-3 p-5">
      <h2 className="font-semibold">คำขอ #{item.id} · คำสั่งซื้อย่อย #{item.sellerOrderId}</h2>
      <p>{item.status} · {item.reasonCode}</p><p>{item.description}</p>
      {item.evidenceKeys.length > 0 && <p>หลักฐาน {item.evidenceKeys.length} ไฟล์ (object keys: {item.evidenceKeys.join(", ")})</p>}
      {item.status === "REQUESTED" && <div className="space-y-2 rounded border p-3">
        <select aria-label={`ผลการคืน ${item.id}`} className="rounded border p-2" value={resolutions[item.id] ?? "FULL_REFUND"} onChange={(e) => setResolutions((old) => ({ ...old, [item.id]: e.target.value as "FULL_REFUND" | "PARTIAL_REFUND" }))}><option value="FULL_REFUND">คืนเต็มจำนวน</option><option value="PARTIAL_REFUND">คืนบางส่วน</option></select>
        <Input className="max-w-48" aria-label={`จำนวนเงินคืน ${item.id}`} type="number" min="0.01" step="0.01" placeholder="ยอดคืน (บาท)" value={amounts[item.id] ?? ""} onChange={(e) => setAmounts((old) => ({ ...old, [item.id]: e.target.value }))} />
        <label className="flex gap-2"><input type="checkbox" checked={shipBack[item.id] ?? false} onChange={(e) => setShipBack((old) => ({ ...old, [item.id]: e.target.checked }))} />ต้องส่งสินค้าคืนก่อน</label>
        <div className="flex gap-2"><Button disabled={busy === item.id || !(Number(amounts[item.id]) > 0)} onClick={() => { if (window.confirm(`อนุมัติคืนเงิน ฿${amounts[item.id]} สำหรับคำขอ #${item.id}?`)) void act(item.id, () => afterSalesApi.approveReturn(item.id, resolutions[item.id] ?? "FULL_REFUND", Number(amounts[item.id]), shipBack[item.id] ?? false), "อนุมัติคำขอแล้ว"); }}>อนุมัติ</Button><Button variant="destructive" disabled={busy === item.id} onClick={() => { if (window.confirm("ปฏิเสธคำขอคืนสินค้า?")) void act(item.id, () => afterSalesApi.rejectReturn(item.id), "ปฏิเสธแล้ว"); }}>ปฏิเสธ</Button></div>
      </div>}
      {item.status === "IN_TRANSIT" && <div className="space-y-2"><p>เลขพัสดุคืน: {item.returnTrackingNumber}</p><label className="flex gap-2"><input type="checkbox" checked={restock[item.id] ?? false} onChange={(e) => setRestock((old) => ({ ...old, [item.id]: e.target.checked }))} />นำสินค้ากลับเข้าสต็อก</label><Button disabled={busy === item.id} onClick={() => { if (window.confirm("ยืนยันว่าได้รับสินค้าคืนแล้ว?")) void act(item.id, () => afterSalesApi.receiveReturn(item.id, restock[item.id] ?? false), "รับสินค้าคืนแล้ว"); }}>ยืนยันรับสินค้า</Button></div>}
    </CardContent></Card>)}
  </div>;
}
