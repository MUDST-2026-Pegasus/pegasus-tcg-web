import { useAuth } from "@/features/auth/auth.queries";
import { toSellerIdentity } from "@/features/seller/shared/seller.format";

import { DashboardContent } from "./components/DashboardContent";
import { getDashboardData } from "./dashboard.api";

export function SellerDashboardPage() {
  const { user } = useAuth();
  const seller = toSellerIdentity(user);

  return <DashboardContent data={getDashboardData(seller.displayName)} />;
}
