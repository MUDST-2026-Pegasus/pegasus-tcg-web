import { useLanguage } from "@/lib/language";
import { AdminSellerApprovalContent } from "@/features/admin/components/AdminSellerApprovalContent";

export function AdminSellerApprovalPage() {
  useLanguage();
  return <AdminSellerApprovalContent />;
}
