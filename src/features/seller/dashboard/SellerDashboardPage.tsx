import { DashboardContent } from "./components/DashboardContent";
import { getDashboardData } from "./dashboard.api";

export function SellerDashboardPage() {
  return <DashboardContent data={getDashboardData()} />;
}
