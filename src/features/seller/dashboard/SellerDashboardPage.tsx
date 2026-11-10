import { QueryBoundary } from "@/components/common";
import { useAuth } from "@/features/auth/auth.queries";
import { toSellerIdentity } from "@/features/seller/shared/seller.format";

import { DashboardContent } from "./components/DashboardContent";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { toDashboardData } from "./dashboard.format";
import { useSellerDashboard } from "./dashboard.queries";
import { useTranslate } from "@/lib/i18n";

export function SellerDashboardPage() {
  const { t } = useTranslate("seller");
  const { user } = useAuth();
  const seller = toSellerIdentity(user);
  const dashboard = useSellerDashboard();

  return (
    <QueryBoundary
      query={dashboard}
      loading={<DashboardSkeleton />}
      errorTitle={t("dashboard.loadFailed", "โหลดแดชบอร์ดไม่สำเร็จ")}
    >
      {(data) => <DashboardContent data={toDashboardData(data, seller)} />}
    </QueryBoundary>
  );
}
