import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BarChart3, Info, Pause, Play, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { useSellerProfile } from "@/features/seller/shared/seller.queries";
import { sellerPromotionApi } from "./api";
import { CouponTicket, PromotionStatusPill } from "./components";
import { maskBuyer, money, thaiDate } from "./format";
import { SellerPromotionForm } from "./SellerPromotionForm";
import type { SellerPromotion, Status } from "./types";
import "./promotions.css";

const statuses: Array<[Status | "ALL", string]> = [["ALL", "ทั้งหมด"], ["ACTIVE", "ใช้งานอยู่"], ["SCHEDULED", "ตั้งเวลาไว้"], ["PAUSED", "หยุดชั่วคราว"], ["EXPIRED", "หมดอายุ"], ["USED_UP", "สิทธิ์เต็ม"]];
type Action = { kind: "pause" | "resume" | "delete" | "admin"; code: SellerPromotion };

export function SellerPromotionsPage() {
  const client = useQueryClient();
  const profile = useSellerProfile();
  const verified = profile.data?.status === "VERIFIED";
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<SellerPromotion | "new" | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState<SellerPromotion | null>(null);
  const [redemptionPage, setRedemptionPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const list = useQuery({ queryKey: ["seller-promotions", "list", status, page], queryFn: () => sellerPromotionApi.list(status === "ALL" ? undefined : status, page) });
  const summary = useQuery({ queryKey: ["seller-promotions", "summary"], queryFn: sellerPromotionApi.summary });
  const redemptions = useQuery({ queryKey: ["seller-promotions", "redemptions", redemptionCode?.id, redemptionPage], queryFn: () => sellerPromotionApi.redemptions(redemptionCode!.id, redemptionPage), enabled: redemptionCode != null });
  const refresh = async () => client.invalidateQueries({ queryKey: ["seller-promotions"] });

  const performAction = async () => {
    if (!action || action.kind === "admin") return;
    setBusy(true);
    try {
      if (action.kind === "pause") await sellerPromotionApi.pause(action.code.id);
      if (action.kind === "resume") await sellerPromotionApi.resume(action.code.id);
      if (action.kind === "delete") await sellerPromotionApi.remove(action.code.id);
      const verb = action.kind === "pause" ? "หยุดโค้ด" : action.kind === "resume" ? "เปิดใช้โค้ด" : "ลบโค้ด";
      setAction(null);
      await refresh();
      toast.add({ title: `${verb} ${action.code.code} แล้ว`, type: "success" });
    } catch (error) {
      if (error instanceof ApiError && error.code === "PROMO_IN_USE") setDeleteBlocked(true);
      else toast.add({ title: "ทำรายการไม่สำเร็จ", description: error instanceof Error ? error.message : "กรุณาลองอีกครั้ง", type: "error" });
    } finally { setBusy(false); }
  };

  return <main className="seller-promotions-page">
    <header className="seller-promo-header"><div><h1>โค้ดส่วนลดร้าน</h1><p>สร้างโค้ดลดราคาสินค้าในร้านคุณ ร้านเป็นผู้ออกส่วนลดเอง</p></div><Button disabled={!verified} onClick={() => setEditing("new")}><Plus className="size-4" />สร้างโค้ดร้าน</Button></header>
    <div className="seller-promo-kpis">
      {[["โค้ดที่ใช้งานอยู่", summary.data?.activeCodes ?? 0, `จากทั้งหมด ${Object.values(list.data?.statusCounts || {}).reduce((a, b) => a + b, 0)} โค้ด`], ["ลูกค้าใช้โค้ด (30 วัน)", summary.data?.redemptions30d ?? 0, "ออเดอร์"], ["ส่วนลดที่ร้านออก (30 วัน)", money(summary.data?.shopDiscount30d ?? 0), "หักจากรายได้ร้าน"], ["ยอดขายจากออเดอร์ที่ใช้โค้ด", money(summary.data?.salesWithCodes30d ?? 0), "30 วันล่าสุด"]].map(([label, value, caption]) => <Card key={label} className="seller-promo-kpi"><span>{label}</span><strong>{value}</strong><small>{caption}</small></Card>)}
    </div>
    <div className="seller-promo-info"><Info className="size-4 shrink-0" /><span>ลูกค้าใช้โค้ดร้านได้ร้านละ 1 โค้ด และใช้ร่วมกับโค้ด Pegasus ได้ · ส่วนลดจากโค้ด Pegasus ไม่หักจากรายได้ร้าน — Pegasus จ่ายส่วนต่างให้ตอนปล่อยเงิน · คอมมิชชั่นคิดจากยอดหลังหักโค้ดร้าน</span></div>
    {!verified && !profile.isPending && <div className="seller-promo-verify" role="alert"><strong>ยังสร้างโค้ดไม่ได้</strong><p>ร้านต้องยืนยันตัวตนผู้ขายให้เสร็จก่อนจึงจะสร้างโค้ดส่วนลดได้</p><Button size="sm" render={<Link to="/seller/verification" />} nativeButton={false}>ไปยืนยันตัวตน</Button></div>}
    <div className="seller-promo-tabs" role="tablist" aria-label="สถานะโค้ด">{statuses.map(([value, label]) => <button type="button" role="tab" aria-selected={status === value} key={value} className={status === value ? "is-active" : ""} onClick={() => { setStatus(value); setPage(0); }}>{label} <span>{value === "ALL" ? Object.values(list.data?.statusCounts || {}).reduce((a, b) => a + b, 0) : list.data?.statusCounts[value] || 0}</span></button>)}</div>
    {list.isPending && <p className="seller-promo-feedback">กำลังโหลดโค้ด...</p>}
    {list.isError && <p role="alert" className="seller-promo-feedback">โหลดโค้ดไม่สำเร็จ <button onClick={() => void list.refetch()}>ลองอีกครั้ง</button></p>}
    {list.data?.page.items.length === 0 && <div className="seller-promo-feedback">ยังไม่มีโค้ดในหมวดนี้</div>}
    <div className="seller-promo-grid">{list.data?.page.items.map((code) => <Card key={code.id} className="seller-promo-card">
      <CouponTicket promotion={code} />
      <div className="seller-promo-card-meta"><PromotionStatusPill status={code.status} /><span>ใช้แล้ว {code.usedCount} / {code.usageLimitTotal ?? "ไม่จำกัด"}</span>{code.claimable && <span>เก็บแล้ว {code.claimedCount} / {code.claimLimit ?? "ไม่จำกัด"}</span>}<span>ส่วนลดรวม {money(code.discountTotal)}</span><div className="seller-promo-card-actions"><button disabled={!verified} onClick={() => setEditing(code)}>แก้ไข</button>{code.pausedBy !== "ADMIN" && (code.status === "ACTIVE" || code.status === "SCHEDULED" || code.status === "PAUSED") && <button disabled={!verified} className="seller-promo-pause-action" onClick={() => { setDeleteBlocked(false); setAction({ kind: code.status === "PAUSED" ? "resume" : "pause", code }); }}>{code.status === "PAUSED" ? "เปิดใช้อีกครั้ง" : "หยุดชั่วคราว"}</button>}{<button className="seller-promo-danger" onClick={() => { setDeleteBlocked(code.usedCount > 0 || code.claimedCount > 0); setAction({ kind: "delete", code }); }}>ลบ</button>}{code.pausedBy === "ADMIN" && <button onClick={() => setAction({ kind: "admin", code })}>ดูข้อกำหนด</button>}<button onClick={() => { setRedemptionPage(0); setRedemptionCode(code); }}>ดูการใช้โค้ด</button></div></div>
      {code.pausedBy === "ADMIN" && <div className="seller-promo-admin-note">ทีมงานหยุดโค้ดนี้: {code.pauseReason || "โปรดติดต่อทีมงาน"} · ติดต่อ support@pegasus.gg ก่อนเปิดใช้อีกครั้ง</div>}
    </Card>)}</div>
    {list.data && list.data.page.totalPages > 1 && <nav className="seller-promo-pages" aria-label="หน้ารายการโค้ด"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button><span>หน้า {page + 1} / {list.data.page.totalPages}</span><Button variant="outline" size="sm" disabled={page + 1 >= list.data.page.totalPages} onClick={() => setPage(page + 1)}>ถัดไป</Button></nav>}
    <SellerPromotionForm key={editing === "new" ? "new" : editing?.id ?? "closed"} existing={editing === "new" ? undefined : editing || undefined} open={editing !== null} verified={verified} onClose={() => setEditing(null)} onSaved={refresh} />
    <Dialog open={action != null} onOpenChange={(open) => { if (!open) setAction(null); }}><DialogContent showCloseButton={false} className="seller-promo-action-dialog"><div className="seller-promo-dialog-main"><div className={`seller-promo-modal-icon ${action?.kind || ""}`}>{action?.kind === "pause" ? <Pause /> : action?.kind === "resume" ? <Play /> : action?.kind === "delete" ? <Trash2 /> : <ShieldAlert />}</div><DialogHeader><DialogTitle>{action?.kind === "admin" ? `ทีมงานหยุดโค้ด ${action.code.code}` : action?.kind === "delete" ? deleteBlocked ? `ลบโค้ด ${action.code.code} ไม่ได้` : `ลบโค้ด ${action.code.code}?` : action?.kind === "pause" ? `หยุดโค้ด ${action.code.code} ชั่วคราว?` : `เปิดใช้ ${action?.code.code} อีกครั้ง?`}</DialogTitle></DialogHeader>
      {action?.kind === "pause" && <><p>ลูกค้าจะเก็บหรือใช้โค้ดนี้ไม่ได้จนกว่าคุณจะเปิดอีกครั้ง</p><div className="seller-promo-modal-summary"><span>ลูกค้าเก็บไว้ <strong>{action.code.claimedCount} คน</strong></span><span>ออเดอร์รอชำระ <strong>{action.code.pendingOrderCount == null ? "—" : `${action.code.pendingOrderCount} ออเดอร์`}</strong></span><span>ออเดอร์ที่ชำระแล้ว <strong>ไม่ถูกกระทบ</strong></span></div></>}
      {action?.kind === "resume" && <><p>ลูกค้าที่เก็บไว้จะใช้ได้ทันที และโค้ดกลับมาแสดงบนหน้าร้าน</p><div className="seller-promo-modal-summary"><span>สิทธิ์คงเหลือ <strong>{action.code.usageLimitTotal == null ? "ไม่จำกัด" : Math.max(0, action.code.usageLimitTotal - action.code.usedCount)}</strong></span><span>หมดอายุ <strong>{thaiDate(action.code.endsAt)}</strong></span></div></>}
      {action?.kind === "delete" && <p>{deleteBlocked ? "ลูกค้าเก็บหรือใช้โค้ดนี้แล้ว จึงลบไม่ได้ หยุดชั่วคราวแทนได้" : "ยังไม่มีลูกค้าเก็บหรือใช้โค้ดนี้ ลบแล้วกู้คืนไม่ได้"}</p>}
      {action?.kind === "admin" && <><p>หยุดเมื่อ {action.code.pausedAt ? thaiDate(action.code.pausedAt) : "—"} · คุณเปิดใช้เองไม่ได้</p><div className="seller-promo-admin-reason">เหตุผล: {action.code.pauseReason || "โปรดติดต่อทีมงาน"}<br />เลขอ้างอิง: PRM-{action.code.id}</div><p>ติดต่อทีมงานพร้อมแจ้งรหัสโค้ด {action.code.code} เพื่อขอรายละเอียด</p></>}
    </div><DialogFooter className="seller-promo-dialog-footer"><Button variant="outline" onClick={() => setAction(null)}>{action?.kind === "admin" || deleteBlocked ? "ปิด" : "ยกเลิก"}</Button>{action?.kind === "admin" ? <Button render={<a href="mailto:support@pegasus.gg" />} nativeButton={false}>ติดต่อทีมงาน</Button> : deleteBlocked ? <Button onClick={() => { if (action) setAction({ kind: "pause", code: action.code }); setDeleteBlocked(false); }}>หยุดชั่วคราวแทน</Button> : <Button variant={action?.kind === "pause" || action?.kind === "delete" ? "destructive" : "default"} disabled={busy} onClick={() => void performAction()}>{action?.kind === "pause" ? "หยุดโค้ด" : action?.kind === "resume" ? "เปิดใช้โค้ด" : "ลบโค้ด"}</Button>}</DialogFooter></DialogContent></Dialog>
    <Sheet open={redemptionCode != null} onOpenChange={(open) => { if (!open) { setRedemptionCode(null); setRedemptionPage(0); } }}><SheetContent className="seller-promo-redemption-sheet"><SheetHeader><div className="seller-promo-modal-icon sheet"><BarChart3 /></div><SheetTitle>การใช้โค้ด {redemptionCode?.code}</SheetTitle><p>ลด {redemptionCode?.discountType === "PERCENT" ? `${redemptionCode.discountValue}%` : money(redemptionCode?.discountValue || 0)} · ขั้นต่ำ {money(redemptionCode?.minSpend || 0)}</p></SheetHeader><div className="seller-promo-redemption-metrics"><div><span>ใช้แล้ว</span><strong>{redemptionCode?.usedCount} / {redemptionCode?.usageLimitTotal ?? "ไม่จำกัด"}</strong></div><div><span>เก็บแล้ว</span><strong>{redemptionCode?.claimedCount} / {redemptionCode?.claimLimit ?? "ไม่จำกัด"}</strong></div><div><span>ส่วนลดรวม</span><strong>{money(redemptionCode?.discountTotal || 0)}</strong></div></div>{redemptions.isPending && <p>กำลังโหลด...</p>}{redemptions.isError && <p role="alert">โหลดประวัติไม่สำเร็จ</p>}{redemptions.data?.items.length === 0 && <p>ยังไม่มีการใช้โค้ด</p>}<div className="seller-promo-redemption-list">{redemptions.data?.items.map((entry) => <div key={entry.id}><span>{entry.sellerOrderNumber ? <Link to={entry.sellerOrderId ? `/seller/orders/${entry.sellerOrderId}` : `/seller/orders?q=${encodeURIComponent(entry.sellerOrderNumber)}`}>{entry.sellerOrderNumber}</Link> : "—"}</span><span>{maskBuyer(entry.buyerDisplayName)}</span><span>{money(entry.amount)}</span><span>{entry.status}</span></div>)}</div>{redemptions.data && redemptions.data.totalPages > 1 && <div className="seller-promo-pages"><Button variant="outline" size="sm" disabled={redemptionPage === 0} onClick={() => setRedemptionPage(redemptionPage - 1)}>ก่อนหน้า</Button><span>{redemptionPage + 1} / {redemptions.data.totalPages}</span><Button variant="outline" size="sm" disabled={redemptionPage + 1 >= redemptions.data.totalPages} onClick={() => setRedemptionPage(redemptionPage + 1)}>ถัดไป</Button></div>}</SheetContent></Sheet>
  </main>;
}
