import { translate, useLanguage } from "@/lib/language";
import { Link } from "react-router-dom";
import { PanelSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth.queries";
import { useLatestVerification } from "@/features/seller/application/application.queries";
import { SellerApplicationForm } from "@/features/seller/application/components/SellerApplicationForm";
import { getErrorMessage } from "@/lib/api";

export function SellerVerificationPage() {
  useLanguage();
  const { user } = useAuth();
  const verification = useLatestVerification();
  const latest = verification.data;
  const inReview = latest?.status === "SUBMITTED" || latest?.status === "UNDER_REVIEW";

  return <div className="mx-auto max-w-[720px] space-y-6">
    <header><h1 className="text-2xl font-bold">{translate("ยืนยันบัญชีรับเงิน", "Verify payout account")}</h1><p className="mt-1 text-sm text-muted-foreground">{translate("ส่งข้อมูลบัญชีใหม่ให้แอดมินตรวจสอบ เมื่ออนุมัติแล้วบัญชีรับเงินจะเปลี่ยนตามข้อมูลที่ยืนยัน", "Submit new account details for administrator review. Your payout account will change after the details are approved")}</p></header>
    {verification.isPending ? <PanelSkeleton rows={5}/> : verification.isError ? <div role="alert" className="space-y-3 rounded-xl border p-5"><p className="text-sm text-destructive">{getErrorMessage(verification.error, translate("โหลดข้อมูลการยืนยันไม่สำเร็จ", "Unable to load verification details"))}</p><Button variant="outline" onClick={() => void verification.refetch()}>{translate("ลองอีกครั้ง", "Try again")}</Button></div> : inReview ? <div className="space-y-3 rounded-xl border bg-card p-6"><h2 className="font-semibold">{translate("ส่งคำขอแล้ว · รอแอดมินตรวจสอบ", "Request submitted · Awaiting administrator review")}</h2><p className="text-sm text-muted-foreground">{translate("บัญชีที่ใช้อยู่ยังไม่เปลี่ยนจนกว่าคำขอใหม่จะได้รับการอนุมัติ", "Your current account remains unchanged until the new request is approved")}</p><Link className="text-sm text-teal-700 underline" to="/seller/payout">{translate("กลับหน้าถอนเงิน", "Back to withdrawals")}</Link></div> : <SellerApplicationForm userId={user?.id} rejection={latest?.status === "REJECTED" ? latest : undefined} mode="payout-account" returnTo="/seller/payout"/>}
  </div>;
}
