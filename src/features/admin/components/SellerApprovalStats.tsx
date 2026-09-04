import type {
  SellerApprovalStat,
  SellerApprovalTone,
} from "@/features/admin/admin.types";
import { cn } from "@/lib/utils";

const TONE_DOT: Record<SellerApprovalTone, string> = {
  pending: "bg-[#b45309]",
  approved: "bg-[#12805c]",
  rejected: "bg-[#d0342c]",
  total: "bg-[#67787c]",
};

/**
 * แถบตัวเลขสรุปใต้หัวข้อหน้า
 *
 * ดีไซน์คั่นแต่ละช่องด้วยเส้น 1px — ที่นี่ใช้ grid gap-px แล้วให้สีพื้นของ grid
 * โผล่ออกมาเป็นเส้นแทน จะได้มีเส้นคั่นทั้งแนวตั้งและแนวนอนตอนตกบรรทัด
 */
export function SellerApprovalStats({ stats }: { stats: SellerApprovalStat[] }) {
  return (
    <div className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-[#eef1f2] xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="flex flex-col gap-1.5 bg-background px-5 py-4"
        >
          <div className="flex items-center gap-[7px]">
            <span
              aria-hidden="true"
              className={cn(
                "size-[7px] shrink-0 rounded-full",
                TONE_DOT[stat.tone],
              )}
            />
            <span
              className={cn(
                "text-xs",
                stat.emphasis
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {stat.label}
            </span>
          </div>
          <p
            className={cn(
              "text-[22px] leading-tight font-bold tracking-[-0.4px]",
              stat.emphasis ? "text-foreground" : "text-[#414755]",
            )}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
