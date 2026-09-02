import { ADMIN_CARD_ATTRIBUTES_FIXTURE } from "@/features/admin/admin.fixture";
import { AdminCardAttributesContent } from "@/features/admin/components/AdminCardAttributesContent";

export function AdminCardAttributesPage() {
  return <AdminCardAttributesContent data={ADMIN_CARD_ATTRIBUTES_FIXTURE} />;
}
