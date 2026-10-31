import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpDown, Plus } from "lucide-react";
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

const statuses: Array<[PromotionStatus | "ALL", string]> = [["ALL", "ทั้งหมด"], ["ACTIVE", "ใช้งานอยู่"], ["SCHEDULED", "ตั้งเวลาไว้"], ["PAUSED", "หยุดชั่วคราว"], ["EXPIRED", "หมดอายุ"], ["USED_UP", "สิทธิ์เต็มแล้ว"]];
const money = (amount: number) => `฿${amount.toLocaleString("th-TH")}`;
const discount = (code: AdminPromotion) => code.discountType === "FREE_SHIPPING" ? "ส่งฟรี" : code.discountType === "PERCENT" ? `ลด ${code.discountValue}%` : `ลด ${money(code.discountValue)}`;
const candidate = (code: AdminPromotion) => code.ownerType === "PLATFORM" && code.claimable && code.visibility === "PUBLIC" && code.status !== "EXPIRED";
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
  const [confirmCode, setConfirmCode] = useState("");
  const [homeOpen, setHomeOpen] = useState(false);
  const [homeIds, setHomeIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const [homeBusy, setHomeBusy] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const redemptionPage = Math.max(0, Number(params.get("redemptionPage")) || 0);
  const list = useQuery({ queryKey: ["admin-promotions", owner, status, q, page], queryFn: () => adminPromotionApi.list({ owner: owner || undefined, status: status || undefined, q: q || undefined, page, size: 20 }) });
  const summary = useQuery({ queryKey: ["admin-promotions", "summary"], queryFn: adminPromotionApi.summary });
  const homeCandidates = useQuery({ queryKey: ["admin-promotions", "home-candidates"], queryFn: loadHomeCandidates });
  const selectedId = Number(params.get("promo"));
  const selectedPromotion = useQuery({ queryKey: ["admin-promotions", selectedId], queryFn: () => adminPromotionApi.get(selectedId), enabled: selectedId > 0 });
  const redemption = useQuery({ queryKey: ["admin-promotions", "redemptions", selectedId, redemptionPage], queryFn: () => adminPromotionApi.redemptions(selectedId, redemptionPage), enabled: selectedId > 0 });
  const setParam = (key: string, value: string | null) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== "promo" && key !== "page") next.delete("page"); setParams(next); };
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
        claimLimit: code.claimLimit, featuredOnHome: false,
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
      if (action.kind === "pause") await adminPromotionApi.pause(action.code.id, reason);
      if (action.kind === "resume") await adminPromotionApi.resume(action.code.id);
      if (action.kind === "delete") await adminPromotionApi.remove(action.code.id);
      toast.add({ title: "อัปเดตโค้ดแล้ว", type: "success" }); setAction(null); await refresh();
    } catch (error) { if (error instanceof ApiError && error.code === "PROMO_IN_USE") setDeleteBlocked(true); else toast.add({ title: "ทำรายการไม่สำเร็จ", description: error instanceof Error ? error.message : "กรุณาลองอีกครั้ง", type: "error" }); }
    finally { setBusy(false); }
  };
  const rows = list.data?.page.items || [];
  const homeRows = [...(homeCandidates.data || [])].sort((a, b) => {
    const ai = homeIds.indexOf(a.id);
    const bi = homeIds.indexOf(b.id);
    return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
  });
  return <main className="promotion-admin grid gap-6 p-6 lg:p-8">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-black">โปรโมชั่น & โค้ดส่วนลด</h1><p className="text-sm text-muted-foreground">สร้างโค้ดที่ Pegasus ออกเงิน และดูแลโค้ดที่ร้านค้าสร้างเอง</p></div><div className="flex gap-2"><Button variant="outline" disabled={homeCandidates.isPending} onClick={() => { setHomeIds((homeCandidates.data || []).filter((code) => code.featuredOnHome).sort((a, b) => (a.homeSort || 0) - (b.homeSort || 0)).map((code) => code.id)); setHomeOpen(true); }}><ArrowUpDown />จัดลำดับหน้าแรก</Button><Button render={<Link to="/admin/promotions/new" />} nativeButton={false}><Plus />สร้างโค้ด Pegasus</Button></div></header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["โค้ดที่ใช้งานอยู่", (summary.data?.activePlatformCodes || 0) + (summary.data?.activeSellerCodes || 0)], ["ใช้โค้ด (30 วัน)", summary.data?.redemptions30d || 0], ["ต้นทุนส่วนลดที่ Pegasus ออก", money(summary.data?.platformDiscountCost30d || 0)], ["ยอดขายจากออเดอร์ที่ใช้โค้ด", money(summary.data?.salesWithCodes30d || 0)]].map(([label, value]) => <Card key={label} className="gap-1 rounded-xl bg-white p-5 shadow-none"><span className="text-xs text-muted-foreground">{label}</span><strong className="text-2xl">{value}</strong></Card>)}</div>
    <Card className="gap-0 overflow-hidden rounded-xl bg-white p-0 shadow-none"><div className="flex flex-wrap items-center gap-2 border-b p-4"><div className="flex flex-wrap gap-1">{statuses.map(([value, label]) => <button key={value} type="button" onClick={() => setParam("status", value === "ALL" ? null : value)} className={`rounded-md px-2 py-1.5 text-xs ${status === (value === "ALL" ? null : value) ? "bg-slate-100 font-semibold" : "text-muted-foreground"}`}>{label} {value === "ALL" ? Object.values(list.data?.statusCounts || {}).reduce((a, b) => a + b, 0) : list.data?.statusCounts[value] || 0}</button>)}</div><select aria-label="เจ้าของโค้ด" className="rounded-md border px-2 py-1 text-xs" value={owner || ""} onChange={(event) => setParam("owner", event.target.value || null)}><option value="">ทุกเจ้าของ</option><option value="PLATFORM">Pegasus</option><option value="SELLER">ร้านค้า</option></select><form onSubmit={(event) => { event.preventDefault(); setParam("q", search.trim() || null); }} className="ml-auto"><Input aria-label="ค้นหาโค้ด" className="h-8 w-48" placeholder="ค้นหาโค้ด / แคมเปญ / ร้าน" value={search} onChange={(event) => setSearch(event.target.value)} /></form></div>
      {list.isPending && <p className="p-6">กำลังโหลดโค้ด...</p>}{list.isError && <p role="alert" className="p-6 text-destructive">โหลดโค้ดไม่สำเร็จ <button onClick={() => void list.refetch()}>ลองอีกครั้ง</button></p>}
      {list.data && rows.length === 0 && <div className="m-5 grid justify-items-center gap-2 rounded-xl border border-dashed p-10 text-center"><div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-primary"><Plus /></div><strong className="text-sm">ยังไม่มีโค้ดในแท็บนี้</strong><p className="text-xs text-muted-foreground">สร้างโค้ด Pegasus เพื่อกระตุ้นยอดขายช่วงแคมเปญ</p><Button size="sm" render={<Link to="/admin/promotions/new" />} nativeButton={false}><Plus />สร้างโค้ด Pegasus</Button></div>}
      {rows.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-slate-50 text-muted-foreground"><tr>{["โค้ด / แคมเปญ", "ส่วนลด", "เงื่อนไข", "ใช้ไปแล้ว", "ระยะเวลา", "สถานะ", ""].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr></thead><tbody>{rows.map((code) => <AdminPromotionRow key={code.id} promotion={code} onView={openRedemptions} onAction={(kind, selected) => { setReason(""); setConfirmCode(""); setDeleteBlocked(false); setAction({ kind, code: selected }); }} />)}</tbody></table></div>}
      <div className="flex items-center justify-between border-t p-4 text-xs"><span>หน้า {page + 1} จาก {Math.max(1, list.data?.page.totalPages || 1)}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setParam("page", String(page - 1))}>ก่อนหน้า</Button><Button size="sm" variant="outline" disabled={page + 1 >= (list.data?.page.totalPages || 1)} onClick={() => setParam("page", String(page + 1))}>ถัดไป</Button></div></div>
    </Card>
    <Dialog open={!!action} onOpenChange={(open) => { if (!open) setAction(null); }}>
      <DialogContent className="max-w-[420px] overflow-hidden p-0">
        <div className="grid gap-3 p-6 pb-5">
          <div className={`flex size-10 items-center justify-center rounded-xl text-xl ${action?.kind === "delete" ? "bg-red-50 text-red-700" : "bg-blue-50 text-primary"}`} aria-hidden>{action?.kind === "delete" ? "×" : action?.kind === "pause" ? "Ⅱ" : "✓"}</div>
          <DialogHeader><DialogTitle>{action?.kind === "delete" ? deleteBlocked ? "ลบโค้ดนี้ไม่ได้" : `ลบโค้ด ${action.code.code}?` : action?.kind === "resume" ? `เปิดใช้ ${action.code.code} อีกครั้ง?` : `หยุดโค้ด ${action?.code.code} ชั่วคราว?`}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">{action?.kind === "pause" && action.code.ownerType === "SELLER" ? "ร้านค้าจะได้รับแจ้งเหตุผลในการหยุดโค้ด" : action?.kind === "delete" ? "การลบโค้ดไม่สามารถย้อนกลับได้" : "การเปลี่ยนแปลงจะมีผลทันที"}</p>
          {deleteBlocked && <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">มีผู้เก็บหรือใช้โค้ดแล้ว จึงลบไม่ได้{action?.code.usedCount ? " โค้ดที่เคยถูกใช้ไม่สามารถลดวันสิ้นสุดผ่าน API ปัจจุบัน" : " สามารถหยุดชั่วคราวหรือสิ้นสุดวันนี้ได้"}</div>}
          {action?.kind === "pause" && action.code.ownerType === "SELLER" && <label className="grid gap-1 text-xs">เหตุผลที่แจ้งร้าน *<Input placeholder="ระบุเหตุผล" value={reason} onChange={(event) => setReason(event.target.value)} /></label>}
          {action?.kind === "delete" && !deleteBlocked && <label className="grid gap-1 text-xs">พิมพ์ {action.code.code} เพื่อยืนยัน<Input placeholder={action.code.code} value={confirmCode} onChange={(event) => setConfirmCode(event.target.value)} /></label>}
        </div>
        <DialogFooter className="border-t bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={() => setAction(null)}>ยกเลิก</Button>
          {!deleteBlocked && <Button disabled={busy || (action?.kind === "delete" && confirmCode !== action.code.code) || (action?.kind === "pause" && action.code.ownerType === "SELLER" && !reason.trim())} onClick={() => void act()}>{action?.kind === "delete" ? "ลบโค้ด" : action?.kind === "pause" ? "หยุดชั่วคราว" : "เปิดใช้อีกครั้ง"}</Button>}
          {deleteBlocked && action && <Button disabled={busy} onClick={() => { setAction({ kind: "pause", code: action.code }); setDeleteBlocked(false); }}>หยุดชั่วคราว</Button>}
          {deleteBlocked && action?.code.ownerType === "PLATFORM" && <Button disabled={busy || action.code.usedCount > 0 || new Date(action.code.startsAt).getTime() >= openedAt} title={action.code.usedCount > 0 ? "API ไม่อนุญาตให้ลดวันสิ้นสุดหลังมีการใช้โค้ด" : undefined} onClick={() => void endToday()}>สิ้นสุดวันนี้</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={homeOpen} onOpenChange={setHomeOpen}><DialogContent><DialogHeader><DialogTitle>จัดลำดับโค้ดหน้าแรก</DialogTitle></DialogHeader><p className="text-xs text-muted-foreground">เลือกได้สูงสุด 8 โค้ด ลากเพื่อจัดลำดับ · เลือกแล้ว {homeIds.length}/8</p>{homeCandidates.isError && <p role="alert" className="text-sm text-destructive">โหลดโค้ดไม่สำเร็จ <button onClick={() => void homeCandidates.refetch()}>ลองอีกครั้ง</button></p>}<div className="grid max-h-72 gap-2 overflow-y-auto">{homeRows.map((code) => <label key={code.id} draggable={homeIds.includes(code.id)} onDragStart={(event) => event.dataTransfer.setData("text/plain", String(code.id))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = Number(event.dataTransfer.getData("text/plain")); setHomeIds((ids) => { const next = ids.filter((value) => value !== id); if (!ids.includes(id) || !ids.includes(code.id) || id === code.id) return ids; next.splice(next.indexOf(code.id), 0, id); return next; }); }} className="flex items-center gap-2 rounded border p-2"><span aria-hidden className="text-muted-foreground">⋮⋮</span><input type="checkbox" checked={homeIds.includes(code.id)} onChange={(event) => setHomeIds((ids) => event.target.checked ? ids.length < 8 ? [...ids, code.id] : ids : ids.filter((id) => id !== code.id))} />{code.code}</label>)}</div><DialogFooter><Button variant="outline" onClick={() => setHomeOpen(false)}>ยกเลิก</Button><Button disabled={homeBusy || homeCandidates.isPending || homeCandidates.isError} onClick={() => void saveHomeOrder()}>บันทึก</Button></DialogFooter></DialogContent></Dialog>
    <Sheet open={selectedId > 0} onOpenChange={(open) => { if (!open) { const next = new URLSearchParams(params); next.delete("promo"); next.delete("redemptionPage"); setParams(next); } }}>
      <SheetContent className="overflow-y-auto sm:max-w-[620px]"><SheetHeader><SheetTitle>{selectedPromotion.data?.code || "การใช้โค้ด"}</SheetTitle></SheetHeader>
        {selectedPromotion.data && <div className="grid gap-3 border-b pb-4"><PromotionStatusPill status={selectedPromotion.data.status} /><p className="text-xs text-muted-foreground">{discount(selectedPromotion.data)} · ขั้นต่ำ {money(selectedPromotion.data.minSpend)} · {new Date(selectedPromotion.data.startsAt).toLocaleDateString("th-TH")} – {new Date(selectedPromotion.data.endsAt).toLocaleDateString("th-TH")}</p><div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-muted p-3"><span className="text-[11px] text-muted-foreground">ใช้ไปแล้ว</span><strong className="block text-base">{selectedPromotion.data.usedCount} / {selectedPromotion.data.usageLimitTotal ?? "ไม่จำกัด"}</strong></div><div className="rounded-lg bg-muted p-3"><span className="text-[11px] text-muted-foreground">เก็บแล้ว</span><strong className="block text-base">{selectedPromotion.data.claimedCount} / {selectedPromotion.data.claimLimit ?? "ไม่จำกัด"}</strong></div></div></div>}
        {redemption.isPending && <p className="py-6 text-sm">กำลังโหลด...</p>}
        {redemption.isError && <p role="alert" className="py-6 text-sm text-destructive">โหลดการใช้โค้ดไม่สำเร็จ <button onClick={() => void redemption.refetch()}>ลองอีกครั้ง</button></p>}
        {redemption.data?.items.length === 0 && <p className="py-6 text-sm text-muted-foreground">ยังไม่มีการใช้โค้ด</p>}
        <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-muted-foreground"><th className="py-2 font-medium">คำสั่งซื้อ</th><th className="py-2 font-medium">ผู้ซื้อ</th><th className="py-2 font-medium">ส่วนลด</th><th className="py-2 font-medium">สถานะ</th></tr></thead><tbody>{redemption.data?.items.map((entry) => <tr key={entry.id} className="border-b"><td className="py-3 font-medium text-primary">{entry.orderNumber}</td><td className="py-3">{maskedBuyer(entry.buyer.name)}</td><td className="py-3">{money(entry.amount)}</td><td className="py-3">{entry.status === "CONSUMED" ? "ใช้แล้ว" : entry.status === "RELEASED" ? "คืนสิทธิ์" : entry.status === "RESERVED" ? "จองสิทธิ์" : entry.status}</td></tr>)}</tbody></table></div>
        {(redemption.data?.totalPages || 0) > 1 && <div className="mt-5 flex items-center justify-between text-xs"><span>หน้า {redemptionPage + 1} จาก {redemption.data?.totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={redemptionPage === 0} onClick={() => setParam("redemptionPage", String(redemptionPage - 1))}>ก่อนหน้า</Button><Button size="sm" variant="outline" disabled={redemptionPage + 1 >= (redemption.data?.totalPages || 0)} onClick={() => setParam("redemptionPage", String(redemptionPage + 1))}>ถัดไป</Button></div></div>}
      </SheetContent>
    </Sheet>
  </main>;
}
