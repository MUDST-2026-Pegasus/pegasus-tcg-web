import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { authKeys, useAuth } from "@/features/auth/auth.queries";
import { cn } from "@/lib/utils";

import { useLatestVerification } from "./application.queries";
import { ApplicationStatusView } from "./components/ApplicationStatusView";
import { SellerApplicationForm } from "./components/SellerApplicationForm";

/**
 * สมัครเป็นผู้ขาย — Figma: V3 · Buyer / สมัครเป็นผู้ขาย (ฉบับย่อ) node 1689:6494
 * ส่งแล้วสลับเป็นหน้าสถานะคำขอ node 1689:6622
 *
 * คนเปิดหน้านี้ยังเป็นผู้ซื้อ route จึงอยู่ใน public.routes (PublicLayout)
 * ไม่ได้อยู่ใต้ /seller ที่บังคับบทบาท SELLER
 */
export function SellerApplicationPage() {
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();
  const {
    data: latest,
    isPending,
    isFetching,
    refetch,
  } = useLatestVerification();

  const isSeller = hasRole("SELLER");
  const isApproved = latest?.status === "APPROVED";

  useEffect(() => {
    // แอดมินอนุมัติแล้ว แต่ `/auth/me` ใน cache ยังเป็นของก่อนได้ role
    // ดึงใหม่ให้ได้ SELLER แล้ว redirect ข้างล่างพาเข้าหลังบ้านเอง ไม่ต้อง logout/login
    if (isApproved && !isSeller) {
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    }
  }, [isApproved, isSeller, queryClient]);

  if (isSeller) {
    return <Navigate to="/seller" replace />;
  }

  // ถูกปฏิเสธแล้วส่งใหม่ได้ ที่เหลือยังค้างอยู่หรืออนุมัติแล้ว
  const submitted = latest && latest.status !== "REJECTED" ? latest : null;

  return (
    <div className="bg-muted/70 px-4">
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-4.5 pb-14",
          submitted ? "max-w-155 pt-10" : "max-w-180 pt-8",
        )}
      >
        {isPending ? (
          <div className="flex min-h-[40svh] items-center justify-center">
            <Spinner className="size-8 text-muted-foreground" />
          </div>
        ) : submitted ? (
          <ApplicationStatusView
            verification={submitted}
            isRefreshing={isFetching}
            onRefresh={() => void refetch()}
          />
        ) : (
          <>
            <header className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[26px] font-bold text-foreground">
                  สมัครเป็นผู้ขาย
                </h1>
                <Badge variant="secondary">ใช้เวลาไม่ถึง 2 นาที</Badge>
              </div>
              <p className="text-[13px] text-muted-foreground">
                กรอกแค่ชื่อจริงและบัญชีรับเงิน แล้วรอทีมงานตรวจสอบภายใน 1
                วันทำการ
              </p>
            </header>
            <SellerApplicationForm
              userId={user?.id}
              rejection={latest ?? undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
