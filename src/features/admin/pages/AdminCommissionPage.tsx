import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { getErrorMessage, isApiError } from "@/lib/api";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import type { CommissionRule, CommissionRuleInput } from "@/features/finance/after-sales.types";

const blank = (): CommissionRuleInput => ({ scope: "GLOBAL", gameId: null, categoryId: null,
  sellerProfileId: null, ratePercent: 0, fixedFee: 0, minFee: null, maxFee: null,
  priority: 0, effectiveFrom: new Date().toISOString(), effectiveTo: null, active: true });
const optionalNumber = (value: string) => value === "" ? null : Number(value);
const money = (value: number) => `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const examplePrice = 1290;
const feeFor = (rule: Pick<CommissionRuleInput, "ratePercent" | "fixedFee" | "minFee" | "maxFee">, price: number) => {
  const fee = price * Number(rule.ratePercent) / 100 + Number(rule.fixedFee);
  return Math.min(rule.maxFee ?? Infinity, Math.max(rule.minFee ?? 0, fee));
};
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
  const [globalRate, setGlobalRate] = useState("");
  const [categoryRates, setCategoryRates] = useState<Record<number, string>>({});
  const currentGlobal = rules.data?.find((rule) => rule.scope === "GLOBAL" && rule.active);
  const categoryRules = rules.data?.filter((rule) => rule.scope === "CATEGORY") ?? [];
  useEffect(() => {
    if (currentGlobal) setGlobalRate(String(currentGlobal.ratePercent));
    setCategoryRates(Object.fromEntries(categoryRules.map((rule) => [rule.id, String(rule.ratePercent)])));
  }, [rules.data]);
  async function edit(id: number) {
    setBusy(true);
    try { const current = await afterSalesApi.commissionRule(id); setSelected(id); setForm(current); }
    catch (error) { toast.add({ type: "error", title: "โหลดรายละเอียดไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") }); }
    finally { setBusy(false); }
  }
  const update = <K extends keyof CommissionRuleInput>(key: K, value: CommissionRuleInput[K]) => setForm((old) => ({ ...old, [key]: value }));
  const refresh = async () => { await cache.invalidateQueries({ queryKey: ["finance", "commission-rules"] }); };

  async function saveRate(rule: CommissionRule | undefined, rateText: string) {
    const rate = Number(rateText);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.add({ type: "error", title: "อัตราต้องอยู่ระหว่าง 0–100%" });
      return;
    }
    setBusy(true);
    try {
      const input = rule ? { ...rule, ratePercent: rate } : { ...blank(), ratePercent: rate };
      if (rule) await afterSalesApi.updateCommissionRule(rule.id, input);
      else await afterSalesApi.createCommissionRule(input);
      await refresh();
      toast.add({ type: "success", title: "บันทึกอัตราค่าคอมมิชชันแล้ว" });
    } catch (error) {
      toast.add({ type: "error", title: "บันทึกไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") });
    } finally { setBusy(false); }
  }

  async function toggleRule(rule: CommissionRule) {
    setBusy(true);
    try {
      await afterSalesApi.updateCommissionRule(rule.id, { ...rule, active: !rule.active });
      await refresh();
    } catch (error) {
      toast.add({ type: "error", title: "เปลี่ยนสถานะไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") });
    } finally { setBusy(false); }
  }

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

  const previewFee = currentGlobal ? feeFor({ ...currentGlobal, ratePercent: Number(globalRate) || 0 }, examplePrice)
    : examplePrice * (Number(globalRate) || 0) / 100;
  return <div className="space-y-6 p-6">
    <div><h1 className="text-2xl font-bold">ค่าคอมมิชชั่น</h1><p className="text-sm text-muted-foreground">กำหนดอัตราค่าธรรมเนียมของแพลตฟอร์มตามกฎที่มีผลอยู่</p></div>
    {rules.isPending && <p>กำลังโหลดกฎค่าคอมมิชชั่น...</p>}
    {rules.isError && <p role="alert" className="text-destructive">{isApiError(rules.error) && rules.error.status === 403
      ? "บัญชีนี้ไม่มีสิทธิ์ ADMIN สำหรับการตั้งค่าค่าคอมมิชชั่น"
      : `โหลดกฎไม่สำเร็จ: ${getErrorMessage(rules.error, "กรุณาลองอีกครั้ง")}`} <Button variant="outline" onClick={() => void rules.refetch()}>ลองอีกครั้ง</Button></p>}
    {!rules.isError && !rules.isPending && <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
      <div className="space-y-4">
        <Card><CardHeader><CardTitle className="text-base">อัตราเริ่มต้นทั้งแพลตฟอร์ม</CardTitle></CardHeader><CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">ใช้กับทุกหมวดหมู่ที่ไม่ได้ตั้งค่าเฉพาะไว้</p>
          <div className="flex flex-wrap items-end gap-3"><label className="space-y-1 text-sm font-medium">อัตราค่าคอมมิชชั่น (%)<Input className="w-36 text-lg font-bold" type="number" min="0" max="100" step="0.001" value={globalRate} onChange={(event) => setGlobalRate(event.target.value)} /></label><Button disabled={busy || !globalRate || (currentGlobal && Number(globalRate) === Number(currentGlobal.ratePercent))} onClick={() => void saveRate(currentGlobal, globalRate)}>บันทึกอัตรา</Button></div>
          <p className="text-xs text-muted-foreground">อัตราแนะนำ 3–7% · กฎที่ใช้งานอยู่ {currentGlobal ? `#${currentGlobal.id}` : "ยังไม่ได้ตั้งค่า"}</p>
        </CardContent></Card>
        <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="text-base">อัตราเฉพาะหมวดหมู่</CardTitle><Button variant="outline" size="sm" onClick={() => { setSelected(null); setForm({ ...blank(), scope: "CATEGORY" }); const advanced = document.getElementById("commission-advanced") as HTMLDetailsElement | null; if (advanced) { advanced.open = true; advanced.scrollIntoView({ behavior: "smooth" }); } }}>+ เพิ่มหมวดหมู่</Button></div></CardHeader><CardContent className="divide-y">
          {categoryRules.length === 0 && <p className="py-3 text-sm text-muted-foreground">ยังไม่มีอัตราเฉพาะหมวดหมู่</p>}
          {categoryRules.map((rule) => <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">หมวดหมู่ #{rule.categoryId}</p><p className="text-xs text-muted-foreground">{rule.active ? "ใช้ค่ากำหนดนี้" : "ใช้ค่าเริ่มต้น"} · กฎ #{rule.id}</p></div><div className="flex items-center gap-2"><input type="checkbox" aria-label={`เปิดใช้งานหมวดหมู่ ${rule.categoryId}`} checked={rule.active} disabled={busy} onChange={() => void toggleRule(rule)} /><Input aria-label={`อัตราหมวดหมู่ ${rule.categoryId}`} className="w-24" type="number" min="0" max="100" step="0.001" value={categoryRates[rule.id] ?? ""} onChange={(event) => setCategoryRates((old) => ({ ...old, [rule.id]: event.target.value }))} /><span className="text-sm">%</span><Button size="sm" variant="outline" disabled={busy || categoryRates[rule.id] === "" || Number(categoryRates[rule.id]) === Number(rule.ratePercent)} onClick={() => void saveRate(rule, categoryRates[rule.id])}>บันทึก</Button></div></div>)}
        </CardContent></Card>
      </div>
      <div className="space-y-4"><Card className="bg-zinc-950 text-white"><CardHeader><CardTitle className="text-base">ตัวอย่างการคำนวณ</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="flex justify-between"><span>ราคาขาย</span><strong>{money(examplePrice)}</strong></div><div className="flex justify-between"><span>ค่าคอมมิชชั่น ({globalRate || 0}%)</span><strong>−{money(previewFee)}</strong></div><div className="border-t border-white/20 pt-3 flex justify-between text-lg font-semibold"><span>ผู้ขายได้รับ</span><span>{money(examplePrice - previewFee)}</span></div><p className="text-xs text-zinc-400">ตัวอย่างใช้อัตราเริ่มต้น ยังไม่รวมค่าจัดส่งหรือกฎเฉพาะผู้ขาย</p></CardContent></Card><Card><CardContent className="pt-6 text-sm text-muted-foreground">อัตราเฉพาะผู้ขายและกฎขั้นสูงยังจัดการได้ในส่วนด้านล่าง</CardContent></Card></div>
    </div>}
    <details id="commission-advanced" className="rounded-lg border bg-white p-4"><summary className="cursor-pointer font-semibold">กฎเพิ่มเติมและการตั้งค่าขั้นสูง</summary><div className="mt-4 space-y-5">
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
    </div></details>
  </div>;
}
