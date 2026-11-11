import { Shield } from "lucide-react";
import React, { Suspense } from "react";
import { useFormat, useLanguage, useTranslate } from "@/lib/i18n";
import { LegalContentSkeleton } from "../components/LegalContentSkeleton";

const PrivacyPolicyTh = React.lazy(() => import("../components/PrivacyPolicy.th"));
const PrivacyPolicyEn = React.lazy(() => import("../components/PrivacyPolicy.en"));

export function PrivacyPolicyPage() {
  const { t } = useTranslate("buyer");
  const { language } = useLanguage();
  const format = useFormat();

  const Content = language === "en" ? PrivacyPolicyEn : PrivacyPolicyTh;

  return (
    <div className="min-h-screen bg-muted/30 pb-16 pt-8">
      <div className="mx-auto max-w-[1100px] px-6 md:px-12">
        {/* Header */}
        <div className="rounded-xl border border-border/50 bg-background p-8 md:p-10 shadow-sm">
          <div className="flex w-fit items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold tracking-wider text-foreground">
            <Shield className="size-4" />
            {t("legal.center", "ศูนย์ข้อมูลกฎหมาย")}
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t("legal.privacy.title", "นโยบายความเป็นส่วนตัว")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("legal.privacy.subtitle", "แนวทางที่ PEGASUS เก็บรวบรวม ใช้ ปกป้อง และเคารพข้อมูลส่วนบุคคลของคุณ")}
          </p>
          <div className="mt-8 text-sm text-muted-foreground">
            {t("legal.lastUpdatedLabel", "อัปเดตล่าสุด")}{" "}
            <span className="font-semibold text-primary">
              {format.date("2026-08-29T12:00:00+07:00", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <Suspense fallback={<LegalContentSkeleton />}>
          <Content />
        </Suspense>
      </div>
    </div>
  );
}
