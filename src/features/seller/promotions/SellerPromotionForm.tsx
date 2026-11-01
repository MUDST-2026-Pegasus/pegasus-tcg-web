import { useState } from "react";
import { LockKeyhole, LogOut, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { sellerPromotionApi } from "./api";
import { CouponTicket, SellerField } from "./components";
import { money } from "./format";
import { getSellerPromotionErrors } from "./validation";
import type { SellerPromotion, SellerPromotionInput } from "./types";

const newInput = (): SellerPromotionInput => ({ code: "", name: "", description: "", discountType: "FIXED", discountValue: 100, maxDiscount: null, minSpend: 1000, visibility: "PUBLIC", newBuyerOnly: false, usageLimitTotal: 50, usageLimitPerUser: 1, claimable: true, claimLimit: 100, featuredOnHome: false, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 30 * 86400000).toISOString() });
const inputKeys: Array<keyof SellerPromotionInput> = ["code", "name", "description", "discountType", "discountValue", "maxDiscount", "minSpend", "visibility", "newBuyerOnly", "usageLimitTotal", "usageLimitPerUser", "claimable", "claimLimit", "featuredOnHome", "startsAt", "endsAt"];
const fromExisting = (source: SellerPromotion): SellerPromotionInput => Object.fromEntries(inputKeys.map((key) => [key, key === "featuredOnHome" ? false : source[key]])) as unknown as SellerPromotionInput;
const toLocal = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
};

