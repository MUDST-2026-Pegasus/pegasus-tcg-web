import { useState } from "react";
import { flushSync } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { getGames } from "@/features/admin/catalog.api";
import type { CatalogCategory } from "@/features/admin/catalog.types";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import { adminPromotionApi } from "./api";
import { getAdminPromotionErrors } from "./validation";
import type { AdminPromotion, AdminPromotionInput } from "./types";

const toLocal = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    : "";
};
const empty: AdminPromotionInput = { code: "", name: "", description: "", discountType: "PERCENT", discountValue: 10, maxDiscount: 200, minSpend: 500, scopeType: "ALL", scopeIds: [], visibility: "PUBLIC", newBuyerOnly: false, usageLimitTotal: 500, usageLimitPerUser: 1, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 30 * 86400000).toISOString(), claimable: true, claimRequired: false, claimLimit: 500, featuredOnHome: false };
const pickInput = (source: AdminPromotion | AdminPromotionInput): AdminPromotionInput => Object.fromEntries((Object.keys(empty) as Array<keyof AdminPromotionInput>).map((key) => [key, source[key]])) as unknown as AdminPromotionInput;
const showValue = (value: unknown) => Array.isArray(value) ? value.join(", ") || "—" : typeof value === "boolean" ? value ? "เปิด" : "ปิด" : String(value ?? "—");
const fieldNames: Partial<Record<keyof AdminPromotionInput, string>> = {
  code: "รหัสโค้ด", name: "ชื่อแคมเปญ", description: "คำอธิบาย", discountType: "ประเภทส่วนลด",
  discountValue: "มูลค่าส่วนลด", maxDiscount: "ลดสูงสุด", minSpend: "ยอดขั้นต่ำ", scopeType: "ขอบเขต",
  scopeIds: "เกมหรือหมวดหมู่", visibility: "การมองเห็น", newBuyerOnly: "เฉพาะผู้ซื้อใหม่",
  usageLimitTotal: "สิทธิ์ทั้งหมด", usageLimitPerUser: "สิทธิ์ต่อคน", startsAt: "วันเริ่ม", endsAt: "วันสิ้นสุด",
  claimable: "ให้กดเก็บ", claimRequired: "ต้องเก็บก่อนใช้", claimLimit: "จำนวนที่แจก", featuredOnHome: "แสดงบนหน้าแรก",
};

export function AdminPromotionFormPage() {
  const id = Number(useParams().id);
  const existing = useQuery({ queryKey: ["admin-promotions", id], queryFn: () => adminPromotionApi.get(id), enabled: id > 0 });
  if (id > 0 && existing.isPending) return <div className="p-8">กำลังโหลดโค้ด...</div>;
  if (id > 0 && existing.isError) return <div role="alert" className="p-8">โหลดโค้ดไม่สำเร็จ <button onClick={() => void existing.refetch()}>ลองอีกครั้ง</button></div>;
  return <PromotionEditor key={id || "new"} existing={existing.data} />;
}

