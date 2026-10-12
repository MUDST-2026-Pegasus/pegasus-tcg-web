import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { PayoutData } from "../payout.types";

type BankAccountCardProps = PayoutData["bankAccount"];

export function BankAccountCard({
  title,
  statusLabel,
  bankName,
  accountNumber,
  accountNameLabel,
  accountName,
  changeLabel,
  changeNote,
}: BankAccountCardProps) {
  return (
    <Card className="w-full shrink-0 gap-4 rounded-xl border border-border p-5 shadow-none ring-0 lg:w-80">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-950">{title}</p>
        <Badge className="h-5 rounded-full bg-green-100 px-2 text-xs text-emerald-700">
          {statusLabel}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 rounded-[10px] border border-gray-100 bg-neutral-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
            <CreditCard aria-hidden="true" className="size-6 text-teal-600" />
          </div>
          <div className="flex min-w-0 flex-col gap-[3px]">
            <p className="text-xs font-semibold text-zinc-950">{bankName}</p>
            <p className="text-xs text-gray-500">{accountNumber}</p>
          </div>
        </div>

        <Separator className="bg-gray-100" />

        <div className="flex flex-col gap-[5px]">
          <p className="text-[10px] text-gray-400">{accountNameLabel}</p>
          <p className="text-xs font-medium text-zinc-950">{accountName}</p>
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full rounded-md px-2.5">
        {changeLabel}
      </Button>

      <p className="text-[10px] leading-4 text-gray-400">{changeNote}</p>
    </Card>
  );
}
