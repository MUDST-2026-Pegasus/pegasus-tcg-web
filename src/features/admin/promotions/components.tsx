import { Link } from "react-router-dom";
import { House, MoreVertical } from "lucide-react";
import type { AdminPromotion, AdminPromotionInput, PromotionStatus } from "./types";
import notch from "@/assets/promotions/notch.svg";
import scallop from "@/assets/promotions/scallop.svg";

const statusStyles: Record<PromotionStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  SCHEDULED: "bg-blue-50 text-blue-700",
  PAUSED: "bg-amber-50 text-amber-800",
  EXPIRED: "bg-muted text-muted-foreground",
  USED_UP: "bg-red-50 text-red-700",
};
const statusLabels: Record<PromotionStatus, string> = {
  ACTIVE: "ใช้งานอยู่", SCHEDULED: "ตั้งเวลาไว้", PAUSED: "หยุดชั่วคราว",
  EXPIRED: "หมดอายุ", USED_UP: "สิทธิ์เต็มแล้ว",
};

export function PromotionStatusPill({ status }: { status: PromotionStatus }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${statusStyles[status]}`}><span className="size-1.5 rounded-full bg-current" />{statusLabels[status]}</span>;
}

export function PromotionOwnerTag({ owner, name }: { owner: "PLATFORM" | "SELLER"; name?: string }) {
  return <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${owner === "PLATFORM" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700"}`}>{owner === "PLATFORM" ? "Pegasus" : name || "ร้านค้า"}</span>;
}

const money = (value: number) => `฿${value.toLocaleString("th-TH")}`;

/** One responsive table row from Figma PRM / Admin Promo Row. */
export function AdminPromotionRow({ promotion, onView, onAction }: {
  promotion: AdminPromotion;
  onView: (id: number) => void;
  onAction: (kind: "pause" | "resume" | "delete", code: AdminPromotion) => void;
}) {
  const code = promotion;
  const discount = code.discountType === "FREE_SHIPPING" ? "ส่งฟรี" : code.discountType === "PERCENT" ? `ลด ${code.discountValue}%` : `ลด ${money(code.discountValue)}`;
  return <tr className="border-t text-xs">
    <td className="px-4 py-3"><div className="flex items-center gap-2"><strong className="text-sm tracking-wide">{code.code}</strong><PromotionOwnerTag owner={code.ownerType} name={code.owner?.name} /></div><span className="block text-muted-foreground">{code.name}{code.featuredOnHome && <House className="ml-1 inline size-3 text-primary" aria-label="แสดงบนหน้าแรก" />}</span></td>
    <td className="px-4 py-3"><span className="font-semibold">{discount}</span>{code.maxDiscount != null && <span className="block text-muted-foreground">สูงสุด {money(code.maxDiscount)}</span>}</td>
    <td className="px-4 py-3">ขั้นต่ำ {money(code.minSpend)}<span className="block text-muted-foreground">{code.scopeType === "ALL" ? "ทุกเกม" : code.scopeType === "GAME" ? "เลือกเกม" : "เลือกหมวดหมู่"} · {code.usageLimitPerUser} สิทธิ์/คน</span></td>
    <td className="px-4 py-3">{code.usedCount} / {code.usageLimitTotal ?? "ไม่จำกัด"}<span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${code.usageLimitTotal ? Math.min(100, 100 * code.usedCount / code.usageLimitTotal) : 0}%` }} /></span>{code.claimable && <span className="block text-muted-foreground">เก็บแล้ว {code.claimedCount} / {code.claimLimit ?? "ไม่จำกัด"}</span>}</td>
    <td className="px-4 py-3">{new Date(code.startsAt).toLocaleDateString("th-TH")} – {new Date(code.endsAt).toLocaleDateString("th-TH")}</td>
    <td className="px-4 py-3"><PromotionStatusPill status={code.status} /></td>
    <td className="px-4 py-3"><details className="relative"><summary aria-label={`จัดการ ${code.code}`} className="cursor-pointer list-none"><MoreVertical className="size-4" /></summary><div className="absolute right-0 z-10 grid min-w-32 gap-1 rounded-lg border bg-card p-2 shadow-lg">{code.ownerType === "PLATFORM" && <Link to={`/admin/promotions/${code.id}/edit`}>แก้ไข</Link>}<button className="text-left" onClick={() => onView(code.id)}>ดูการใช้โค้ด</button><button className="text-left" onClick={() => onAction(code.status === "PAUSED" ? "resume" : "pause", code)}>{code.status === "PAUSED" ? "เปิดใช้อีกครั้ง" : "หยุดชั่วคราว"}</button>{code.ownerType === "PLATFORM" && <button className="text-left text-destructive" onClick={() => onAction("delete", code)}>ลบ</button>}</div></details></td>
  </tr>;
}

/** Figma PRM / Claim Ticket, shown with current form values before publishing. */
export function ClaimTicketPreview({ promotion }: { promotion: AdminPromotionInput }) {
  const value = promotion.discountType === "FREE_SHIPPING" ? "ส่งฟรี" : promotion.discountType === "PERCENT" ? `${promotion.discountValue || 0}%` : money(promotion.discountValue || 0);
  return <div className="relative flex min-h-28 w-full max-w-[320px] overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border">
    <div className="flex w-[94px] shrink-0 flex-col items-center justify-center bg-gradient-to-br from-[#00398a] via-[#0058bc] to-[#1a8fe0] px-1 text-center text-white">
      <span className="text-[10px] opacity-80">ลด</span><strong className="text-[22px] font-black leading-7">{value}</strong><span className="text-[9px] font-semibold tracking-widest opacity-80">PEGASUS</span>
    </div>
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 border-l border-dashed border-border px-3 py-2">
      <strong className="truncate text-sm tracking-wide">{promotion.code || "YOURCODE"}</strong>
      <span className="text-xs text-foreground/75">{promotion.discountType === "PERCENT" && promotion.maxDiscount ? `สูงสุด ${money(promotion.maxDiscount)} · ` : ""}ขั้นต่ำ {money(promotion.minSpend || 0)}</span>
      <span className="truncate text-[11px] text-muted-foreground">ใช้ได้ถึง {new Date(promotion.endsAt).toLocaleDateString("th-TH")} · {promotion.claimLimit == null ? "เก็บได้ไม่จำกัด" : `แจก ${promotion.claimLimit} สิทธิ์`}</span>
    </div>
    <img src={notch} alt="" className="pointer-events-none absolute -top-[9px] left-[85px] size-[18px]" />
    <img src={notch} alt="" className="pointer-events-none absolute -bottom-[9px] left-[85px] size-[18px]" />
    {[-38, -20, -2, 16, 34].map((offset) => <img key={offset} src={scallop} alt="" className="pointer-events-none absolute -left-1 size-2" style={{ top: `calc(50% + ${offset}px)` }} />)}
  </div>;
}
