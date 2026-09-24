import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { VERIFICATION_STATUS_META } from "../verification.format";
import { VERIFICATION_STATUSES } from "../verification.queries";
import type { VerificationStatus } from "../verification.types";

type SellerApprovalStatsProps = {
  counts: Record<VerificationStatus, number>;
  active: VerificationStatus;
  onSelect: (status: VerificationStatus) => void;
  isLoading?: boolean;
};

/**
 * แถบตัวเลขสรุปใต้หัวข้อหน้า — ทำหน้าที่เป็นแท็บเลือกสถานะไปในตัว
 * ตัวเลขเป็นจำนวนจริงของแต่ละคิว (`totalItems` จาก backend) กดช่องไหนก็กรองคิวตามนั้น
 *
 * ดีไซน์คั่นแต่ละช่องด้วยเส้น 1px — ใช้ grid gap-px แล้วให้สีพื้นของ grid โผล่เป็นเส้น
 */
export function SellerApprovalStats({
  counts,
  active,
  onSelect,
  isLoading,
}: SellerApprovalStatsProps) {
  return (
    <div
      role="tablist"
      aria-label="กรองคำขอตามสถานะ"
      className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-[#eef1f2] xl:grid-cols-4"
    >
      {VERIFICATION_STATUSES.map((status) => {
        const meta = VERIFICATION_STATUS_META[status];
        const isActive = status === active;

        return (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(status)}
            className={cn(
              "flex flex-col gap-1.5 bg-background px-5 py-4 text-left transition-colors outline-none",
              isActive
                ? "ring-2 ring-inset ring-[#0058bc]"
                : "hover:bg-[#fafbfb] focus-visible:bg-[#fafbfb]",
            )}
          >
            <div className="flex items-center gap-[7px]">
              <span
                aria-hidden="true"
                className={cn("size-[7px] shrink-0 rounded-full", meta.dotClass)}
              />
              <span
                className={cn(
                  "text-xs",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {meta.shortLabel}
              </span>
            </div>

            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p
                className={cn(
                  "text-[22px] leading-tight font-bold tracking-[-0.4px]",
                  isActive ? "text-foreground" : "text-[#414755]",
                )}
              >
                {counts[status].toLocaleString("th-TH")}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
