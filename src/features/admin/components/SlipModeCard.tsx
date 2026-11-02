import { ShieldCheck, UserCheck, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { financeErrorMessage } from "../finance.format";
import { SLIP_AUTO_APPROVE_KEY } from "../finance.api";
import { useSetSlipAutoApprove, useSlipAutoApprove } from "../finance.queries";

/**
 * การ์ดสลับโหมดตรวจสลิป — อ่าน/เขียน platform setting `payment.slip_auto_approve`
 * มีผลกับสลิปที่แนบหลังเปลี่ยนเท่านั้น สลิปที่อยู่ในคิวแล้วยังต้องตรวจเอง
 */
export function SlipModeCard({ queueCount }: { queueCount: number }) {
  const autoApprove = useSlipAutoApprove();
  const setAutoApprove = useSetSlipAutoApprove();
  const enabled = autoApprove.data ?? false;
  const disabled = autoApprove.isPending || autoApprove.isError || setAutoApprove.isPending;

  const choose = (next: boolean) => {
    if (next === enabled || disabled) {
      return;
    }
    setAutoApprove.mutate(next, {
      onSuccess: () =>
        toast.add({
          type: "success",
          title: next ? "เปิดอนุมัติสลิปอัตโนมัติแล้ว" : "เปลี่ยนเป็นตรวจสอบเองแล้ว",
        }),
      onError: (error) =>
        toast.add({
          type: "error",
          title: "เปลี่ยนโหมดไม่สำเร็จ",
          description: financeErrorMessage(error, "ลองใหม่อีกครั้ง"),
        }),
    });
  };

  const options = [
    { value: false, label: "ตรวจสอบเอง", icon: UserCheck },
    { value: true, label: "อนุมัติอัตโนมัติ", icon: Zap },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-background px-5 py-[18px] md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e8f1fc] text-[#0058bc]">
          <ShieldCheck className="size-[18px]" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">โหมดตรวจสอบสลิปชำระเงิน</p>
            <Badge className="h-5 rounded-[5px] bg-muted px-2 text-[10px] font-medium text-muted-foreground">
              {SLIP_AUTO_APPROVE_KEY} = {autoApprove.isPending ? "…" : String(enabled)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            ตรวจสอบเอง: admin ต้องกดอนุมัติทุกสลิป · อนุมัติอัตโนมัติ:
            ระบบยืนยันการชำระเงินทันทีที่ผู้ซื้อแนบสลิป (ยังตรวจยอดเงินและสลิปซ้ำให้ทุกครั้ง)
          </p>
          <p className="text-[11px] text-[#9aa5ad]">
            การเปลี่ยนโหมดมีผลกับสลิปที่แนบหลังจากนี้ — สลิป {queueCount.toLocaleString("th-TH")}{" "}
            รายการที่อยู่ในคิวตอนนี้ยังต้องตรวจเอง
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="โหมดตรวจสอบสลิป"
        className="flex shrink-0 gap-1 self-start rounded-[10px] bg-secondary p-1 md:self-auto"
      >
        {options.map((option) => {
          const selected = option.value === enabled;
          const Icon = option.icon;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => choose(option.value)}
              className={cn(
                "flex items-center gap-2 rounded-lg py-2 pr-3.5 pl-3 text-[13px] transition-colors disabled:cursor-not-allowed",
                selected
                  ? "bg-card font-semibold text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-[15px]" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
