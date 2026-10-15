import { payoutStatus } from "../payout.format";

export function PayoutStatusBadge({ status }: { status: string }) {
  const badge = payoutStatus(status);
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
      ● {badge.label}
    </span>
  );
}
