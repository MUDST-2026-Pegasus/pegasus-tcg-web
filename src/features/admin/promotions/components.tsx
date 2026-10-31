import { Link } from "react-router-dom";
import { House, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { AdminPromotion, AdminPromotionInput, PromotionStatus } from "./types";
import notch from "@/assets/promotions/notch.svg";
import scallop from "@/assets/promotions/scallop.svg";

const statusStyles: Record<PromotionStatus, string> = {
  ACTIVE: "bg-[#e7f6ee] text-[#007a4a]",
  SCHEDULED: "bg-[#e8f1fc] text-[#0058bc]",
  PAUSED: "bg-[#fdf0dd] text-[#b45309]",
  EXPIRED: "bg-[#eef1f2] text-[#67787c]",
  USED_UP: "bg-[#fde8e8] text-[#b42318]",
};
const statusLabels: Record<PromotionStatus, string> = {
  ACTIVE: "ใช้งานอยู่", SCHEDULED: "ตั้งเวลาไว้", PAUSED: "หยุดชั่วคราว",
  EXPIRED: "หมดอายุ", USED_UP: "สิทธิ์เต็ม",
};

export function PromotionStatusPill({ status }: { status: PromotionStatus }) {
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-[3px] text-xs font-medium ${statusStyles[status]}`}><span className="size-1.5 rounded-full bg-current" />{statusLabels[status]}</span>;
}

export function PromotionOwnerTag({ owner, name }: { owner: "PLATFORM" | "SELLER"; name?: string }) {
  return <span title={owner === "SELLER" ? name : undefined} className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${owner === "PLATFORM" ? "bg-[#e8f1fc] text-[#0058bc]" : "bg-[#e6f6f4] text-[#0f766e]"}`}>{owner === "PLATFORM" ? "Pegasus" : "โค้ดร้าน"}</span>;
}

const money = (value: number) => `฿${value.toLocaleString("th-TH")}`;
const formatDate = (value: string) => new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const formatPeriod = (startValue: string, endValue: string) => {
  const start = new Date(startValue); const end = new Date(endValue);
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    const monthYear = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { month: "short", year: "numeric" }).format(end);
    return `${start.getDate()} ${new Intl.DateTimeFormat("th-TH-u-ca-gregory", { month: "short" }).format(start)} – ${end.getDate()} ${monthYear}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    const startShort = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short" }).format(start);
    return `${startShort} – ${formatDate(endValue)}`;
  }
  return `${formatDate(startValue)} – ${formatDate(endValue)}`;
};

/** One responsive table row from Figma PRM / Admin Promo Row. */
export function AdminPromotionRow({ promotion, onView, onAction, now }: {
  promotion: AdminPromotion;
  onView: (id: number) => void;
  onAction: (kind: "pause" | "resume" | "delete", code: AdminPromotion) => void;
  now: number;
}) {
  const code = promotion;
  const discount = code.discountType === "FREE_SHIPPING" ? "ส่งฟรี" : code.discountType === "PERCENT" ? `ลด ${code.discountValue}%` : `ลด ${money(code.discountValue)}`;
  const daysToEnd = Math.ceil((new Date(code.endsAt).getTime() - now) / 86400000);
  const daysToStart = Math.ceil((new Date(code.startsAt).getTime() - now) / 86400000);
  const periodHint = code.status === "ACTIVE" ? `เหลือ ${Math.max(0, daysToEnd)} วัน` : code.status === "SCHEDULED" ? `เริ่มใน ${Math.max(0, daysToStart)} วัน` : code.status === "PAUSED" ? "หยุดโดยแอดมิน" : code.status === "EXPIRED" ? "สิ้นสุดแล้ว" : "สิทธิ์ครบแล้ว";
  return <tr className="border-t text-xs">
    <td className="px-4 py-3"><div className="flex items-center gap-2"><strong className="text-sm tracking-wide">{code.code}</strong><PromotionOwnerTag owner={code.ownerType} name={code.owner?.name} /></div><span className="block text-muted-foreground">{code.name}{code.featuredOnHome && <House className="ml-1 inline size-3 text-primary" aria-label="แสดงบนหน้าแรก" />}</span></td>
    <td className="px-4 py-3"><span className="font-semibold">{discount}</span>{code.maxDiscount != null && <span className="block text-muted-foreground">สูงสุด {money(code.maxDiscount)}</span>}</td>
    <td className="px-4 py-3">ขั้นต่ำ {money(code.minSpend)}<span className="block text-muted-foreground">{code.scopeType === "ALL" ? "ทุกเกม" : code.scopeType === "GAME" ? "เลือกเกม" : "เลือกหมวดหมู่"} · {code.usageLimitPerUser} สิทธิ์/คน</span></td>
    <td className="px-4 py-3">{code.usedCount} / {code.usageLimitTotal ?? "ไม่จำกัด"}<span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${code.usageLimitTotal ? Math.min(100, 100 * code.usedCount / code.usageLimitTotal) : 0}%` }} /></span>{code.claimable && <span className="block text-muted-foreground">เก็บแล้ว {code.claimedCount} / {code.claimLimit ?? "ไม่จำกัด"}</span>}</td>
    <td className="px-4 py-3"><span className="block truncate" title={`${formatDate(code.startsAt)} – ${formatDate(code.endsAt)}`}>{formatPeriod(code.startsAt, code.endsAt)}</span><span className="mt-0.5 block truncate text-muted-foreground">{periodHint}</span></td>
    <td className="px-4 py-3"><PromotionStatusPill status={code.status} /></td>
    <td className="px-2 py-3 text-right"><DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`จัดการ ${code.code}`} />}><MoreVertical className="size-4" /></DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="promotion-row-menu w-40 min-w-40 rounded-lg border-[#e3e7e8] p-1 shadow-lg">
        {code.ownerType === "PLATFORM" && <DropdownMenuItem render={<Link to={`/admin/promotions/${code.id}/edit`} />} className="rounded-md px-3 py-2 text-xs">แก้ไข</DropdownMenuItem>}
        <DropdownMenuItem onClick={() => onView(code.id)} className="rounded-md px-3 py-2 text-xs">ดูการใช้โค้ด</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction(code.status === "PAUSED" ? "resume" : "pause", code)} className="rounded-md px-3 py-2 text-xs">{code.status === "PAUSED" ? "เปิดใช้อีกครั้ง" : "หยุดชั่วคราว"}</DropdownMenuItem>
        {code.ownerType === "PLATFORM" && <DropdownMenuItem variant="destructive" onClick={() => onAction("delete", code)} className="rounded-md px-3 py-2 text-xs">ลบ</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu></td>
  </tr>;
}

