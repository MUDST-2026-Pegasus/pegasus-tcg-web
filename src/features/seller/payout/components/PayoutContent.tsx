import { Button } from "@/components/ui/button";

import type { PayoutData } from "../payout.types";

import { BalanceCard } from "./BalanceCard";
import { BankAccountCard } from "./BankAccountCard";
import { WithdrawalHistoryCard } from "./WithdrawalHistoryCard";

type PayoutContentProps = {
  data: PayoutData;
};

export function PayoutContent({ data }: PayoutContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-950">{data.title}</h1>
          <p className="text-xs text-gray-500">{data.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-md px-2.5">
            {data.actions.downloadSummaryLabel}
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <BalanceCard {...data.balance} />
        <BankAccountCard {...data.bankAccount} />
      </div>

      <WithdrawalHistoryCard {...data.history} />
    </div>
  );
}
