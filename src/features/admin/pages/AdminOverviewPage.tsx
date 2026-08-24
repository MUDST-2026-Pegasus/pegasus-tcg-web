import { ADMIN_OVERVIEW_FIXTURE } from "@/features/admin/admin.fixture";
import { AdminOverviewContent } from "@/features/admin/components/AdminOverviewContent";

export function AdminOverviewPage() {
  return <AdminOverviewContent data={ADMIN_OVERVIEW_FIXTURE} />;
}
