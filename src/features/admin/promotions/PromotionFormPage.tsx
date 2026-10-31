import { useState } from "react";
import { flushSync } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { Check, LogOut, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { getGames } from "@/features/admin/catalog.api";
import type { CatalogCategory } from "@/features/admin/catalog.types";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import { adminPromotionApi } from "./api";
import { getAdminPromotionErrors } from "./validation";
import type { AdminPromotion, AdminPromotionInput } from "./types";
import { ClaimTicketPreview } from "./components";
import "./promotions.css";

const toLocal = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    : "";
};
const initialDates = () => { const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 29); end.setHours(23, 59, 0, 0); return { startsAt: start.toISOString(), endsAt: end.toISOString() }; };
const empty: AdminPromotionInput = { code: "", name: "", description: "", discountType: "PERCENT", discountValue: 10, maxDiscount: 200, minSpend: 500, scopeType: "ALL", scopeIds: [], visibility: "PUBLIC", newBuyerOnly: false, usageLimitTotal: 500, usageLimitPerUser: 1, ...initialDates(), claimable: true, claimRequired: false, claimLimit: 800, featuredOnHome: true, homeSort: 0 };
const pickInput = (source: AdminPromotion | AdminPromotionInput): AdminPromotionInput => Object.fromEntries((Object.keys(empty) as Array<keyof AdminPromotionInput>).map((key) => [key, source[key]])) as unknown as AdminPromotionInput;
const showValue = (value: unknown) => Array.isArray(value) ? value.join(", ") || "—" : typeof value === "boolean" ? value ? "เปิด" : "ปิด" : String(value ?? "—");
const money = (value: number | null | undefined) => `฿${Number(value || 0).toLocaleString("th-TH")}`;
const formatThaiDate = (value: string) => new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const formatThaiDateTime = (value: string) => new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
const formatThaiPeriod = (startValue: string, endValue: string) => {
  const start = new Date(startValue); const end = new Date(endValue);
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    const monthYear = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { month: "short", year: "numeric" }).format(end);
    return `${start.getDate()} – ${end.getDate()} ${monthYear}`;
  }
  return `${formatThaiDate(startValue)} – ${formatThaiDate(endValue)}`;
};
const fieldNames: Partial<Record<keyof AdminPromotionInput, string>> = {
  code: "รหัสโค้ด", name: "ชื่อแคมเปญ", description: "คำอธิบาย", discountType: "ประเภทส่วนลด",
  discountValue: "มูลค่าส่วนลด", maxDiscount: "ลดสูงสุด", minSpend: "ยอดขั้นต่ำ", scopeType: "ขอบเขต",
  scopeIds: "เกมหรือหมวดหมู่", visibility: "การมองเห็น", newBuyerOnly: "เฉพาะผู้ซื้อใหม่",
  usageLimitTotal: "สิทธิ์ทั้งหมด", usageLimitPerUser: "สิทธิ์ต่อคน", startsAt: "วันเริ่ม", endsAt: "วันสิ้นสุด",
  claimable: "ให้กดเก็บ", claimRequired: "ต้องเก็บก่อนใช้", claimLimit: "จำนวนที่แจก", featuredOnHome: "แสดงบนหน้าแรก", homeSort: "ลำดับบนหน้าแรก",
};

function ChoiceCard({ value, title, hint, selected, disabled }: { value: string; title: string; hint: string; selected: boolean; disabled?: boolean }) {
  return <label className={`promotion-choice ${selected ? "promotion-choice-selected" : ""} ${disabled ? "promotion-choice-disabled" : ""}`}>
    <RadioGroupItem value={value} disabled={disabled} className="promotion-choice-radio" />
    <span><strong>{title}</strong><small>{hint}</small></span>
  </label>;
}

