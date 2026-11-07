import { useLanguage } from "@/lib/language";
import { AdminPaymentReviewContent } from "@/features/admin/components/AdminPaymentReviewContent";

export function AdminPaymentsPage() {
  useLanguage();
  return <AdminPaymentReviewContent />;
}
