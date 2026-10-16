import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SellerAvatar } from "@/features/admin/components/SellerAvatar";
import { cn } from "@/lib/utils";

import { accentFor, initialsOf } from "../finance.format";
import type { FinanceParty } from "../finance.types";

/**
 * ชิ้นส่วนที่สามหน้าการเงิน (ตรวจสลิป / คืนเงิน / ถอนเงินผู้ขาย) ใช้ร่วมกัน
 * อ้างจาก Figma "V2 · Admin" node 1913:2482, 1913:2813, 1913:3144
 */

export function FinancePageHeader({
  title,
  description,
  onExport,
  exportDisabled,
}: {
  title: string;
  description: string;
  onExport: () => void;
  exportDisabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
          {title}
        </h1>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="rounded-md px-2.5"
        disabled={exportDisabled}
        onClick={onExport}
      >
        ส่งออก CSV
      </Button>
    </div>
  );
}

export type FinanceStat = {
  label: string;
  value: string;
  /** สีจุดนำหน้า */
  dotClass: string;
  /** ช่องที่สำคัญที่สุดของหน้า — ตัวหนังสือเข้มกว่า */
  emphasized?: boolean;
};

/**
 * แถบตัวเลขสรุปใต้หัวข้อ — คั่นแต่ละช่องด้วยเส้น 1px จากสีพื้นของ grid
 * โหลดไม่สำเร็จโชว์ "—" แทนตัวเลข ไม่ให้ศูนย์ปลอมดูเหมือนข้อมูลจริง
 */
export function FinanceStatStrip({
  stats,
  isLoading,
  isError,
}: {
  stats: FinanceStat[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-[#eef1f2] xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1.5 bg-background px-5 py-4">
          <div className="flex items-center gap-[7px]">
            <span aria-hidden="true" className={cn("size-[7px] shrink-0 rounded-full", stat.dotClass)} />
            <span
              className={cn(
                "text-xs",
                stat.emphasized ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {stat.label}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p
              className={cn(
                "text-[22px] leading-tight font-bold tracking-[-0.4px]",
                stat.emphasized ? "text-foreground" : "text-[#414755]",
              )}
            >
              {isError ? "—" : stat.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export type FinanceTab<T extends string> = { value: T; label: string };

/** แท็บกรองคิว + ช่องค้นหา (ค้นในชุดที่โหลดมาแล้ว ไม่ยิง backend) */
export function FinanceTabs<T extends string>({
  tabs,
  active,
  onChange,
  search,
  onSearchChange,
  searchPlaceholder,
}: {
  tabs: FinanceTab<T>[];
  active: T;
  onChange: (value: T) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" aria-label="กรองรายการ" className="flex flex-wrap items-center gap-1">
        {tabs.map((tab) => {
          const isActive = tab.value === active;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.value)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#eef1f2] text-foreground"
                  : "text-foreground hover:bg-[#f6f8f9]",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="relative w-full sm:w-[280px]">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 rounded-md bg-background pl-9"
        />
      </div>
    </div>
  );
}

export function PartyAvatar({ party, className }: { party: FinanceParty; className?: string }) {
  return (
    <SellerAvatar
      initials={initialsOf(party.username)}
      accent={accentFor(party.id)}
      src={party.avatarUrl}
      className={className}
    />
  );
}

export type FinanceBadge = { label: string; className: string };

/** การ์ดหนึ่งใบในคิวทางซ้าย */
export function FinanceQueueCard({
  party,
  title,
  subtitle,
  amount,
  badges,
  active,
  onSelect,
}: {
  party: FinanceParty;
  title: string;
  subtitle: string;
  amount: string;
  badges: FinanceBadge[];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl bg-background p-4 text-left transition-colors",
        active ? "border-2 border-[#0058bc]" : "border border-border hover:bg-[#fafbfb]",
      )}
    >
      <div className="flex w-full items-center gap-3">
        <PartyAvatar party={party} className="size-[38px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate text-[13px] font-semibold text-foreground">{title}</span>
          <span className="truncate text-[11px] text-muted-foreground">{subtitle}</span>
        </div>
        <span className="shrink-0 text-sm font-bold text-foreground">{amount}</span>
      </div>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <Badge
              key={badge.label}
              className={cn("h-5 rounded-[5px] px-2 text-[10px] font-medium", badge.className)}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}

/** หัวคอลัมน์คิว — "คิวพร้อมโอน (8)" + คำอธิบายการเรียง */
export function FinanceQueueHeader({ title, sortLabel }: { title: string; sortLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground">{sortLabel}</p>
    </div>
  );
}

/** ช่องว่างทางขวาตอนยังไม่เลือกรายการ */
export function FinanceDetailPlaceholder({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 flex-1 items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-[13px] text-muted-foreground">{children}</p>
    </div>
  );
}

/** หนึ่งบรรทัด label/value ในกล่องยอดเงิน */
export function AmountRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-foreground", strong ? "font-bold" : "font-medium")}>{value}</span>
    </div>
  );
}

/** ฟิลด์ label เล็กสีเทา + ค่า */
export function InfoField({ label, value, large }: { label: string; value: ReactNode; large?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] text-[#9aa5ad]">{label}</span>
      <span
        className={cn(
          "break-words text-foreground",
          large ? "text-lg font-bold" : "text-[13px] font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}
