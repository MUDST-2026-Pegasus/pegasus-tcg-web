import { ADMIN_SELLER_APPROVAL_FIXTURE } from "@/features/admin/admin.fixture";
import { AdminSellerApprovalContent } from "@/features/admin/components/AdminSellerApprovalContent";

export function AdminSellerApprovalPage() {
  return <AdminSellerApprovalContent data={ADMIN_SELLER_APPROVAL_FIXTURE} />;
}
