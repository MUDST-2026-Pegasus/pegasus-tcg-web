import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Steps to Return (ขั้นตอนการคืนสินค้า)
 */
export function ReturnStepsWidget({ currentStep }: { currentStep: number }) {
  return (
    <Card className="gap-0 rounded-xl border border-border py-0 shadow-none ring-0">
      <CardContent className="p-5 space-y-4">
        <h3 className="font-bold text-sm text-foreground">
          ขั้นตอนการคืนสินค้า
        </h3>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-3 stroke-[3]" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground">
                1. ผู้ซื้อเปิดคำขอพร้อมหลักฐาน
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                currentStep === 2
                  ? "border-2 border-primary text-primary bg-primary/10"
                  : currentStep > 2
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground bg-muted/50"
              )}
            >
              {currentStep > 2 ? <Check className="size-3 stroke-[3]" /> : "2"}
            </div>
            <div className="space-y-0.5">
              <div
                className={cn(
                  "text-xs font-semibold",
                  currentStep === 2 ? "text-primary font-bold" : "text-foreground"
                )}
              >
                คุณอนุมัติหรือปฏิเสธ
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                ไม่มีกำหนดเวลา แต่มีผลถูกหักเงินจนกว่าจะตัดสิน
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                currentStep === 3
                  ? "border-2 border-primary text-primary bg-primary/10"
                  : currentStep > 3
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground bg-muted/50"
              )}
            >
              {currentStep > 3 ? <Check className="size-3 stroke-[3]" /> : "3"}
            </div>
            <div className="space-y-0.5">
              <div
                className={cn(
                  "text-xs font-semibold",
                  currentStep === 3 ? "text-primary font-bold" : "text-foreground"
                )}
              >
                ผู้ซื้อส่งของคืน
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                เฉพาะเมื่อคุณให้ส่งคืน
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                currentStep === 4
                  ? "border-2 border-primary text-primary bg-primary/10"
                  : currentStep > 4
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground bg-muted/50"
              )}
            >
              {currentStep > 4 ? <Check className="size-3 stroke-[3]" /> : "4"}
            </div>
            <div className="space-y-0.5">
              <div
                className={cn(
                  "text-xs font-semibold",
                  currentStep === 4 ? "text-primary font-bold" : "text-foreground"
                )}
              >
                คุณยืนยันได้รับของ
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                currentStep === 5
                  ? "border-2 border-primary text-primary bg-primary/10"
                  : currentStep > 5
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground bg-muted/50"
              )}
            >
              {currentStep > 5 ? <Check className="size-3 stroke-[3]" /> : "5"}
            </div>
            <div className="space-y-0.5">
              <div
                className={cn(
                  "text-xs font-semibold",
                  currentStep === 5 ? "text-primary font-bold" : "text-foreground"
                )}
              >
                ระบบคืนเงินให้ผู้ซื้อ
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                ถ้าผู้ซื้อโอนเงินมา แอดมินจะโอนคืนให้
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