/** Figma PRM / Claim Ticket, shown with current form values before publishing. */
export function ClaimTicketPreview({ promotion }: { promotion: AdminPromotionInput }) {
  const value = promotion.discountType === "FREE_SHIPPING" ? "ส่งฟรี" : promotion.discountType === "PERCENT" ? `${promotion.discountValue || 0}%` : money(promotion.discountValue || 0);
  const endDate = new Date(promotion.endsAt);
  const endsAt = Number.isFinite(endDate.getTime()) ? new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short", year: "numeric" }).format(endDate) : "—";
  return <div className="promotion-ticket relative flex h-[92px] w-full overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border">
    <div className="flex w-[88px] shrink-0 flex-col items-center justify-center bg-gradient-to-br from-[#00398a] via-[#0058bc] to-[#1a8fe0] px-1 text-center text-white">
      <span className="text-[10px] opacity-80">ลด</span><strong className="text-[22px] font-black leading-7">{value}</strong><span className="text-[9px] font-semibold tracking-widest opacity-80">PEGASUS</span>
    </div>
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 border-l border-dashed border-border px-3 py-2">
      <div className="flex items-center justify-between gap-1"><strong className="truncate text-sm tracking-wide">{promotion.code || "PEGASUS10"}</strong><span aria-hidden className="size-[18px] shrink-0 rounded-full border border-[#9aa5ad]" /></div>
      <span className="truncate text-[11px] text-foreground/75">{promotion.discountType === "PERCENT" && promotion.maxDiscount ? `ลด ${promotion.discountValue}% สูงสุด ${money(promotion.maxDiscount)} · ` : ""}ขั้นต่ำ {money(promotion.minSpend || 0)}</span>
      <span className="truncate text-[10px] text-muted-foreground">ใช้ได้ถึง {endsAt} · {promotion.claimLimit == null ? "เก็บได้ไม่จำกัด" : `เหลือ ${promotion.claimLimit} สิทธิ์`}</span>
    </div>
    <img src={notch} alt="" className="pointer-events-none absolute -top-[9px] left-[79px] size-[18px]" />
    <img src={notch} alt="" className="pointer-events-none absolute -bottom-[9px] left-[79px] size-[18px]" />
    {[-38, -20, -2, 16, 34].map((offset) => <img key={offset} src={scallop} alt="" className="pointer-events-none absolute -left-1 size-2" style={{ top: `calc(50% + ${offset}px)` }} />)}
  </div>;
}
