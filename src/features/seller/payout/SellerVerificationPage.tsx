import { Link } from "react-router-dom";
import { PanelSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth.queries";
import { useLatestVerification } from "@/features/seller/application/application.queries";
import { SellerApplicationForm } from "@/features/seller/application/components/SellerApplicationForm";
import { translateError, useTranslate } from "@/lib/i18n";

export function SellerVerificationPage() {
  const { t } = useTranslate("seller");
  const { user } = useAuth();
  const verification = useLatestVerification();
  const latest = verification.data;
  const inReview = latest?.status === "SUBMITTED" || latest?.status === "UNDER_REVIEW";

  return <div className="mx-auto max-w-[720px] space-y-6">
    <header><h1 className="text-2xl font-bold">{t("payout.verification.title", "ยืนยันบัญชีรับเงิน")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("payout.verification.subtitle", "ส่งข้อมูลบัญชีใหม่ให้แอดมินตรวจสอบ เมื่ออนุมัติแล้วบัญชีรับเงินจะเปลี่ยนตามข้อมูลที่ยืนยัน")}</p></header>
    {verification.isPending ? <PanelSkeleton rows={5}/> : verification.isError ? <div role="alert" className="space-y-3 rounded-xl border p-5"><p className="text-sm text-destructive">{translateError(verification.error, t("payout.verification.loadFailed", "โหลดข้อมูลการยืนยันไม่สำเร็จ"))}</p><Button variant="outline" onClick={() => void verification.refetch()}>{t("payout.retry", "ลองอีกครั้ง")}</Button></div> : inReview ? <div className="space-y-3 rounded-xl border bg-card p-6"><h2 className="font-semibold">{t("payout.verification.inReview", "ส่งคำขอแล้ว · รอแอดมินตรวจสอบ")}</h2><p className="text-sm text-muted-foreground">{t("payout.verification.inReviewHint", "บัญชีที่ใช้อยู่ยังไม่เปลี่ยนจนกว่าคำขอใหม่จะได้รับการอนุมัติ")}</p><Link className="text-sm text-teal-700 underline" to="/seller/payout">{t("payout.verification.back", "กลับหน้าถอนเงิน")}</Link></div> : <SellerApplicationForm userId={user?.id} rejection={latest?.status === "REJECTED" ? latest : undefined} mode="payout-account" returnTo="/seller/payout"/>}
  </div>;
}
