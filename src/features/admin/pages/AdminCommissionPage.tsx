import { ADMIN_COMMISSION_FIXTURE } from "@/features/admin/admin.fixture";
import { AdminCommissionContent } from "@/features/admin/components/AdminCommissionContent";

export function AdminCommissionPage() {
  return <AdminCommissionContent data={ADMIN_COMMISSION_FIXTURE} />;
}