export function SellerPromotionForm({ existing, open, verified, onClose, onSaved }: { existing?: SellerPromotion; open: boolean; verified: boolean; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const [form, setForm] = useState<SellerPromotionInput>(() => existing ? fromExisting(existing) : newInput());
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const locked = !!existing && existing.usedCount > 0;
  const change = <K extends keyof SellerPromotionInput>(key: K, value: SellerPromotionInput[K]) => { setForm((old) => ({ ...old, [key]: value })); setErrors((old) => ({ ...old, [key]: "" })); setDirty(true); };
  const requestClose = () => dirty ? setConfirmClose(true) : onClose();
  const save = async () => {
    const issues = getSellerPromotionErrors(form, existing);
    setErrors(issues);
    if (Object.keys(issues).length) return;
    setBusy(true);
    try {
      const input = { ...form, code: form.code.trim().toUpperCase(), featuredOnHome: false };
      if (existing) await sellerPromotionApi.update(existing.id, input);
      else await sellerPromotionApi.create(input);
      await onSaved();
      setDirty(false);
      onClose();
      toast.add({ title: existing ? `บันทึกโค้ด ${input.code} แล้ว` : `สร้างโค้ด ${input.code} แล้ว`, type: "success" });
    } catch (error) {
      if (error instanceof ApiError && error.code === "PROMO_CODE_TAKEN") setErrors((old) => ({ ...old, code: "โค้ดนี้ถูกใช้แล้วในระบบ (PROMO_CODE_TAKEN)" }));
      else toast.add({ title: "บันทึกไม่สำเร็จ", description: error instanceof Error ? error.message : "กรุณาลองอีกครั้ง", type: "error" });
    } finally { setBusy(false); }
  };
  const textField = (label: string, key: "code" | "name" | "description", hint?: string, disabled = false) => <SellerField label={label} hint={hint} error={errors[key]}><div className="seller-promo-input-wrap"><Input aria-label={label} disabled={disabled} value={form[key] ?? ""} onChange={(event) => change(key, key === "code" ? event.target.value.toUpperCase() : event.target.value)} />{disabled && <LockKeyhole aria-hidden />}</div></SellerField>;
  const numberField = (label: string, key: "discountValue" | "maxDiscount" | "minSpend" | "usageLimitTotal" | "usageLimitPerUser" | "claimLimit", unit: string, hint?: string, disabled = false) => <SellerField label={label} hint={hint} error={errors[key]}><div className={`seller-promo-input-wrap ${unit === "฿" ? "seller-promo-input-prefix" : ""}`}><Input aria-label={label} type="number" min="0" disabled={disabled} value={form[key] ?? ""} onChange={(event) => change(key, event.target.value === "" ? null as never : Number(event.target.value))} />{unit && <span>{unit}</span>}{disabled && <LockKeyhole aria-hidden />}</div></SellerField>;
  const dateField = (label: string, key: "startsAt" | "endsAt", disabled = false) => <SellerField label={label} error={errors[key]}><div className="seller-promo-input-wrap"><Input aria-label={label} type="datetime-local" disabled={disabled} value={toLocal(form[key])} onChange={(event) => change(key, event.target.value ? new Date(event.target.value).toISOString() : "")} />{disabled && <LockKeyhole aria-hidden />}</div></SellerField>;
  const exampleSubtotal = Math.max(1200, form.minSpend || 0);
  const exampleDiscount = form.discountType === "FIXED" ? form.discountValue || 0 : Math.min(exampleSubtotal * (form.discountValue || 0) / 100, form.maxDiscount ?? Infinity);
  const afterShopCode = Math.max(0, exampleSubtotal - exampleDiscount);
  const commission = afterShopCode * 0.05;

  return <><Dialog open={open} onOpenChange={(value) => { if (!value) requestClose(); }}><DialogContent showCloseButton={false} className={`seller-promo-form-dialog ${locked ? "seller-promo-form-edit" : ""}`}><div className="seller-promo-form-main"><div className="seller-promo-form-fields"><DialogHeader>{locked && <div className="seller-promo-modal-icon edit"><Pencil /></div>}<DialogTitle>{existing ? `แก้ไขโค้ด ${existing.code}` : "สร้างโค้ดร้าน"}</DialogTitle>{locked && <p>ลูกค้าใช้แล้ว {existing.usedCount} ครั้ง · ช่องที่มีรูปกุญแจแก้ไม่ได้เพื่อให้ออเดอร์คิดส่วนลดแบบเดียวกัน</p>}</DialogHeader>
    {locked ? <>
      <div className="seller-promo-two-cols">{textField("รหัสโค้ด", "code", undefined, true)}{numberField("ส่วนลด", "discountValue", form.discountType === "FIXED" ? "฿" : "%", undefined, true)}</div>
      <div className="seller-promo-two-cols">{numberField("ยอดขั้นต่ำ", "minSpend", "฿", undefined, true)}{textField("ชื่อที่ลูกค้าเห็น", "name")}</div>
      <div className="seller-promo-two-cols">{dateField("สิ้นสุด (ยืดได้)", "endsAt")}{numberField("สิทธิ์ต่อคน", "usageLimitPerUser", "ครั้ง", undefined, true)}</div>
      <div className="seller-promo-two-cols">{numberField(`จำนวนสิทธิ์ (≥ ${existing.usedCount})`, "usageLimitTotal", "สิทธิ์")}{form.claimable && numberField(`จำนวนที่แจก (≥ ${existing.claimedCount})`, "claimLimit", "ใบ")}</div>
    </> : <>
      <div className="seller-promo-two-cols">{textField("รหัสโค้ด *", "code", "A–Z 0–9 · 4–20 ตัว")}{textField("ชื่อที่ลูกค้าเห็น *", "name")}</div>
      <SellerField label="ประเภทส่วนลด"><div className="seller-promo-segments" role="group" aria-label="ประเภทส่วนลด"><button type="button" aria-pressed={form.discountType === "FIXED"} onClick={() => change("discountType", "FIXED")}>ลดเป็นบาท</button><button type="button" aria-pressed={form.discountType === "PERCENT"} onClick={() => change("discountType", "PERCENT")}>ลดเป็น %</button></div></SellerField>
      <div className="seller-promo-two-cols">{numberField("ลด *", "discountValue", form.discountType === "FIXED" ? "฿" : "%")}{numberField("ยอดขั้นต่ำ (เฉพาะสินค้าร้านนี้)", "minSpend", "฿", "ส่วนลดต้องไม่เกินยอดขั้นต่ำ")}</div>
      {form.discountType === "PERCENT" && numberField("เพดานส่วนลด", "maxDiscount", "฿")}
      <div className="seller-promo-two-cols">{dateField("เริ่ม *", "startsAt")}{dateField("สิ้นสุด", "endsAt")}</div>
      <div className="seller-promo-two-cols">{numberField("จำนวนสิทธิ์ทั้งหมด", "usageLimitTotal", "สิทธิ์", "เว้นว่าง = ไม่จำกัด")}{numberField("สิทธิ์ต่อคน", "usageLimitPerUser", "ครั้ง")}</div>
      <SellerField label="การมองเห็น"><div className="seller-promo-segments" role="group" aria-label="การมองเห็น"><button type="button" aria-pressed={form.visibility === "PUBLIC"} onClick={() => change("visibility", "PUBLIC")}>สาธารณะ</button><button type="button" aria-pressed={form.visibility === "PRIVATE"} onClick={() => { change("visibility", "PRIVATE"); change("claimable", false); }}>ส่วนตัว (พิมพ์เอง)</button></div></SellerField>
      <div className="seller-promo-switch-row"><div><strong>ให้ลูกค้ากดเก็บที่หน้าร้าน</strong><small>แสดงในแถบ “โค้ดส่วนลดของร้าน” บนหน้าร้าน (ต้องเป็นสาธารณะ)</small></div><Switch checked={form.claimable} disabled={form.visibility !== "PUBLIC"} onCheckedChange={(checked) => change("claimable", checked)} aria-label="ให้ลูกค้ากดเก็บที่หน้าร้าน" /></div>{errors.claimable && <p role="alert" className="seller-promo-error">{errors.claimable}</p>}
      {form.claimable && numberField("จำนวนที่แจก", "claimLimit", "ใบ", "เว้นว่าง = ไม่จำกัด")}
      {textField("คำอธิบาย", "description")}
    </>}
    <DialogFooter className="seller-promo-form-actions"><Button variant="outline" onClick={requestClose}>ยกเลิก</Button><Button disabled={busy || !verified} onClick={() => void save()}>{existing ? "บันทึก" : "สร้างโค้ด"}</Button></DialogFooter>
  </div>{!locked && <aside className="seller-promo-preview"><strong>ตัวอย่าง</strong><CouponTicket promotion={form} preview /><div className="seller-promo-calculation"><strong>ถ้าลูกค้าซื้อ {money(exampleSubtotal)} จากร้านคุณ</strong><div><span>ยอดสินค้า</span><b>{money(exampleSubtotal)}</b></div><div><span>โค้ดร้าน (ร้านออก)</span><b className="discount">− {money(exampleDiscount)}</b></div><div><span>คอมมิชชั่น 5% ของ {money(afterShopCode)}</span><b>− {money(commission)}</b></div><div className="total"><span>ร้านได้รับ (ไม่รวมค่าส่ง)</span><b>{money(Math.max(0, afterShopCode - commission))}</b></div><p>ถ้าลูกค้าใช้โค้ด Pegasus ร่วมด้วย ร้านยังได้ยอดนี้เท่าเดิม</p></div></aside>}</div></DialogContent></Dialog>
    <Dialog open={confirmClose} onOpenChange={setConfirmClose}><DialogContent showCloseButton={false} className="seller-promo-action-dialog seller-promo-discard-dialog"><div className="seller-promo-dialog-main"><div className="seller-promo-modal-icon leave"><LogOut aria-hidden="true" strokeWidth={2.2} /></div><DialogHeader><DialogTitle>ทิ้งการแก้ไข?</DialogTitle></DialogHeader><p>ข้อมูลที่กรอกในฟอร์มยังไม่ได้บันทึก ถ้าปิดตอนนี้จะหายทั้งหมด</p></div><DialogFooter className="seller-promo-dialog-footer"><Button variant="outline" onClick={() => setConfirmClose(false)}>กลับไปแก้ต่อ</Button><Button variant="destructive" onClick={() => { setConfirmClose(false); setDirty(false); onClose(); }}>ทิ้งการแก้ไข</Button></DialogFooter></DialogContent></Dialog></>;
}