function ToggleRow({ id, title, hint, checked, disabled, onChange }: { id: string; title: string; hint: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <div className={`promotion-toggle-row ${disabled ? "promotion-toggle-disabled" : ""}`}>
    <div><label htmlFor={id}>{title}</label><p>{hint}</p></div>
    <Switch id={id} size="sm" checked={checked} disabled={disabled} onCheckedChange={onChange} />
  </div>;
}

export function AdminPromotionFormPage() {
  const id = Number(useParams().id);
  const existing = useQuery({ queryKey: ["admin-promotions", id], queryFn: () => adminPromotionApi.get(id), enabled: id > 0 });
  if (id > 0 && existing.isPending) return <div className="p-8">กำลังโหลดโค้ด...</div>;
  if (id > 0 && existing.isError) return <div role="alert" className="p-8">โหลดโค้ดไม่สำเร็จ <button onClick={() => void existing.refetch()}>ลองอีกครั้ง</button></div>;
  if (existing.data?.ownerType === "SELLER") return <div role="alert" className="grid gap-3 p-8"><p>โค้ดร้านค้าแก้ไขโดยแอดมินไม่ได้</p><Link className="text-primary underline" to="/admin/promotions">กลับไปรายการโปรโมชั่น</Link></div>;
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
  const locked = !!existing && existing.usedCount > 0;
  const claimLocked = !!existing && existing.claimedCount > 0;
  const changedFields = existing ? (Object.keys(form) as Array<keyof AdminPromotionInput>).filter((key) => JSON.stringify(existing[key]) !== JSON.stringify(form[key])) : [];
  const games = useQuery({ queryKey: ["admin-games"], queryFn: getGames });
  const categories = useQuery({ queryKey: ["admin-categories", "promotion"], queryFn: () => api.get<CatalogCategory[]>("/admin/categories", { query: { includeInactive: true } }), enabled: form.scopeType === "CATEGORY" });
  const change = <K extends keyof AdminPromotionInput>(key: K, value: AdminPromotionInput[K]) => { setForm((old) => ({ ...old, [key]: value, ...(key === "claimable" && !value ? { featuredOnHome: false, homeSort: null, claimRequired: false } : {}), ...(key === "visibility" && value === "PRIVATE" ? { claimable: false, claimRequired: false, featuredOnHome: false, homeSort: null } : {}), ...(key === "featuredOnHome" && !value ? { homeSort: null } : {}) })); setDirty(true); setErrors((old) => ({ ...old, [key]: "", featuredOnHome: "", homeSort: "" })); };
  const validate = () => {
    const next = getAdminPromotionErrors(form, existing);
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const save = async () => { setBusy(true); try { const featuredOnHome = form.claimable && form.visibility === "PUBLIC" && form.featuredOnHome; const input = pickInput({ ...form, code: form.code.trim().toUpperCase(), featuredOnHome, homeSort: featuredOnHome ? form.homeSort : null }); if (existing) await adminPromotionApi.update(existing.id, input); else await adminPromotionApi.create(input); flushSync(() => { setSaved(true); setDirty(false); }); await client.invalidateQueries({ queryKey: ["admin-promotions"] }); toast.add({ title: "บันทึกโค้ดสำเร็จ", type: "success" }); navigate("/admin/promotions"); } catch (error) { const message = error instanceof Error ? error.message : "กรุณาลองอีกครั้ง"; if (error instanceof ApiError && error.code === "PROMO_CODE_TAKEN") setErrors((old) => ({ ...old, code: "โค้ดนี้มีอยู่แล้ว (PROMO_CODE_TAKEN) — ลองเพิ่มตัวเลขต่อท้าย" })); else if (error instanceof ApiError && error.code === "PROMO_IN_USE") toast.add({ title: "แก้ไขโค้ดนี้ไม่ได้", description: "โค้ดเคยถูกใช้หรือเก็บแล้ว กรุณาตรวจฟิลด์ที่ล็อกและจำนวนสิทธิ์", type: "error" }); else toast.add({ title: "บันทึกไม่สำเร็จ", description: message, type: "error" }); } finally { setBusy(false); setConfirm(false); } };
  const fieldError = (key: keyof AdminPromotionInput) => errors[key] && <span role="alert" className="promotion-field-error">{errors[key]}</span>;
  const numberField = (label: string, key: "discountValue" | "maxDiscount" | "minSpend" | "usageLimitTotal" | "usageLimitPerUser" | "claimLimit", options: { required?: boolean; disabled?: boolean; prefix?: string; suffix?: string; hint?: string; min?: number } = {}) => <div className="promotion-field">
    <label htmlFor={`promotion-${key}`}>{label}{options.required && <em> *</em>}</label>
    <div className="promotion-input-wrap">{options.prefix && <span className="promotion-input-affix">{options.prefix}</span>}<Input id={`promotion-${key}`} aria-label={label} type="number" min={options.min ?? 0} value={form[key] ?? ""} disabled={options.disabled} onChange={(event) => change(key, event.target.value === "" ? null as never : Number(event.target.value))} />{options.suffix && <span className="promotion-input-affix promotion-input-suffix">{options.suffix}</span>}</div>
    {options.hint && <p className="promotion-field-hint">{options.hint}</p>}{fieldError(key)}
  </div>;
  const sampleSubtotal = 2400;
  const sampleShipping = form.discountType === "FREE_SHIPPING" ? 60 : 0;
  const sampleDiscount = form.discountType === "PERCENT" ? Math.min(sampleSubtotal * Number(form.discountValue || 0) / 100, form.maxDiscount ?? Infinity) : form.discountType === "FIXED" ? Math.min(sampleSubtotal, Number(form.discountValue || 0)) : Math.min(sampleShipping, form.maxDiscount ?? sampleShipping);
  const period = formatThaiPeriod(form.startsAt, form.endsAt);
  const maxPerOrder = form.discountType === "PERCENT" ? form.maxDiscount ?? 0 : form.discountType === "FIXED" ? Number(form.discountValue || 0) : form.maxDiscount ?? 60;
  const budget = form.usageLimitTotal == null || (form.discountType === "PERCENT" && form.maxDiscount == null) ? "ไม่จำกัด" : money(maxPerOrder * form.usageLimitTotal);
  return <main className="promotion-admin promotion-form-page">
    <nav aria-label="breadcrumb" className="promotion-breadcrumb"><Link to="/admin/promotions">โปรโมชั่น & โค้ดส่วนลด</Link><span>/</span><span>{existing ? `แก้ไข ${existing.code}` : "สร้างโค้ด Pegasus"}</span></nav>
    <header className="promotion-form-header"><div><h1>{existing ? "แก้ไขโค้ด Pegasus" : "สร้างโค้ด Pegasus"}</h1><p>Pegasus เป็นผู้ออกเงินส่วนลด — ร้านค้ายังได้รับเงินเต็มจำนวน</p></div><div className="promotion-header-actions"><Button variant="outline" onClick={() => navigate("/admin/promotions")}>ยกเลิก</Button><Button onClick={() => { if (validate()) setConfirm(true); }}>{existing ? "บันทึก" : "บันทึกและเปิดใช้"}</Button></div></header>
    {locked && <div className="promotion-edit-notice">โค้ดนี้มีคนใช้แล้ว {existing?.usedCount} ครั้ง — ฟิลด์ที่ล็อกแก้ไม่ได้ วันสิ้นสุดและจำนวนสิทธิ์เพิ่มได้เท่านั้น</div>}
    <div className="promotion-form-grid"><div className="promotion-form-sections">
      <Card className="promotion-section"><h2>1. ข้อมูลโค้ด</h2>
        <div className="promotion-two-cols"><div className="promotion-field"><label htmlFor="promotion-code">รหัสโค้ด <em>*</em></label><div className="promotion-code-input"><Input id="promotion-code" aria-label="รหัสโค้ด" value={form.code} maxLength={20} disabled={locked} placeholder="PEGASUS10" onChange={(event) => change("code", event.target.value.toUpperCase())} /><Button type="button" variant="outline" size="sm" disabled={locked} onClick={() => change("code", Math.random().toString(36).slice(2, 10).toUpperCase())}>สุ่มโค้ด</Button></div><p className="promotion-field-hint">A–Z และ 0–9 ยาว 4–20 ตัว · ระบบเก็บเป็นตัวพิมพ์ใหญ่ และห้ามซ้ำกับโค้ดร้าน</p>{fieldError("code")}</div>
          <div className="promotion-field"><label htmlFor="promotion-name">ชื่อแคมเปญ (แสดงให้ผู้ซื้อเห็น) <em>*</em></label><Input id="promotion-name" aria-label="ชื่อแคมเปญ" value={form.name} maxLength={60} placeholder="ลด 10% ต้อนรับปลายปี" onChange={(event) => change("name", event.target.value)} /><p className="promotion-field-hint">สูงสุด 60 ตัวอักษร</p>{fieldError("name")}</div></div>
        <div className="promotion-field"><span className="promotion-field-label">การมองเห็น</span><RadioGroup aria-label="การมองเห็น" value={form.visibility} onValueChange={(value) => change("visibility", value as AdminPromotionInput["visibility"])} className="promotion-choice-grid promotion-choice-grid-two"><ChoiceCard value="PUBLIC" title="สาธารณะ" hint="แสดงในตัวเลือกโค้ดตอนชำระเงิน" selected={form.visibility === "PUBLIC"} disabled={locked} /><ChoiceCard value="PRIVATE" title="ส่วนตัว" hint="ผู้ซื้อต้องพิมพ์โค้ดเอง (แจกผ่านโซเชียล)" selected={form.visibility === "PRIVATE"} disabled={locked} /></RadioGroup></div>
        <details className="promotion-extra"><summary>คำอธิบายเพิ่มเติม</summary><Input aria-label="คำอธิบาย" value={form.description || ""} maxLength={500} placeholder="คำอธิบายภายในแคมเปญ (ไม่บังคับ)" onChange={(event) => change("description", event.target.value)} /></details>
      </Card>
      <Card className="promotion-section"><h2>2. ประเภทส่วนลด</h2>
        <RadioGroup aria-label="ประเภทส่วนลด" value={form.discountType} onValueChange={(value) => change("discountType", value as AdminPromotionInput["discountType"])} className="promotion-choice-grid promotion-choice-grid-three"><ChoiceCard value="PERCENT" title="เปอร์เซ็นต์" hint="ลด x% ของยอดสินค้า" selected={form.discountType === "PERCENT"} disabled={locked} /><ChoiceCard value="FIXED" title="จำนวนเงิน" hint="ลดเป็นบาท" selected={form.discountType === "FIXED"} disabled={locked} /><ChoiceCard value="FREE_SHIPPING" title="ส่งฟรี" hint="ลดค่าส่งทุกร้าน" selected={form.discountType === "FREE_SHIPPING"} disabled={locked} /></RadioGroup>
        <div className="promotion-two-cols">{form.discountType !== "FREE_SHIPPING" && numberField("มูลค่าส่วนลด", "discountValue", { required: true, disabled: locked, suffix: form.discountType === "PERCENT" ? "%" : "บาท", hint: form.discountType === "PERCENT" ? "1–90%" : "ต้องมากกว่า ฿0", min: form.discountType === "PERCENT" ? 1 : 0 })}{form.discountType !== "FIXED" && numberField("ส่วนลดสูงสุด", "maxDiscount", { disabled: locked, prefix: "฿", hint: "เว้นว่าง = ไม่จำกัด (แนะนำให้ใส่)" })}</div>
      </Card>
      <Card className="promotion-section"><h2>3. เงื่อนไข</h2><p className="promotion-section-hint">ยอดขั้นต่ำคิดจากสินค้าที่เข้าเงื่อนไขหลังหักโค้ดร้าน ไม่รวมค่าส่ง</p>
        <div className="promotion-two-cols"><div>{numberField("ยอดสั่งซื้อขั้นต่ำ", "minSpend", { prefix: "฿", disabled: locked })}</div><div className="promotion-field"><span className="promotion-field-label">ใช้กับสินค้า</span><div className="promotion-scope-options">{(["ALL", "GAME", "CATEGORY"] as const).map((value) => <button key={value} type="button" aria-pressed={form.scopeType === value} disabled={locked} onClick={() => { change("scopeType", value); change("scopeIds", []); }}>{value === "ALL" ? "ทุกเกม" : value === "GAME" ? "เลือกเกม" : "เลือกหมวดหมู่"}</button>)}</div></div></div>
        {form.scopeType !== "ALL" && <fieldset className="promotion-scope-list"><legend>{form.scopeType === "GAME" ? "เลือกเกม" : "เลือกหมวดหมู่"} (เลือกได้หลายรายการ)</legend>{(form.scopeType === "GAME" ? games.data : categories.data)?.map((item) => <label key={item.id}><input type="checkbox" checked={form.scopeIds.includes(item.id)} disabled={locked} onChange={(event) => change("scopeIds", event.target.checked ? [...form.scopeIds, item.id] : form.scopeIds.filter((id) => id !== item.id))} />{item.name}</label>)}{(form.scopeType === "GAME" ? games : categories).isPending && <span>กำลังโหลดรายการ...</span>}{(form.scopeType === "GAME" ? games : categories).isError && <span role="alert">โหลดรายการไม่สำเร็จ</span>}{fieldError("scopeIds")}</fieldset>}
        <ToggleRow id="promotion-new-buyer" title="เฉพาะผู้ซื้อใหม่" hint="ใช้ได้เฉพาะบัญชีที่ยังไม่เคยมีคำสั่งซื้อที่ชำระเงินแล้ว" checked={form.newBuyerOnly} disabled={locked} onChange={(checked) => change("newBuyerOnly", checked)} />
      </Card>
      <Card className="promotion-section"><h2>4. ระยะเวลาและจำนวนสิทธิ์</h2>
        <div className="promotion-two-cols">{(["startsAt", "endsAt"] as const).map((key) => <div className="promotion-field" key={key}><label htmlFor={`promotion-${key}`}>{key === "startsAt" ? "เริ่มใช้ได้" : "สิ้นสุด"}{key === "startsAt" && <em> *</em>}</label><Input id={`promotion-${key}`} aria-label={key === "startsAt" ? "เริ่มใช้ได้" : "สิ้นสุด"} type="datetime-local" value={toLocal(form[key])} disabled={locked && key === "startsAt"} onChange={(event) => change(key, event.target.value ? new Date(event.target.value).toISOString() : "")} />{key === "endsAt" && <p className="promotion-field-hint">ต้องหลังวันเริ่มใช้</p>}{fieldError(key)}</div>)}</div>
        <div className="promotion-two-cols">{numberField("จำนวนสิทธิ์ทั้งหมด", "usageLimitTotal", { suffix: "สิทธิ์", hint: "เว้นว่าง = ไม่จำกัด" })}{numberField("สิทธิ์ต่อผู้ซื้อ 1 คน", "usageLimitPerUser", { suffix: "ครั้ง", required: true, disabled: locked, min: 1 })}</div>
      </Card>
      <Card className="promotion-section"><h2>5. การแจกโค้ด (กดเก็บ) <span className="promotion-new-badge">ใหม่</span></h2>
        <ToggleRow id="promotion-claimable" title="ให้ผู้ซื้อกดเก็บได้" hint={'โค้ดจะมีปุ่ม “เก็บ” และอยู่ในกระเป๋า “โค้ดของฉัน” (ต้องเป็นโค้ดสาธารณะ)'} checked={form.claimable} disabled={form.visibility !== "PUBLIC"} onChange={(checked) => change("claimable", checked)} />
        <ToggleRow id="promotion-featured" title="แสดงบนหน้าแรก" hint={'อยู่ในแถบ “โค้ดส่วนลดจาก Pegasus” ใต้ Hero · สูงสุด 8 ใบ'} checked={form.featuredOnHome} disabled={!form.claimable || form.visibility !== "PUBLIC"} onChange={(checked) => change("featuredOnHome", checked)} />{fieldError("featuredOnHome")}
        <div className="promotion-two-cols">{numberField("จำนวนที่แจก (เก็บได้)", "claimLimit", { suffix: "ใบ", disabled: !form.claimable, hint: "เว้นว่าง = ไม่จำกัด · แยกจากจำนวนสิทธิ์ใช้" })}<div className="promotion-field"><label htmlFor="promotion-homeSort">ลำดับบนหน้าแรก</label><Input id="promotion-homeSort" aria-label="ลำดับบนหน้าแรก" type="number" min={1} max={8} value={form.homeSort == null ? "" : form.homeSort + 1} disabled={!form.featuredOnHome} onChange={(event) => change("homeSort", event.target.value === "" ? null : Number(event.target.value) - 1)} /><p className="promotion-field-hint">เลขน้อยแสดงก่อน</p>{fieldError("homeSort")}</div></div>
        <ToggleRow id="promotion-claim-required" title="ต้องเก็บก่อนใช้" hint="เปิด = พิมพ์โค้ดเองใช้ไม่ได้ถ้ายังไม่ได้เก็บ (PROMO_NOT_CLAIMED) เหมาะกับแคมเปญแจกจำนวนจำกัด" checked={form.claimRequired} disabled={locked || claimLocked || !form.claimable} onChange={(checked) => change("claimRequired", checked)} />{fieldError("claimRequired")}
      </Card>
    </div><aside className="promotion-form-aside"><Card className="promotion-aside-card"><h2>ผู้ซื้อจะเห็นแบบนี้</h2><ClaimTicketPreview promotion={form} /></Card>
      <Card className="promotion-calculation"><h2>ตัวอย่างการคำนวณ (ตะกร้า {money(sampleSubtotal)})</h2><div className="promotion-calculation-rows"><p><span>ยอดสินค้า</span><strong>{money(sampleSubtotal)}</strong></p><p className="promotion-discount-line"><span>ส่วนลด {form.discountType === "PERCENT" ? `${form.discountValue}% (สูงสุด ${form.maxDiscount == null ? "ไม่จำกัด" : money(form.maxDiscount)})` : form.discountType === "FIXED" ? money(form.discountValue) : "ค่าจัดส่ง"}</span><strong>− {money(sampleDiscount)}</strong></p><p><span>ผู้ซื้อจ่าย (ไม่รวมค่าส่ง)</span><strong>{money(sampleSubtotal - (form.discountType === "FREE_SHIPPING" ? 0 : sampleDiscount))}</strong></p><p><span>ร้านค้าได้รับ (ก่อนคอมมิชชั่น)</span><strong>{money(sampleSubtotal)}</strong></p></div><p className="promotion-calculation-total"><span>Pegasus ออกส่วนลด</span><strong>{money(sampleDiscount)}</strong></p></Card>
      <Card className="promotion-aside-card promotion-budget"><h2>งบสูงสุดของแคมเปญ</h2><strong>{budget}</strong><p>{form.usageLimitTotal ?? "ไม่จำกัด"} สิทธิ์ × ส่วนลดสูงสุด {form.discountType === "PERCENT" && form.maxDiscount == null ? "ไม่จำกัด" : money(maxPerOrder)} — ใช้ประเมินต้นทุนก่อนเปิดใช้</p></Card>
      <div className="promotion-warning"><strong>⚠ หลังมีคนใช้โค้ดแล้ว</strong><p>แก้ได้เฉพาะชื่อแคมเปญ, ยืดวันสิ้นสุด, เพิ่มจำนวนสิทธิ์ และหยุดชั่วคราว — ประเภท/มูลค่า/เงื่อนไขล็อก เพื่อให้ทุกออเดอร์คิดส่วนลดแบบเดียวกัน</p></div>
    </aside></div>
    <Dialog open={confirm} onOpenChange={setConfirm}><DialogContent showCloseButton={false} className="promotion-confirm-dialog max-w-[420px] overflow-hidden p-0">
      <div className="promotion-confirm-content grid gap-3 p-6 pb-5"><span aria-hidden className="promotion-modal-icon promotion-confirm-icon">{existing ? <Pencil /> : <Check />}</span><DialogHeader><DialogTitle className="text-lg font-bold">{existing ? "บันทึกการเปลี่ยนแปลง?" : `เปิดใช้โค้ด ${form.code}?`}</DialogTitle></DialogHeader><p className="text-xs text-muted-foreground">{existing ? `${form.code} ถูกใช้แล้ว ${existing.usedCount} ครั้ง · ผู้ที่เก็บไว้ ${existing.claimedCount} คนจะเห็นข้อมูลใหม่ทันที` : `${form.visibility === "PUBLIC" ? "ผู้ซื้อจะเห็นและเก็บโค้ดได้" : "ผู้ซื้อกรอกรหัสเพื่อรับส่วนลดได้"}ตั้งแต่ ${formatThaiDateTime(form.startsAt)} · Pegasus เป็นผู้ออกส่วนลด ร้านได้เงินเต็ม`}</p>
      {existing ? <div className="grid max-h-52 gap-2 overflow-y-auto rounded-lg bg-[#f6f8f9] p-3 text-xs">{changedFields.length ? changedFields.map((key) => <div key={key} className="grid grid-cols-[100px_1fr] gap-2 border-b pb-1 last:border-0"><strong>{fieldNames[key] || key}</strong><span>{showValue(existing[key])} → <b className="text-primary">{showValue(form[key])}</b></span></div>) : <p>ไม่มีข้อมูลที่เปลี่ยนแปลง</p>}</div> : <div className="promotion-confirm-summary"><p><span>ส่วนลด</span><strong>{form.discountType === "FREE_SHIPPING" ? "ส่งฟรี" : form.discountType === "PERCENT" ? `${form.discountValue}% สูงสุด ${form.maxDiscount == null ? "ไม่จำกัด" : money(form.maxDiscount)}` : money(form.discountValue)}</strong></p><p><span>เงื่อนไข</span><strong>ขั้นต่ำ {money(form.minSpend)} · {form.scopeType === "ALL" ? "ทุกเกม" : form.scopeType === "GAME" ? "เลือกเกม" : "เลือกหมวดหมู่"}</strong></p><p><span>ระยะเวลา</span><strong>{period}</strong></p><p><span>สิทธิ์ใช้</span><strong>{form.usageLimitTotal ?? "ไม่จำกัด"} สิทธิ์ · {form.usageLimitPerUser} ครั้ง/คน</strong></p><p><span>การแจก</span><strong>{form.claimable ? `แจก ${form.claimLimit ?? "ไม่จำกัด"} ใบ · ${form.featuredOnHome ? `หน้าแรก ลำดับ ${form.homeSort == null ? "—" : form.homeSort + 1}` : "ทั่วไป"}` : "ใช้รหัสโดยตรง"}</strong></p><p className="promotion-confirm-budget"><span>งบสูงสุด ({form.usageLimitTotal ?? "ไม่จำกัด"} × {form.discountType === "FREE_SHIPPING" ? "฿60" : money(maxPerOrder)})</span><strong>{budget}</strong></p></div>}
      </div><DialogFooter className="promotion-dialog-footer"><Button variant="outline" onClick={() => setConfirm(false)}>ยกเลิก</Button><Button disabled={busy || (!!existing && changedFields.length === 0)} onClick={() => void save()}>{existing ? "บันทึก" : "เปิดใช้โค้ด"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={blocker.state === "blocked"} onOpenChange={(open) => { if (!open && blocker.state === "blocked") blocker.reset(); }}><DialogContent showCloseButton={false} className="promotion-action-dialog max-w-[420px] overflow-hidden p-0"><div className="grid gap-3 p-6 pb-5"><span className="promotion-modal-icon promotion-leave-icon"><LogOut /></span><DialogHeader><DialogTitle>ออกจากหน้านี้?</DialogTitle></DialogHeader><p className="text-xs text-muted-foreground">การเปลี่ยนแปลงในฟอร์มยังไม่ได้บันทึก ถ้าออกตอนนี้ข้อมูลจะหายทั้งหมด</p></div><DialogFooter className="promotion-dialog-footer"><span className="promotion-footer-note" /><Button variant="outline" onClick={() => blocker.reset?.()}>อยู่ต่อ</Button><Button variant="destructive" onClick={() => blocker.proceed?.()}>ออกโดยไม่บันทึก</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}
