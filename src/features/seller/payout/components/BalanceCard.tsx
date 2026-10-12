import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { PayoutData } from "../payout.types";

type BalanceCardProps = PayoutData["balance"] & {
  onWithdraw: () => void;
};

export function BalanceCard({
  label,
  amount,
  withdrawLabel,
  stats,
  scheduleNote,
  onWithdraw,
}: BalanceCardProps) {
  return (
    <Card className="w-full min-w-0 flex-1 gap-5 rounded-2xl border-0 bg-zinc-950 p-6 text-white shadow-none ring-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-400">{label}</p>
          <p className="text-4xl font-bold text-white">{amount}</p>
        </div>

        <Button
          onClick={onWithdraw}
          className="h-auto rounded-lg bg-teal-600 px-5 py-3 text-xs font-semibold text-white hover:bg-teal-700"
        >
          {withdrawLabel}
        </Button>
      </div>

      <Separator className="bg-gray-800" />

      <div className="flex">
        {stats.map((stat) => (
          <div key={stat.id} className="flex flex-1 flex-col gap-1.5">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="text-base font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 rounded-lg bg-zinc-900 px-4 py-3">
        <Calendar aria-hidden="true" className="size-6 shrink-0 text-slate-500" />
        <p className="text-xs text-neutral-300">{scheduleNote}</p>
      </div>
    </Card>
  );
}
