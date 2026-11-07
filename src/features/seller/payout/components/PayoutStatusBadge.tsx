import { Badge } from "@/components/ui/badge";
import { payoutStatus } from "../payout.format";

export function PayoutStatusBadge({ status }: { status: string }) {
  const badge = payoutStatus(status);
  return (
    <Badge variant={badge.variant}>● {badge.label}</Badge>
  );
}
