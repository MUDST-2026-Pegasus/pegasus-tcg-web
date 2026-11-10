import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { formatThaiDateTime } from "../application.format";
import type { Verification } from "../application.types";
import { useTranslate } from "@/lib/i18n";

type StepState = "done" | "current" | "upcoming";

type ProgressStep = {
  title: string;
  description: string;
  state: StepState;
  badge?: string;
};

const MARK_CLASS: Record<StepState, string> = {
  done: "bg-teal-600 text-white",
  current: "bg-orange-100/70 text-amber-700",
  upcoming: "bg-muted text-muted-foreground/75",
};

function useProgressSteps(verification: Verification): ProgressStep[] {
  const { t } = useTranslate("seller");
  const approved = verification.status === "APPROVED";

  return [
    {
      title: t("application.progress.submitted", "ส่งคำขอแล้ว"),
      description: formatThaiDateTime(verification.submittedAt),
      state: "done",
    },
    approved
      ? {
          title: t("application.progress.review", "ตรวจสอบชื่อและบัญชีธนาคาร"),
          description: verification.reviewedAt
            ? t("application.progress.approvedAt", "ผ่านการตรวจสอบ {date}", { date: formatThaiDateTime(verification.reviewedAt) })
            : t("application.progress.approved", "ผ่านการตรวจสอบ"),
          state: "done",
        }
      : {
          title: t("application.progress.review", "ตรวจสอบชื่อและบัญชีธนาคาร"),
          description: t("application.progress.reviewHint", "ปกติใช้เวลาไม่เกิน 1 วันทำการ"),
          state: "current",
          badge: t("application.progress.reviewing", "กำลังตรวจสอบ"),
        },
    {
      title: t("application.progress.open", "เปิดร้านและลงขายได้ทันที"),
      description: approved
        ? t("application.progress.relogin", "ออกจากระบบแล้วเข้าสู่ระบบใหม่ เพื่อเริ่มใช้งานหลังบ้านผู้ขาย")
        : t("application.progress.waiting", "รอผลตรวจสอบ"),
      state: approved ? "current" : "upcoming",
    },
  ];
}

type ApplicationProgressCardProps = {
  id?: string;
  verification: Verification;
};

/** ไล่ขั้นตอนตั้งแต่ส่งคำขอจนเปิดร้านได้ */
export function ApplicationProgressCard({
  id,
  verification,
}: ApplicationProgressCardProps) {
  const { t } = useTranslate("seller");
  const steps = useProgressSteps(verification);
  return (
    <Card
      id={id}
      className="gap-4 rounded-xl border border-border p-5 shadow-none ring-0"
    >
      <h2 className="text-sm font-semibold text-foreground">{t("application.progress.title", "สถานะคำขอ")}</h2>

      <ol className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                MARK_CLASS[step.state],
              )}
            >
              {step.state === "done" ? (
                <Check aria-hidden className="size-3.25" />
              ) : (
                index + 1
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.75">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "text-xs font-medium",
                    step.state === "upcoming"
                      ? "text-muted-foreground/75"
                      : "text-foreground",
                  )}
                >
                  {step.title}
                </p>
                {step.badge && <Badge variant="secondary">{step.badge}</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground/75">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