function PromotionEditor({ existing }: { existing?: AdminPromotion }) {
  const navigate = useNavigate(); const client = useQueryClient();
  const [form, setForm] = useState<AdminPromotionInput>(() => existing ? pickInput(existing) : empty);
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const blocker = useBlocker(dirty && !saved);
  const locked = !!existing && (existing.usedCount > 0 || existing.claimedCount > 0);
  const changedFields = existing ? (Object.keys(form) as Array<keyof AdminPromotionInput>).filter((key) => JSON.stringify(existing[key]) !== JSON.stringify(form[key])) : [];
  const games = useQuery({ queryKey: ["admin-games"], queryFn: getGames });
  const categories = useQuery({ queryKey: ["admin-categories", "promotion"], queryFn: () => api.get<CatalogCategory[]>("/admin/categories", { query: { includeInactive: true } }), enabled: form.scopeType === "CATEGORY" });
  const change = <K extends keyof AdminPromotionInput>(key: K, value: AdminPromotionInput[K]) => { setForm((old) => ({ ...old, [key]: value })); setDirty(true); setErrors((old) => ({ ...old, [key]: "" })); };
  const validate = () => {
    const next = getAdminPromotionErrors(form, existing);
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const save = async () => { setBusy(true); try { const input = pickInput({ ...form, code: form.code.trim().toUpperCase(), featuredOnHome: form.claimable && form.visibility === "PUBLIC" && form.featuredOnHome }); if (existing) await adminPromotionApi.update(existing.id, input); else await adminPromotionApi.create(input); flushSync(() => { setSaved(true); setDirty(false); }); await client.invalidateQueries({ queryKey: ["admin-promotions"] }); toast.add({ title: "บันทึกโค้ดสำเร็จ", type: "success" }); navigate("/admin/promotions"); } catch (error) { const message = error instanceof Error ? error.message : "กรุณาลองอีกครั้ง"; if (error instanceof ApiError && error.code === "PROMO_CODE_TAKEN") setErrors((old) => ({ ...old, code: "รหัสนี้ถูกใช้แล้ว" })); else toast.add({ title: "บันทึกไม่สำเร็จ", description: message, type: "error" }); } finally { setBusy(false); setConfirm(false); } };
  const textField = (label: string, key: "code" | "name" | "description", props?: { disabled?: boolean; placeholder?: string }) => <label className="grid gap-1 text-xs font-medium">{label}<Input value={form[key] || ""} maxLength={key === "description" ? 500 : key === "name" ? 120 : 20} disabled={props?.disabled} placeholder={props?.placeholder} onChange={(event) => change(key, key === "code" ? event.target.value.toUpperCase() : event.target.value)} />{errors[key] && <span role="alert" className="text-destructive">{errors[key]}</span>}</label>;
  const numberField = (label: string, key: "discountValue" | "maxDiscount" | "minSpend" | "usageLimitTotal" | "usageLimitPerUser" | "claimLimit", props?: { disabled?: boolean }) => <label className="grid gap-1 text-xs font-medium">{label}<Input type="number" min="0" value={form[key] ?? ""} disabled={props?.disabled} onChange={(event) => change(key, event.target.value === "" ? null as never : Number(event.target.value))} />{errors[key] && <span role="alert" className="text-destructive">{errors[key]}</span>}</label>;
  return <main className="grid gap-5 p-6 lg:p-8"><header className="flex items-end justify-between"><div><h1 className="text-2xl font-bold">{existing ? "แก้ไขโค้ด Pegasus" : "สร้างโค้ด Pegasus"}</h1><p className="text-sm text-muted-foreground">Pegasus เป็นผู้รับภาระส่วนลด ร้านค้าได้รับเงินตามเดิม</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => navigate("/admin/promotions")}>ยกเลิก</Button><Button onClick={() => { if (validate()) setConfirm(true); }}>{existing ? "บันทึก" : "บันทึกและเปิดใช้"}</Button></div></header>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"><div className="grid gap-4">
      <Card className="gap-4 rounded-xl bg-white p-5 shadow-none"><h2 className="font-semibold">1. ข้อมูลโค้ด</h2><div className="grid gap-3 sm:grid-cols-2">{textField("รหัสโค้ด", "code", { disabled: locked })}{textField("ชื่อแคมเปญ", "name")}</div><Button type="button" size="sm" variant="outline" disabled={locked} onClick={() => change("code", Math.random().toString(36).slice(2, 10).toUpperCase())}>สุ่มรหัส</Button>{textField("คำอธิบาย", "description")}<div className="flex gap-4 text-xs">{(["PUBLIC", "PRIVATE"] as const).map((value) => <label key={value}><input type="radio" checked={form.visibility === value} disabled={locked} onChange={() => change("visibility", value)} /> {value === "PUBLIC" ? "สาธารณะ" : "ส่วนตัว"}</label>)}</div></Card>
      <Card className="gap-4 rounded-xl bg-white p-5 shadow-none"><h2 className="font-semibold">2. ประเภทส่วนลด</h2><div className="flex gap-3 text-xs">{(["PERCENT", "FIXED", "FREE_SHIPPING"] as const).map((value) => <label key={value} className="rounded-lg border p-3"><input type="radio" checked={form.discountType === value} disabled={locked} onChange={() => change("discountType", value)} /> {value === "PERCENT" ? "เปอร์เซ็นต์" : value === "FIXED" ? "จำนวนเงิน" : "ส่งฟรี"}</label>)}</div><div className="grid gap-3 sm:grid-cols-2">{form.discountType !== "FREE_SHIPPING" && numberField("มูลค่าส่วนลด", "discountValue", { disabled: locked })}{form.discountType !== "FIXED" && numberField("ลดสูงสุด", "maxDiscount", { disabled: locked })}</div></Card>
      <Card className="gap-4 rounded-xl bg-white p-5 shadow-none"><h2 className="font-semibold">3. เงื่อนไข</h2>{numberField("ยอดสั่งซื้อขั้นต่ำ", "minSpend", { disabled: locked })}<div className="flex gap-3 text-xs">{(["ALL", "GAME", "CATEGORY"] as const).map((value) => <label key={value}><input type="radio" checked={form.scopeType === value} disabled={locked} onChange={() => { change("scopeType", value); change("scopeIds", []); }} /> {value === "ALL" ? "ทุกเกม" : value === "GAME" ? "เลือกเกม" : "เลือกหมวดหมู่"}</label>)}</div>{form.scopeType !== "ALL" && <select className="rounded-md border p-2 text-sm" value={form.scopeIds[0] || ""} disabled={locked} onChange={(event) => change("scopeIds", event.target.value ? [Number(event.target.value)] : [])}><option value="">เลือก</option>{(form.scopeType === "GAME" ? games.data : categories.data)?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}<label className="text-xs"><input type="checkbox" checked={form.newBuyerOnly} disabled={locked} onChange={(event) => change("newBuyerOnly", event.target.checked)} /> เฉพาะผู้ซื้อใหม่</label></Card>
      <Card className="gap-4 rounded-xl bg-white p-5 shadow-none"><h2 className="font-semibold">4. ระยะเวลาและจำนวนสิทธิ์</h2><div className="grid gap-3 sm:grid-cols-2">{(["startsAt", "endsAt"] as const).map((key) => <label key={key} className="grid gap-1 text-xs">{key === "startsAt" ? "เริ่มใช้ได้" : "สิ้นสุด"}<Input type="datetime-local" value={toLocal(form[key])} disabled={locked && key === "startsAt"} onChange={(event) => change(key, event.target.value ? new Date(event.target.value).toISOString() : "")} />{errors[key] && <span role="alert" className="text-destructive">{errors[key]}</span>}</label>)}{numberField("จำนวนสิทธิ์ทั้งหมด", "usageLimitTotal")}{numberField("สิทธิ์ต่อคน", "usageLimitPerUser", { disabled: locked })}</div></Card>
      <Card className="gap-4 rounded-xl bg-white p-5 shadow-none"><h2 className="font-semibold">5. การแจกโค้ด (กดเก็บ)</h2><label className="text-xs"><input type="checkbox" checked={form.claimable} onChange={(event) => change("claimable", event.target.checked)} /> ให้ลูกค้ากดเก็บได้</label><label className="text-xs"><input type="checkbox" checked={form.featuredOnHome} onChange={(event) => change("featuredOnHome", event.target.checked)} /> แสดงบนหน้าแรก</label>{numberField("จำนวนที่แจก", "claimLimit")}<label className="text-xs"><input type="checkbox" checked={form.claimRequired} disabled={locked || !form.claimable} onChange={(event) => change("claimRequired", event.target.checked)} /> ต้องเก็บก่อนใช้</label>{errors.claimRequired && <span role="alert" className="text-xs text-destructive">{errors.claimRequired}</span>}</Card>
    </div><aside className="grid content-start gap-4"><Card className="rounded-xl bg-white p-5 shadow-none"><h2 className="font-semibold">ตัวอย่างโค้ด</h2><div className="mt-3 rounded-xl border border-dashed border-blue-400 bg-blue-50 p-4 text-sm"><strong>{form.code || "YOURCODE"}</strong><p>{form.name || "ชื่อแคมเปญ"}</p><p>ขั้นต่ำ ฿{Number(form.minSpend ?? 0).toLocaleString("th-TH")}</p></div></Card><Card className="rounded-xl bg-slate-950 p-5 text-white"><p>ตัวอย่างการคำนวณ (เพื่อแสดงเท่านั้น)</p><strong className="text-lg">{form.discountType === "FREE_SHIPPING" ? "ค่าส่งตามจริง" : form.discountType === "PERCENT" ? `${form.discountValue}%` : `฿${form.discountValue}`}</strong></Card><Card className="rounded-xl bg-white p-5 shadow-none"><p>งบสูงสุดโดยประมาณ</p><strong>฿{((form.maxDiscount || form.discountValue) * (form.usageLimitTotal || 0)).toLocaleString("th-TH")}</strong></Card></aside></div>
    <Dialog open={confirm} onOpenChange={setConfirm}><DialogContent><DialogHeader><DialogTitle>{existing ? "บันทึกการเปลี่ยนแปลง?" : "เปิดใช้โค้ดนี้?"}</DialogTitle></DialogHeader><p className="text-sm">{form.code} · {form.name}</p>{existing && <div className="grid max-h-48 gap-1 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs">{changedFields.length ? changedFields.map((key) => <p key={key}><strong>{fieldNames[key] || key}</strong>: {showValue(existing[key])} → {showValue(form[key])}</p>) : <p>ไม่มีข้อมูลที่เปลี่ยนแปลง</p>}</div>}<DialogFooter><Button variant="outline" onClick={() => setConfirm(false)}>กลับไปแก้ไข</Button><Button disabled={busy} onClick={() => void save()}>ยืนยัน</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={blocker.state === "blocked"} onOpenChange={(open) => { if (!open && blocker.state === "blocked") blocker.reset(); }}><DialogContent><DialogHeader><DialogTitle>ออกจากหน้านี้?</DialogTitle></DialogHeader><p className="text-sm">ข้อมูลที่ยังไม่ได้บันทึกจะหายไป</p><DialogFooter><Button variant="outline" onClick={() => blocker.reset?.()}>อยู่ต่อ</Button><Button onClick={() => blocker.proceed?.()}>ทิ้งการแก้ไข</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}
