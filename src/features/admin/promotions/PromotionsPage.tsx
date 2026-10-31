import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpDown, Check, GripVertical, Info, Pause, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { adminPromotionApi } from "./api";
import type { AdminPromotion, AdminPromotionInput, PromotionStatus } from "./types";
import { AdminPromotionRow, PromotionStatusPill } from "./components";
import "./promotions.css";

const statuses: Array<[PromotionStatus | "ALL", string]> = [["ALL", "ทั้งหมด"], ["ACTIVE", "ใช้งานอยู่"], ["SCHEDULED", "ตั้งเวลาไว้"], ["PAUSED", "หยุดชั่วคราว"], ["EXPIRED", "หมดอายุ"]];
const money = (amount: number) => `฿${amount.toLocaleString("th-TH")}`;
const formatThaiDate = (value: string) => new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const formatThaiPeriod = (startValue: string, endValue: string) => {
  const start = new Date(startValue); const end = new Date(endValue);
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    const monthYear = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { month: "short", year: "numeric" }).format(end);
    return `${start.getDate()} – ${end.getDate()} ${monthYear}`;
  }
  return `${formatThaiDate(startValue)} – ${formatThaiDate(endValue)}`;
};
const discount = (code: AdminPromotion) => code.discountType === "FREE_SHIPPING" ? "ส่งฟรี" : code.discountType === "PERCENT" ? `ลด ${code.discountValue}%` : `ลด ${money(code.discountValue)}`;
const candidate = (code: AdminPromotion) => code.ownerType === "PLATFORM" && code.claimable && code.visibility === "PUBLIC" && (code.status === "ACTIVE" || code.status === "SCHEDULED");
const maskedBuyer = (name: string) => name.trim().split(/\s+/).map((part, index) => index === 0 ? part : `${part[0]}.`).join(" ");

async function loadHomeCandidates() {
  const first = await adminPromotionApi.list({ owner: "PLATFORM", page: 0, size: 100 });
  const results = [...first.page.items];
  for (let page = 1; page < first.page.totalPages; page++) {
    const next = await adminPromotionApi.list({ owner: "PLATFORM", page, size: 100 });
    results.push(...next.page.items);
  }
  return results.filter(candidate);
}

