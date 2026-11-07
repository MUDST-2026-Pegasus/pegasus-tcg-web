import { useLanguage } from "@/lib/language";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { TimelineStep, TimelineTone } from "../seller-auction-detail.format";

/** สีจุด: เขียว = ผ่านแล้ว · primary = ตอนนี้ · เทา = ยังไม่ถึง · แดง = ผู้ชนะไม่ชำระ / ถูกระงับ */
const DOT: Record<TimelineTone, string> = {
  done: "border-emerald-600 bg-emerald-600",
  current: "border-primary bg-primary",
  pending: "border-border bg-card",
  failed: "border-destructive bg-destructive",
  ended: "border-muted-foreground bg-muted-foreground",
};

const LABEL: Record<TimelineTone, string> = {
  done: "font-medium text-foreground",
  current: "font-semibold text-foreground",
  pending: "text-muted-foreground",
  failed: "font-medium text-destructive",
  ended: "font-medium text-foreground",
};

/** การ์ด "ขั้นตอน" ข้างขวาของ S4 [TCG-634 · FE-8] */
export function AuctionTimeline({ steps }: { steps: TimelineStep[] }) {
  useLanguage();
  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-base font-semibold text-foreground">ขั้นตอน</p>
      <ol className="flex flex-col gap-3.5">
        {steps.map((step) => (
          <li key={step.id} data-tone={step.tone} className="flex items-start gap-2.5">
            <span aria-hidden className={cn("mt-1 size-2.5 shrink-0 rounded-full border-2", DOT[step.tone])} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className={cn("text-xs", LABEL[step.tone])}>{step.label}</p>
              {step.detail ? <p className="text-[11px] text-muted-foreground">{step.detail}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
