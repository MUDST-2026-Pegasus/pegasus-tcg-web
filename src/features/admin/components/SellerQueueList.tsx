import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SellerAvatar } from "@/features/admin/components/SellerAvatar";
import { cn } from "@/lib/utils";

import {
  avatarAccentFor,
  formatThaiDateTime,
  initialsFor,
  legalName,
  VERIFICATION_STATUS_META,
} from "../verification.format";
import type { Verification, VerificationStatus } from "../verification.types";

type SellerQueueListProps = {
  status: VerificationStatus;
  /** จำนวนคำขอทั้งหมดในคิวนี้ (อาจมากกว่าที่โชว์ในหน้าปัจจุบัน) */
  count: number;
  verifications: Verification[];
  /** id ของใบที่เปิดดูอยู่ — `null` = ยังไม่เลือก */
  activeId: number | null;
  /** userId ของแอดมินที่เปิดหน้านี้ — ใบที่คนอื่นจองไว้จะมีป้ายบอก */
  currentAdminId: number | undefined;
  onSelect: (verification: Verification) => void;
  viewingLabel: string;
  sortLabel: string;
};

/** คอลัมน์ซ้าย — คิวคำขอเปิดร้าน เรียงเก่าสุดก่อน (backend เรียงให้แล้ว) */
export function SellerQueueList({
  status,
  count,
  verifications,
  activeId,
  currentAdminId,
  onSelect,
  viewingLabel,
  sortLabel,
}: SellerQueueListProps) {
  const title = VERIFICATION_STATUS_META[status].label;

  return (
    <div className="flex w-full flex-col gap-3 lg:w-[420px] lg:shrink-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {title} ({count.toLocaleString("th-TH")})
        </p>
        <p className="text-[11px] text-muted-foreground">{sortLabel}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {verifications.map((verification) => {
          const isActive = verification.id === activeId;
          const claimedBy =
            verification.status === "UNDER_REVIEW"
              ? verification.reviewedBy
              : null;

          return (
            <li key={verification.id}>
              <button
                type="button"
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSelect(verification)}
                className={cn(
                  "flex w-full flex-col gap-3 rounded-xl bg-background p-4 text-left transition-colors",
                  isActive
                    ? "border-2 border-[#0058bc]"
                    : "border border-border hover:bg-[#fafbfb]",
                )}
              >
                <div className="flex w-full items-center gap-3">
                  <SellerAvatar
                    initials={initialsFor(verification)}
                    accent={avatarAccentFor(verification)}
                    className="size-[38px]"
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="truncate text-[13px] font-semibold text-foreground">
                      {legalName(verification)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      ยื่นเมื่อ {formatThaiDateTime(verification.submittedAt)}
                    </span>
                  </div>

                  {isActive ? (
                    <Badge className="h-5 rounded-full bg-[#e8f1fc] px-2 text-[11px] font-medium text-[#0058bc]">
                      {viewingLabel}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge className="h-5 rounded-[5px] bg-[#eef1f2] px-2 text-[10px] font-medium text-muted-foreground">
                    {verification.bankName}
                  </Badge>
                  {claimedBy !== null && (
                    <Badge
                      className={cn(
                        "h-5 rounded-[5px] px-2 text-[10px] font-medium",
                        claimedBy === currentAdminId
                          ? "bg-[#e8f1fc] text-[#0058bc]"
                          : "bg-[#fdf0dd] text-[#b45309]",
                      )}
                    >
                      <Lock data-icon="inline-start" />
                      {claimedBy === currentAdminId
                        ? "คุณกำลังตรวจ"
                        : `แอดมิน #${claimedBy} กำลังตรวจ`}
                    </Badge>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
