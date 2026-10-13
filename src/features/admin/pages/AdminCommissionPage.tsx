import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { getErrorMessage, isApiError } from "@/lib/api";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import type { CommissionRuleInput } from "@/features/finance/after-sales.types";

const blank = (): CommissionRuleInput => ({ scope: "GLOBAL", gameId: null, categoryId: null,
  sellerProfileId: null, ratePercent: 0, fixedFee: 0, minFee: null, maxFee: null,
  priority: 0, effectiveFrom: new Date().toISOString(), effectiveTo: null, active: true });
const optionalNumber = (value: string) => value === "" ? null : Number(value);
const localDateTime = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export function AdminCommissionPage() {
  const cache = useQueryClient();
  const rules = useQuery({ queryKey: ["finance", "commission-rules"], queryFn: afterSalesApi.commissionRules });
  const [selected, setSelected] = useState<number | null>(null);
  const [form, setForm] = useState<CommissionRuleInput>(blank);
  const [busy, setBusy] = useState(false);
  async function edit(id: number) {
    setBusy(true);
    try { const current = await afterSalesApi.commissionRule(id); setSelected(id); setForm(current); }
    catch (error) { toast.add({ type: "error", title: "โหลดรายละเอียดไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") }); }
    finally { setBusy(false); }
  }
  const update = <K extends keyof CommissionRuleInput>(key: K, value: CommissionRuleInput[K]) => setForm((old) => ({ ...old, [key]: value }));
  const refresh = async () => { await cache.invalidateQueries({ queryKey: ["finance", "commission-rules"] }); };

  async function save() {
    setBusy(true);
    try {
      if (selected === null) await afterSalesApi.createCommissionRule(form);
      else await afterSalesApi.updateCommissionRule(selected, form);
      await refresh(); setSelected(null); setForm(blank());
      toast.add({ type: "success", title: "บันทึกกฎค่าคอมมิชชันแล้ว" });
    } catch (error) { toast.add({ type: "error", title: "บันทึกไม่สำเร็จ", description: getErrorMessage(error, "กรุณาตรวจข้อมูล") }); }
    finally { setBusy(false); }
  }
  async function deactivate(id: number) {
    if (!window.confirm(`ปิดใช้งานกฎ #${id}?`)) return;
    setBusy(true);
    try { await afterSalesApi.deactivateCommissionRule(id); await refresh(); toast.add({ type: "success", title: "ปิดใช้งานแล้ว" }); }
    catch (error) { toast.add({ type: "error", title: "ปิดใช้งานไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") }); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6 p-6">
    <h1 className="text-2xl font-bold">กฎค่าคอมมิชชัน</h1>
    <Card><CardHeader><CardTitle>กฎปัจจุบัน</CardTitle></CardHeader><CardContent className="space-y-3">
      {rules.isPending && <p>กำลังโหลด...</p>}
      {rules.isError && <p role="alert">{isApiError(rules.error) && rules.error.status === 403
        ? "เซสชันนี้ไม่มีสิทธิ์ ADMIN สำหรับ API กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ หากยังพบปัญหาให้ตรวจ role ของบัญชี"
        : `โหลดกฎไม่สำเร็จ: ${getErrorMessage(rules.error, "กรุณาลองอีกครั้ง")}`} <Button variant="outline" onClick={() => void rules.refetch()}>ลองอีกครั้ง</Button></p>}
      {rules.data?.length === 0 && <p>ยังไม่มีกฎ</p>}
      {rules.data?.map((rule) => <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
        <div><strong>#{rule.id} · {rule.scope}</strong> {rule.scope !== "GLOBAL" && `#${rule.gameId ?? rule.categoryId ?? rule.sellerProfileId}`} · {rule.ratePercent}% + ฿{rule.fixedFee} · ลำดับ {rule.priority} · {rule.active ? "ใช้งาน" : "ปิดใช้งาน"}</div>
        <div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={() => void edit(rule.id)}>ดู/แก้ไข</Button>{rule.active && <Button variant="destructive" disabled={busy} onClick={() => void deactivate(rule.id)}>ปิดใช้งาน</Button>}</div>
      </div>)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{selected === null ? "เพิ่มกฎ" : `แก้ไขกฎ #${selected}`}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1">ขอบเขต<select className="w-full rounded border p-2" value={form.scope} onChange={(e) => { const scope = e.target.value as CommissionRuleInput["scope"]; setForm((old) => ({ ...old, scope, gameId: null, categoryId: null, sellerProfileId: null })); }}><option>GLOBAL</option><option>GAME</option><option>CATEGORY</option><option>SELLER</option></select></label>
      {form.scope !== "GLOBAL" && <label className="space-y-1">{form.scope === "GAME" ? "Game ID" : form.scope === "CATEGORY" ? "Category ID" : "Seller profile ID"}<Input type="number" min="1" required value={form.gameId ?? form.categoryId ?? form.sellerProfileId ?? ""} onChange={(e) => update(form.scope === "GAME" ? "gameId" : form.scope === "CATEGORY" ? "categoryId" : "sellerProfileId", optionalNumber(e.target.value))} /></label>}
      <label className="space-y-1">อัตรา (%)<Input type="number" min="0" max="100" step="0.001" value={form.ratePercent} onChange={(e) => update("ratePercent", Number(e.target.value))} /></label>
      <label className="space-y-1">ค่าธรรมเนียมคงที่ (บาท)<Input type="number" min="0" step="0.01" value={form.fixedFee} onChange={(e) => update("fixedFee", Number(e.target.value))} /></label>
      <label className="space-y-1">ขั้นต่ำ (บาท)<Input type="number" min="0" step="0.01" value={form.minFee ?? ""} onChange={(e) => update("minFee", optionalNumber(e.target.value))} /></label>
      <label className="space-y-1">ขั้นสูง (บาท)<Input type="number" min="0" step="0.01" value={form.maxFee ?? ""} onChange={(e) => update("maxFee", optionalNumber(e.target.value))} /></label>
      <label className="space-y-1">ลำดับความสำคัญ<Input type="number" value={form.priority} onChange={(e) => update("priority", Number(e.target.value))} /></label>
      <label className="space-y-1">เริ่มมีผล<Input type="datetime-local" value={localDateTime(form.effectiveFrom)} onChange={(e) => update("effectiveFrom", new Date(e.target.value).toISOString())} /></label>
      <label className="space-y-1">สิ้นสุด<Input type="datetime-local" value={form.effectiveTo ? localDateTime(form.effectiveTo) : ""} onChange={(e) => update("effectiveTo", e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />เปิดใช้งาน</label>
      <div className="flex gap-2 sm:col-span-2"><Button disabled={busy} onClick={() => void save()}>{selected === null ? "สร้างกฎ" : "บันทึก"}</Button>{selected !== null && <Button variant="outline" onClick={() => { setSelected(null); setForm(blank()); }}>ยกเลิก</Button>}</div>
    </CardContent></Card>
  </div>;
}
