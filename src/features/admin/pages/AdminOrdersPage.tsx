import { ADMIN_ORDERS_FIXTURE } from "@/features/admin/admin.fixture";
import { AdminOrdersContent } from "@/features/admin/components/AdminOrdersContent";

export function AdminOrdersPage() {
  return <AdminOrdersContent data={ADMIN_ORDERS_FIXTURE} />;
}