export function AdminPromotionsPage() {
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const owner = params.get("owner") as "PLATFORM" | "SELLER" | null;
  const status = params.get("status") as PromotionStatus | null;
  const q = params.get("q") || "";
  const page = Math.max(0, Number(params.get("page")) || 0);
  const [search, setSearch] = useState(q);
  useEffect(() => {
    if (search.trim() === q) return;
    const timer = window.setTimeout(() => { const next = new URLSearchParams(params); if (search.trim()) next.set("q", search.trim()); else next.delete("q"); next.delete("page"); setParams(next); }, 300);
    return () => window.clearTimeout(timer);
  }, [search, q, params, setParams]);
  const [action, setAction] = useState<{ kind: "pause" | "resume" | "delete"; code: AdminPromotion } | null>(null);
  const [reason, setReason] = useState("");
  const [reasonCategory, setReasonCategory] = useState("");
  const [notifySeller, setNotifySeller] = useState(true);
  const [confirmCode, setConfirmCode] = useState("");
  const [homeOpen, setHomeOpen] = useState(false);
  const [homeIds, setHomeIds] = useState<number[]>([]);
  const [showHomeCandidates, setShowHomeCandidates] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const [homeBusy, setHomeBusy] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const redemptionPage = Math.max(0, Number(params.get("redemptionPage")) || 0);
  const list = useQuery({ queryKey: ["admin-promotions", owner, status, q, page], queryFn: () => adminPromotionApi.list({ owner: owner || undefined, status: status || undefined, q: q || undefined, page, size: 8 }) });
  const summary = useQuery({ queryKey: ["admin-promotions", "summary"], queryFn: adminPromotionApi.summary });
  const homeCandidates = useQuery({ queryKey: ["admin-promotions", "home-candidates"], queryFn: loadHomeCandidates });
  const selectedId = Number(params.get("promo"));
  const selectedPromotion = useQuery({ queryKey: ["admin-promotions", selectedId], queryFn: () => adminPromotionApi.get(selectedId), enabled: selectedId > 0 });
  const redemption = useQuery({ queryKey: ["admin-promotions", "redemptions", selectedId, redemptionPage], queryFn: () => adminPromotionApi.redemptions(selectedId, redemptionPage), enabled: selectedId > 0 });
  const setParam = (key: string, value: string | null) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== "promo" && key !== "page" && key !== "redemptionPage") next.delete("page"); setParams(next); };
  const refresh = async () => { await client.invalidateQueries({ queryKey: ["admin-promotions"] }); };
  const openRedemptions = (id: number) => { const next = new URLSearchParams(params); next.set("promo", String(id)); next.delete("redemptionPage"); setParams(next); };
  const saveHomeOrder = async () => {
    setHomeBusy(true);
    try {
      await adminPromotionApi.homeOrder(homeIds);
      toast.add({ title: "จัดลำดับโค้ดหน้าแรกแล้ว", type: "success" });
      setHomeOpen(false);
      await refresh();
    } catch (error) {
      toast.add({ title: "จัดลำดับไม่สำเร็จ", description: error instanceof Error ? error.message : "กรุณาลองอีกครั้ง", type: "error" });
    } finally { setHomeBusy(false); }
  };
  const endToday = async () => {
    if (!action || action.kind !== "delete" || action.code.ownerType !== "PLATFORM") return;
    const code = action.code;
    if (code.usedCount > 0) return;
    setBusy(true);
    try {
      const input: AdminPromotionInput = {
        code: code.code, name: code.name, description: code.description, discountType: code.discountType,
        discountValue: code.discountValue, maxDiscount: code.maxDiscount, minSpend: code.minSpend,
        scopeType: code.scopeType, scopeIds: code.scopeIds, visibility: code.visibility,
        newBuyerOnly: code.newBuyerOnly, usageLimitTotal: code.usageLimitTotal,
        usageLimitPerUser: code.usageLimitPerUser, startsAt: code.startsAt,
        endsAt: new Date().toISOString(), claimable: code.claimable, claimRequired: code.claimRequired,
        claimLimit: code.claimLimit, featuredOnHome: false, homeSort: null,
      };
      await adminPromotionApi.update(code.id, input);
      toast.add({ title: "สิ้นสุดโค้ดวันนี้แล้ว", type: "success" });
      setAction(null);
      await refresh();
    } catch (error) {
      toast.add({ title: "สิ้นสุดโค้ดไม่สำเร็จ", description: error instanceof Error ? error.message : "กรุณาลองอีกครั้ง", type: "error" });
    } finally { setBusy(false); }
  };
  const act = async () => {
    if (!action) return;
    setBusy(true);
    try {
      if (action.kind === "pause") await adminPromotionApi.pause(action.code.id, action.code.ownerType === "SELLER" ? `${reasonCategory}: ${reason.trim()}` : reason, notifySeller);
      if (action.kind === "resume") await adminPromotionApi.resume(action.code.id, notifySeller);
      if (action.kind === "delete") await adminPromotionApi.remove(action.code.id);
      toast.add({ title: "อัปเดตโค้ดแล้ว", type: "success" }); setAction(null); await refresh();
    } catch (error) { if (error instanceof ApiError && error.code === "PROMO_IN_USE") setDeleteBlocked(true); else toast.add({ title: "ทำรายการไม่สำเร็จ", description: error instanceof Error ? error.message : "กรุณาลองอีกครั้ง", type: "error" }); }
    finally { setBusy(false); }
  };
  const rows = list.data?.page.items || [];
  const homeSelectedRows = homeIds.map((id) => homeCandidates.data?.find((code) => code.id === id)).filter((code): code is AdminPromotion => !!code);
  const availableHomeRows = (homeCandidates.data || []).filter((code) => !homeIds.includes(code.id));
  const totalPages = Math.max(1, list.data?.page.totalPages || 1);
  const firstVisiblePage = Math.max(0, Math.min(page - 1, totalPages - 3));
  const visiblePages = Array.from({ length: Math.min(3, totalPages) }, (_, index) => firstVisiblePage + index);
  return <main className="promotion-admin promotion-list-page grid gap-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-black">โปรโมชั่น & โค้ดส่วนลด</h1><p className="text-sm text-muted-foreground">สร้างโค้ดที่ Pegasus ออกเงิน และดูแลโค้ดที่ร้านค้าสร้างเอง</p></div><div className="flex gap-2"><Button variant="outline" disabled={homeCandidates.isPending} onClick={() => { setHomeIds((homeCandidates.data || []).filter((code) => code.featuredOnHome).sort((a, b) => (a.homeSort || 0) - (b.homeSort || 0)).map((code) => code.id)); setShowHomeCandidates(false); setHomeOpen(true); }}><ArrowUpDown />จัดลำดับหน้าแรก</Button><Button render={<Link to="/admin/promotions/new" />} nativeButton={false}><Plus />สร้างโค้ด Pegasus</Button></div></header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["โค้ดที่ใช้งานอยู่", (summary.data?.activePlatformCodes || 0) + (summary.data?.activeSellerCodes || 0), `Pegasus ${summary.data?.activePlatformCodes || 0} · ร้านค้า ${summary.data?.activeSellerCodes || 0}`], ["ใช้โค้ด (30 วัน)", summary.data?.redemptions30d || 0, summary.data?.redemptionsChangePercent == null ? "—" : `${summary.data.redemptionsChangePercent > 0 ? "+" : ""}${summary.data.redemptionsChangePercent}% จากเดือนก่อน`], ["ต้นทุนส่วนลดที่ Pegasus ออก (30 วัน)", money(summary.data?.platformDiscountCost30d || 0), "Pegasus เป็นผู้ออกส่วนลด"], ["ยอดขายจากออเดอร์ที่ใช้โค้ด", money(summary.data?.salesWithCodes30d || 0), "ยอดขาย 30 วันล่าสุด"]].map(([label, value, caption]) => <Card key={label} className="gap-1 rounded-xl bg-white p-5 shadow-none"><span className="text-xs text-muted-foreground">{label}</span><strong className="text-2xl">{value}</strong><span className="text-xs text-muted-foreground">{caption}</span></Card>)}</div>
    <Card className="gap-0 overflow-hidden rounded-xl bg-white p-0 shadow-none"><div className="promotion-list-toolbar border-b">
      <div className="promotion-status-tabs" role="tablist" aria-label="กรองตามสถานะ">{statuses.map(([value, label]) => { const selected = status === (value === "ALL" ? null : value); const count = value === "ALL" ? Object.values(list.data?.statusCounts || {}).reduce((a, b) => a + b, 0) : list.data?.statusCounts[value] || 0; return <button key={value} type="button" role="tab" aria-selected={selected} onClick={() => setParam("status", value === "ALL" ? null : value)} className={`promotion-status-tab ${selected ? "is-selected" : ""}`}><span>{label}</span><span className="promotion-tab-count">{count}</span></button>; })}</div>
      <div className="promotion-list-controls"><div className="promotion-owner-tabs" role="group" aria-label="เจ้าของโค้ด">{([[null, "ทุกเจ้าของ"], ["PLATFORM", "Pegasus"], ["SELLER", "ร้านค้า"]] as const).map(([value, label]) => <button key={value || "all"} type="button" aria-pressed={owner === value} onClick={() => setParam("owner", value)} className={owner === value ? "is-selected" : ""}>{label}</button>)}</div><form className="promotion-search" onSubmit={(event) => { event.preventDefault(); setParam("q", search.trim() || null); }}><Search aria-hidden /><Input aria-label="ค้นหาโค้ด" placeholder="ค้นหาโค้ด / แคมเปญ / ร้าน" value={search} onChange={(event) => setSearch(event.target.value)} /></form></div>
    </div>
      {list.isPending && <p className="p-6">กำลังโหลดโค้ด...</p>}{list.isError && <p role="alert" className="p-6 text-destructive">โหลดโค้ดไม่สำเร็จ <button onClick={() => void list.refetch()}>ลองอีกครั้ง</button></p>}
      {list.data && rows.length === 0 && <div className="m-5 grid justify-items-center gap-2 rounded-xl border border-dashed p-10 text-center"><div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-primary"><Plus /></div><strong className="text-sm">ยังไม่มีโค้ดในแท็บนี้</strong><p className="text-xs text-muted-foreground">สร้างโค้ด Pegasus เพื่อกระตุ้นยอดขายช่วงแคมเปญ</p><Button size="sm" render={<Link to="/admin/promotions/new" />} nativeButton={false}><Plus />สร้างโค้ด Pegasus</Button></div>}
      {rows.length > 0 && <div className="promotion-table-scroll"><table className="promotion-table w-full min-w-[1100px] text-left text-xs"><thead className="bg-slate-50 text-muted-foreground"><tr>{["โค้ด / แคมเปญ", "ส่วนลด", "เงื่อนไข", "ใช้ไปแล้ว", "ระยะเวลา", "สถานะ", ""].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr></thead><tbody>{rows.map((code) => <AdminPromotionRow key={code.id} promotion={code} now={openedAt} onView={openRedemptions} onAction={(kind, selected) => { setReason(""); setReasonCategory(""); setNotifySeller(true); setConfirmCode(""); setDeleteBlocked(false); setAction({ kind, code: selected }); }} />)}</tbody></table></div>}
      <div className="promotion-pagination border-t"><span>แสดง {rows.length ? page * 8 + 1 : 0}–{page * 8 + rows.length} จาก {list.data?.page.totalItems || 0} โค้ด</span><nav aria-label="หน้ารายการโปรโมชั่น" className="promotion-page-buttons"><Button size="icon-sm" variant="outline" aria-label="หน้าก่อนหน้า" disabled={page === 0} onClick={() => setParam("page", String(page - 1))}>‹</Button>{visiblePages.map((number) => <Button key={number} size="icon-sm" variant={number === page ? "default" : "outline"} aria-current={number === page ? "page" : undefined} aria-label={`หน้า ${number + 1}`} onClick={() => setParam("page", String(number))}>{number + 1}</Button>)}<Button size="icon-sm" variant="outline" aria-label="หน้าถัดไป" disabled={page + 1 >= totalPages} onClick={() => setParam("page", String(page + 1))}>›</Button></nav></div>
    </Card>
    <p className="promotion-admin-note"><Info aria-hidden /><span>โค้ดร้านค้า: ร้านเป็นผู้ออกเงินส่วนลดเอง แอดมินแก้ไขไม่ได้ แต่ “หยุดชั่วคราว” ได้พร้อมระบุเหตุผล (ร้านจะเห็นเหตุผลนั้น) · โค้ด Pegasus: ร้านได้เงินเต็ม Pegasus อุดหนุนส่วนต่างตอนปล่อย escrow</span></p>
    <Dialog open={!!action} onOpenChange={(open) => { if (!open) setAction(null); }}>
      <DialogContent showCloseButton={false} className="promotion-action-dialog max-w-[420px] overflow-hidden p-0">
        <div className="grid gap-3 p-6 pb-5">
          <div className={`flex size-10 items-center justify-center rounded-[10px] ${action?.kind === "delete" ? "bg-[#fde8e8] text-[#b42318]" : action?.kind === "resume" ? "bg-[#e8f1fc] text-[#0058bc]" : action?.kind === "pause" ? "bg-[#fdf0dd] text-[#b45309]" : "bg-[#e8f1fc] text-[#0058bc]"}`} aria-hidden>{action?.kind === "delete" ? <Trash2 className="size-5" /> : action?.kind === "pause" ? <Pause className="size-5" /> : <Check className="size-5" />}</div>
          <DialogHeader><DialogTitle className="text-lg font-bold">{action?.kind === "delete" ? deleteBlocked ? "ลบโค้ดนี้ไม่ได้" : `ลบโค้ด ${action.code.code}?` : action?.kind === "resume" ? `เปิดใช้ ${action.code.code} อีกครั้ง?` : `หยุดโค้ด ${action?.code.code} ชั่วคราว?`}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">{action?.kind === "pause" && action.code.ownerType === "SELLER" ? "โค้ดใช้ไม่ได้ทันที ร้านจะเห็นเหตุผลนี้และเปิดใช้เองไม่ได้ · ออเดอร์ที่ใช้ไปแล้วไม่ถูกกระทบ" : action?.kind === "pause" ? "ผู้ซื้อจะเก็บหรือใช้โค้ดนี้ไม่ได้จนกว่าจะเปิดอีกครั้ง · ออเดอร์ที่ชำระแล้วไม่ถูกกระทบ" : action?.kind === "delete" ? deleteBlocked ? `${action.code.code} ถูกเก็บ ${action.code.claimedCount} ครั้ง และใช้ในคำสั่งซื้อ ${action.code.usedCount} รายการ ต้องเก็บไว้เพื่อให้ใบเสร็จและบัญชีย้อนหลังถูกต้อง` : "ยังไม่มีใครเก็บหรือใช้โค้ดนี้ ลบแล้วกู้คืนไม่ได้" : `หยุดเมื่อ ${action?.code.pausedAt ? formatThaiDate(action.code.pausedAt) : "ไม่ทราบวันที่"}`}</p>
          {action?.kind === "resume" && <><div className="promotion-resume-reason"><span>เหตุผลที่หยุด</span><strong>{action.code.pauseReason || "ไม่มีเหตุผลระบุ"}</strong></div><div className="promotion-resume-summary"><p><span>สิทธิ์คงเหลือ</span><strong>{action.code.usageLimitTotal == null ? "ไม่จำกัด" : `${Math.max(0, action.code.usageLimitTotal - action.code.usedCount)} / ${action.code.usageLimitTotal}`}</strong></p><p><span>หมดอายุ</span><strong>{formatThaiDate(action.code.endsAt)}</strong></p></div>{action.code.ownerType === "SELLER" && <label className="promotion-notify-toggle"><input type="checkbox" checked={notifySeller} onChange={(event) => setNotifySeller(event.target.checked)} /><span>แจ้งร้านว่าเปิดใช้แล้ว</span></label>}</>}
          {action?.kind === "pause" && action.code.ownerType === "PLATFORM" && <><div className="promotion-resume-summary"><p><span>ผู้ที่เก็บไว้</span><strong>{action.code.claimedCount} คน</strong></p><p><span>ใช้โค้ดแล้ว</span><strong>{action.code.usedCount} ครั้ง</strong></p></div><p className="promotion-action-note">ผู้ที่เก็บไว้จะเห็นโค้ดในกระเป๋าพร้อมป้าย “หยุดชั่วคราว” · ออเดอร์ที่ชำระแล้วไม่ถูกกระทบ</p></>}
          {deleteBlocked && <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">มีผู้เก็บหรือใช้โค้ดแล้ว จึงลบไม่ได้{action?.code.usedCount ? " โค้ดที่เคยถูกใช้ไม่สามารถลดวันสิ้นสุดผ่าน API ปัจจุบัน" : " สามารถหยุดชั่วคราวหรือสิ้นสุดวันนี้ได้"}</div>}
          {action?.kind === "pause" && action.code.ownerType === "SELLER" && <div className="grid gap-3"><label className="grid gap-1 text-xs">เหตุผล *<select className="rounded-md border bg-card p-2 text-sm" value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value)}><option value="">เลือกเหตุผล</option><option value="ส่วนลดสูงผิดปกติ / สงสัยปั่นยอด">ส่วนลดสูงผิดปกติ / สงสัยปั่นยอด</option><option value="ข้อมูลโค้ดไม่ถูกต้อง">ข้อมูลโค้ดไม่ถูกต้อง</option><option value="เหตุผลอื่น">เหตุผลอื่น</option></select></label><label className="grid gap-1 text-xs">รายละเอียดถึงร้าน<textarea className="min-h-16 rounded-md border bg-card p-3 text-sm" maxLength={230} placeholder="ระบุรายละเอียดที่ร้านจะได้รับ" value={reason} onChange={(event) => setReason(event.target.value)} /></label><label className="promotion-notify-toggle"><input type="checkbox" checked={notifySeller} onChange={(event) => setNotifySeller(event.target.checked)} /><span>แจ้งร้านทางอีเมลและแจ้งเตือนในแอป</span></label></div>}
          {action?.kind === "delete" && !deleteBlocked && <label className="grid gap-1 text-xs">พิมพ์ {action.code.code} เพื่อยืนยัน<Input placeholder={action.code.code} value={confirmCode} onChange={(event) => setConfirmCode(event.target.value)} /></label>}
        </div>
        <DialogFooter className="promotion-dialog-footer">
          {action?.kind === "pause" && action.code.ownerType === "SELLER" && <span className="promotion-footer-note">บันทึกใน Activity Log</span>}
          {action?.kind === "resume" && action.code.ownerType === "SELLER" && <span className="promotion-footer-note">บันทึกใน Activity Log</span>}
          <Button variant="outline" onClick={() => setAction(null)}>ยกเลิก</Button>
          {!deleteBlocked && <Button disabled={busy || (action?.kind === "delete" && confirmCode !== action.code.code) || (action?.kind === "pause" && action.code.ownerType === "SELLER" && (!reasonCategory || !reason.trim()))} onClick={() => void act()}>{action?.kind === "delete" ? "ลบโค้ด" : action?.kind === "pause" ? "หยุดชั่วคราว" : "เปิดใช้อีกครั้ง"}</Button>}
          {deleteBlocked && action && <Button disabled={busy} onClick={() => { setAction({ kind: "pause", code: action.code }); setDeleteBlocked(false); }}>หยุดชั่วคราว</Button>}
          {deleteBlocked && action?.code.ownerType === "PLATFORM" && <Button disabled={busy || action.code.usedCount > 0 || new Date(action.code.startsAt).getTime() >= openedAt} title={action.code.usedCount > 0 ? "API ไม่อนุญาตให้ลดวันสิ้นสุดหลังมีการใช้โค้ด" : undefined} onClick={() => void endToday()}>สิ้นสุดวันนี้</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={homeOpen} onOpenChange={setHomeOpen}><DialogContent showCloseButton={false} className="promotion-order-dialog max-w-[460px] overflow-hidden p-0">
      <div className="promotion-order-content"><div className="promotion-modal-icon promotion-sort-icon"><ArrowUpDown aria-hidden /></div><DialogHeader><DialogTitle className="text-lg font-bold">จัดลำดับโค้ดบนหน้าแรก</DialogTitle></DialogHeader><p className="text-xs text-muted-foreground">แสดงสูงสุด 8 ใบ เรียงจากซ้ายไปขวา · ลากเพื่อเปลี่ยนลำดับ</p>
        {homeCandidates.isPending && <p className="py-3 text-xs text-muted-foreground">กำลังโหลดโค้ด Pegasus...</p>}{homeCandidates.isError && <p role="alert" className="text-sm text-destructive">โหลดโค้ดไม่สำเร็จ <button onClick={() => void homeCandidates.refetch()}>ลองอีกครั้ง</button></p>}
        <div className="promotion-order-list">{homeSelectedRows.map((code, index) => <div key={code.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", String(code.id))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const draggedId = Number(event.dataTransfer.getData("text/plain")); setHomeIds((ids) => { const from = ids.indexOf(draggedId); const to = ids.indexOf(code.id); if (from < 0 || to < 0 || from === to) return ids; const next = [...ids]; next.splice(from, 1); next.splice(to, 0, draggedId); return next; }); }} className="promotion-order-row">
          <GripVertical aria-hidden className="promotion-order-grip" /><span className="promotion-order-number">{index + 1}</span><div className="promotion-order-copy"><strong>{code.code}</strong><small>{code.discountType === "PERCENT" ? `ลด ${code.discountValue}%` : code.discountType === "FREE_SHIPPING" ? "ส่งฟรี" : `ลด ${money(code.discountValue)}`} · {code.name}</small></div><span className="promotion-order-status">{code.status === "ACTIVE" ? "ใช้งานอยู่" : code.status === "SCHEDULED" ? "ตั้งเวลาไว้" : "หยุดชั่วคราว"}</span>
          <div className="promotion-order-actions"><Button type="button" variant="ghost" size="icon-xs" aria-label={`นำ ${code.code} ออกจากหน้าแรก`} onClick={() => setHomeIds((ids) => ids.filter((id) => id !== code.id))}><X /></Button></div>
        </div>)}</div>
        {homeIds.length < 8 && <Button type="button" variant="outline" className="promotion-order-add" onClick={() => setShowHomeCandidates((show) => !show)}><Plus />{showHomeCandidates ? "ซ่อนโค้ด Pegasus" : `เพิ่มโค้ด Pegasus (${homeIds.length}/8)`}</Button>}
        {showHomeCandidates && <div className="promotion-order-available" aria-label="โค้ด Pegasus ที่เพิ่มได้">{availableHomeRows.length === 0 ? <p className="text-xs text-muted-foreground">ไม่มีโค้ดอื่นที่เพิ่มได้</p> : availableHomeRows.map((code) => <button type="button" key={code.id} disabled={homeIds.length >= 8} onClick={() => setHomeIds((ids) => ids.length < 8 ? [...ids, code.id] : ids)}><Plus /><span><strong>{code.code}</strong><small>{code.name}</small></span></button>)}</div>}
        <p className="promotion-order-hint">แสดงบนหน้าแรกได้ไม่เกิน 8 โค้ด เรียงตามลำดับที่เลือก โค้ดที่ไม่เลือกยังใช้ได้จากหน้ารวมโปรโมชั่น</p>
      </div><DialogFooter className="promotion-order-footer"><Button variant="outline" onClick={() => setHomeOpen(false)}>ยกเลิก</Button><Button disabled={homeBusy || homeCandidates.isPending || homeCandidates.isError} onClick={() => void saveHomeOrder()}>บันทึกลำดับ</Button></DialogFooter>
    </DialogContent></Dialog>
    <Sheet open={selectedId > 0} onOpenChange={(open) => { if (!open) { const next = new URLSearchParams(params); next.delete("promo"); next.delete("redemptionPage"); setParams(next); } }}>
      <SheetContent className="gap-4 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"><SheetHeader className="pr-14"><SheetTitle>{selectedPromotion.data?.code || "การใช้โค้ด"}</SheetTitle></SheetHeader>
        {selectedPromotion.data && <div className="grid gap-4 border-b px-6 pb-5"><PromotionStatusPill status={selectedPromotion.data.status} /><p className="text-sm text-muted-foreground">{discount(selectedPromotion.data)} · ขั้นต่ำ {money(selectedPromotion.data.minSpend)} · {formatThaiPeriod(selectedPromotion.data.startsAt, selectedPromotion.data.endsAt)}</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="min-w-0 rounded-lg bg-muted p-4"><span className="text-xs text-muted-foreground">ใช้ไปแล้ว</span><strong className="mt-1 block text-lg">{selectedPromotion.data.usedCount} / {selectedPromotion.data.usageLimitTotal ?? "ไม่จำกัด"}</strong><span className="text-xs text-muted-foreground">เก็บแล้ว {selectedPromotion.data.claimedCount} / {selectedPromotion.data.claimLimit ?? "ไม่จำกัด"}</span></div><div className="min-w-0 rounded-lg bg-muted p-4"><span className="text-xs text-muted-foreground">ส่วนลดที่ Pegasus ออก</span><strong className="mt-1 block text-lg">—</strong><span className="text-xs text-muted-foreground">ยังไม่มีข้อมูล</span></div><div className="min-w-0 rounded-lg bg-muted p-4"><span className="text-xs text-muted-foreground">ยอดขายจากโค้ดนี้</span><strong className="mt-1 block text-lg">—</strong><span className="text-xs text-muted-foreground">ยังไม่มีข้อมูล</span></div></div></div>}
        {redemption.isPending && <p className="py-6 text-sm">กำลังโหลด...</p>}
        {redemption.isError && <p role="alert" className="py-6 text-sm text-destructive">โหลดการใช้โค้ดไม่สำเร็จ <button onClick={() => void redemption.refetch()}>ลองอีกครั้ง</button></p>}
        {redemption.data?.items.length === 0 && <p className="py-6 text-sm text-muted-foreground">ยังไม่มีการใช้โค้ด</p>}
        <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-muted-foreground"><th className="py-2 font-medium">คำสั่งซื้อ</th><th className="py-2 font-medium">ผู้ซื้อ</th><th className="py-2 font-medium">ส่วนลด</th><th className="py-2 font-medium">สถานะ</th></tr></thead><tbody>{redemption.data?.items.map((entry) => <tr key={entry.id} className="border-b"><td className="py-3 font-medium"><Link className="text-primary underline-offset-2 hover:underline" to={`/admin/orders?q=${encodeURIComponent(entry.orderNumber)}`}>{entry.orderNumber}</Link></td><td className="py-3">{maskedBuyer(entry.buyer.name)}</td><td className="py-3">{money(entry.amount)}</td><td className="py-3">{entry.status === "CONSUMED" ? "ใช้แล้ว" : entry.status === "RELEASED" ? "คืนสิทธิ์" : entry.status === "RESERVED" ? "จองสิทธิ์" : entry.status}</td></tr>)}</tbody></table></div>
        {(redemption.data?.totalPages || 0) > 1 && <div className="mt-5 flex items-center justify-between text-xs"><span>หน้า {redemptionPage + 1} จาก {redemption.data?.totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={redemptionPage === 0} onClick={() => setParam("redemptionPage", String(redemptionPage - 1))}>ก่อนหน้า</Button><Button size="sm" variant="outline" disabled={redemptionPage + 1 >= (redemption.data?.totalPages || 0)} onClick={() => setParam("redemptionPage", String(redemptionPage + 1))}>ถัดไป</Button></div></div>}
      </SheetContent>
    </Sheet>
  </main>;
}
