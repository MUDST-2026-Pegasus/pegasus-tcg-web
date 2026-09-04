import { SellerDashboardContent } from "@/features/seller/components/SellerDashboardContent";
import { SELLER_DASHBOARD_FIXTURE } from "@/features/seller/seller.fixture";

export function SellerDashboardPage() {
  return <SellerDashboardContent data={SELLER_DASHBOARD_FIXTURE} />;
}
