import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpDown, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { adminPromotionApi } from "./api";
import type { AdminPromotion, PromotionStatus } from "./types";

const statuses: Array<[PromotionStatus | "ALL", string]> = [["ALL", "ทั้งหมด"], ["ACTIVE", "ใช้งานอยู่"], ["SCHEDULED", "ตั้งเวลาไว้"], ["PAUSED", "หยุดชั่วคราว"], ["EXPIRED", "หมดอายุ"], ["USED_UP", "สิทธิ์เต็มแล้ว"]];
const money = (amount: number) => `฿${amount.toLocaleString("th-TH")}`;
const discount = (code: AdminPromotion) => code.discountType === "FREE_SHIPPING" ? "ส่งฟรี" : code.discountType === "PERCENT" ? `ลด ${code.discountValue}%` : `ลด ${money(code.discountValue)}`;

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
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const list = useQuery({ queryKey: ["admin-promotions", owner, status, q, page], queryFn: () => adminPromotionApi.list({ owner: owner || undefined, status: status || undefined, q: q || undefined, page, size: 20 }) });
  const summary = useQuery({ queryKey: ["admin-promotions", "summary"], queryFn: adminPromotionApi.summary });
  const homeCandidates = useQuery({ queryKey: ["admin-promotions", "home-candidates"], queryFn: () => adminPromotionApi.list({ owner: "PLATFORM", page: 0, size: 100 }) });
  const selectedId = Number(params.get("promo"));
  const redemption = useQuery({ queryKey: ["admin-promotions", "redemptions", selectedId], queryFn: () => adminPromotionApi.redemptions(selectedId, 0), enabled: selectedId > 0 });
  const setParam = (key: string, value: string | null) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== "promo" && key !== "page") next.delete("page"); setParams(next); };
  const refresh = async () => { await client.invalidateQueries({ queryKey: ["admin-promotions"] }); };
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
  return <main className="grid gap-6 p-6 lg:p-8">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold">โปรโมชั่น & โค้ดส่วนลด</h1><p className="text-sm text-muted-foreground">สร้างโค้ดที่ Pegasus ออกเงิน และดูแลโค้ดที่ร้านค้าสร้างเอง</p></div><div className="flex gap-2"><Button variant="outline" disabled={homeCandidates.isPending} onClick={() => { setHomeIds((homeCandidates.data?.page.items || []).filter((code) => code.featuredOnHome).sort((a, b) => (a.homeSort || 0) - (b.homeSort || 0)).map((code) => code.id)); setHomeOpen(true); }}><ArrowUpDown />จัดลำดับหน้าแรก</Button><Button render={<Link to="/admin/promotions/new" />} nativeButton={false}><Plus />สร้างโค้ด Pegasus</Button></div></header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["โค้ดที่ใช้งานอยู่", (summary.data?.activePlatformCodes || 0) + (summary.data?.activeSellerCodes || 0)], ["ใช้โค้ด (30 วัน)", summary.data?.redemptions30d || 0], ["ต้นทุนส่วนลดที่ Pegasus ออก", money(summary.data?.platformDiscountCost30d || 0)], ["ยอดขายจากออเดอร์ที่ใช้โค้ด", money(summary.data?.salesWithCodes30d || 0)]].map(([label, value]) => <Card key={label} className="gap-1 rounded-xl bg-white p-5 shadow-none"><span className="text-xs text-muted-foreground">{label}</span><strong className="text-2xl">{value}</strong></Card>)}</div>
    <Card className="gap-0 overflow-hidden rounded-xl bg-white p-0 shadow-none"><div className="flex flex-wrap items-center gap-2 border-b p-4"><div className="flex flex-wrap gap-1">{statuses.map(([value, label]) => <button key={value} type="button" onClick={() => setParam("status", value === "ALL" ? null : value)} className={`rounded-md px-2 py-1.5 text-xs ${status === (value === "ALL" ? null : value) ? "bg-slate-100 font-semibold" : "text-muted-foreground"}`}>{label} {value === "ALL" ? Object.values(list.data?.statusCounts || {}).reduce((a, b) => a + b, 0) : list.data?.statusCounts[value] || 0}</button>)}</div><select aria-label="เจ้าของโค้ด" className="rounded-md border px-2 py-1 text-xs" value={owner || ""} onChange={(event) => setParam("owner", event.target.value || null)}><option value="">ทุกเจ้าของ</option><option value="PLATFORM">Pegasus</option><option value="SELLER">ร้านค้า</option></select><form onSubmit={(event) => { event.preventDefault(); setParam("q", search.trim() || null); }} className="ml-auto"><Input aria-label="ค้นหาโค้ด" className="h-8 w-48" placeholder="ค้นหาโค้ด / แคมเปญ / ร้าน" value={search} onChange={(event) => setSearch(event.target.value)} /></form></div>
      {list.isPending && <p className="p-6">กำลังโหลดโค้ด...</p>}{list.isError && <p role="alert" className="p-6 text-destructive">โหลดโค้ดไม่สำเร็จ <button onClick={() => void list.refetch()}>ลองอีกครั้ง</button></p>}
      {list.data && rows.length === 0 && <p className="p-8 text-center text-muted-foreground">ไม่พบโค้ดส่วนลด</p>}
      {rows.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-slate-50 text-muted-foreground"><tr>{["โค้ด / แคมเปญ", "ส่วนลด", "เงื่อนไข", "ใช้ไปแล้ว", "ระยะเวลา", "สถานะ", ""].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr></thead><tbody>{rows.map((code) => <tr key={code.id} className="border-t"><td className="px-4 py-3"><strong>{code.code}</strong> <span className="rounded bg-blue-50 px-1 text-blue-700">{code.ownerType === "PLATFORM" ? "Pegasus" : code.owner?.name || "ร้านค้า"}</span><span className="block text-muted-foreground">{code.name}{code.featuredOnHome ? " · 🏠" : ""}</span></td><td className="px-4 py-3">{discount(code)}</td><td className="px-4 py-3">ขั้นต่ำ {money(code.minSpend)}</td><td className="px-4 py-3">{code.usedCount} / {code.usageLimitTotal ?? "ไม่จำกัด"}<span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-[#0069a8]" style={{ width: `${code.usageLimitTotal ? Math.min(100, 100 * code.usedCount / code.usageLimitTotal) : 0}%` }} /></span>{code.claimable && <span className="block text-muted-foreground">เก็บแล้ว {code.claimedCount} / {code.claimLimit ?? "ไม่จำกัด"}</span>}</td><td className="px-4 py-3">{new Date(code.startsAt).toLocaleDateString("th-TH")} – {new Date(code.endsAt).toLocaleDateString("th-TH")}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1">{statuses.find(([id]) => id === code.status)?.[1]}</span></td><td className="px-4 py-3"><details className="relative"><summary aria-label={`จัดการ ${code.code}`} className="cursor-pointer list-none"><MoreVertical className="size-4" /></summary><div className="absolute right-0 z-10 grid min-w-32 gap-1 rounded-lg border bg-white p-2 shadow-lg">{code.ownerType === "PLATFORM" && <Link to={`/admin/promotions/${code.id}/edit`}>แก้ไข</Link>}<button className="text-left" onClick={() => setParam("promo", String(code.id))}>ดูการใช้โค้ด</button><button className="text-left" onClick={() => { setReason(""); setAction({ kind: code.status === "PAUSED" ? "resume" : "pause", code }); }}>{code.status === "PAUSED" ? "เปิดใช้อีกครั้ง" : "หยุดชั่วคราว"}</button>{code.ownerType === "PLATFORM" && <button className="text-left text-destructive" onClick={() => { setDeleteBlocked(false); setConfirmCode(""); setAction({ kind: "delete", code }); }}>ลบ</button>}</div></details></td></tr>)}</tbody></table></div>}
      <div className="flex items-center justify-between border-t p-4 text-xs"><span>หน้า {page + 1} จาก {Math.max(1, list.data?.page.totalPages || 1)}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setParam("page", String(page - 1))}>ก่อนหน้า</Button><Button size="sm" variant="outline" disabled={page + 1 >= (list.data?.page.totalPages || 1)} onClick={() => setParam("page", String(page + 1))}>ถัดไป</Button></div></div>
    </Card>
    <Dialog open={!!action} onOpenChange={(open) => { if (!open) setAction(null); }}><DialogContent><DialogHeader><DialogTitle>{action?.kind === "delete" ? deleteBlocked ? "ลบโค้ดไม่ได้" : "ลบโค้ดส่วนลด?" : action?.kind === "resume" ? "เปิดใช้โค้ดอีกครั้ง?" : "หยุดโค้ดชั่วคราว?"}</DialogTitle></DialogHeader><p className="text-sm">{action?.code.code}</p>{deleteBlocked && <p className="text-sm text-amber-700">มีผู้เก็บหรือใช้โค้ดแล้ว สามารถหยุดชั่วคราวแทนได้</p>}{action?.kind === "pause" && action.code.ownerType === "SELLER" && <Input placeholder="เหตุผลที่แจ้งร้าน (จำเป็น)" value={reason} onChange={(event) => setReason(event.target.value)} />}{action?.kind === "delete" && <Input placeholder="พิมพ์รหัสเพื่อยืนยัน" value={confirmCode} onChange={(event) => setConfirmCode(event.target.value)} />}<DialogFooter><Button variant="outline" onClick={() => setAction(null)}>ยกเลิก</Button><Button disabled={busy || deleteBlocked || (action?.kind === "delete" && confirmCode !== action.code.code) || (action?.kind === "pause" && action.code.ownerType === "SELLER" && !reason.trim())} onClick={() => void act()}>ยืนยัน</Button>{deleteBlocked && action && <Button onClick={() => { setAction({ kind: "pause", code: action.code }); setDeleteBlocked(false); }}>หยุดชั่วคราวแทน</Button>}</DialogFooter></DialogContent></Dialog>
    <Dialog open={homeOpen} onOpenChange={setHomeOpen}><DialogContent><DialogHeader><DialogTitle>จัดลำดับโค้ดหน้าแรก</DialogTitle></DialogHeader><p className="text-xs text-muted-foreground">เลือกได้สูงสุด 8 โค้ด ลากเพื่อจัดลำดับ</p><div className="grid max-h-72 gap-2 overflow-y-auto">{homeCandidates.data?.page.items.filter((code) => code.claimable && code.visibility === "PUBLIC").map((code) => <label key={code.id} draggable={homeIds.includes(code.id)} onDragStart={(event) => event.dataTransfer.setData("text/plain", String(code.id))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = Number(event.dataTransfer.getData("text/plain")); setHomeIds((ids) => { const next = ids.filter((value) => value !== id); if (id !== code.id) next.splice(Math.max(0, next.indexOf(code.id)), 0, id); else return ids; return next; }); }} className="flex gap-2 rounded border p-2"><input type="checkbox" checked={homeIds.includes(code.id)} onChange={(event) => setHomeIds((ids) => event.target.checked ? [...ids, code.id].slice(0, 8) : ids.filter((id) => id !== code.id))} />{code.code}</label>)}</div><DialogFooter><Button variant="outline" onClick={() => setHomeOpen(false)}>ยกเลิก</Button><Button onClick={() => void adminPromotionApi.homeOrder(homeIds).then(() => { setHomeOpen(false); void refresh(); })}>บันทึก</Button></DialogFooter></DialogContent></Dialog>
    <Sheet open={selectedId > 0} onOpenChange={(open) => { if (!open) setParam("promo", null); }}><SheetContent className="overflow-y-auto"><SheetHeader><SheetTitle>การใช้โค้ด</SheetTitle></SheetHeader>{redemption.isPending && <p>กำลังโหลด...</p>}{redemption.data?.items.length === 0 && <p>ยังไม่มีการใช้โค้ด</p>}{redemption.data?.items.map((entry) => <div key={entry.id} className="flex justify-between border-b py-2 text-xs"><span className="font-medium text-primary">{entry.orderNumber}</span><span>{money(entry.amount)}</span><span>{entry.status}</span></div>)}</SheetContent></Sheet>
  </main>;
}
