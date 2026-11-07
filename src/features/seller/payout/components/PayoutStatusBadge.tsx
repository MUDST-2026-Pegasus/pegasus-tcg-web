import { useLanguage } from "@/lib/language";
import { payoutStatus } from "../payout.format";

export function PayoutStatusBadge({ status }: { status: string }) {
  useLanguage();
  const badge = payoutStatus(status);
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
      ● {badge.label}
    </span>
  );
}
