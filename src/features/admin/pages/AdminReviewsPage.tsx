import { useLanguage } from "@/lib/language";
import { AdminReviewsContent } from "@/features/admin/components/AdminReviewsContent";

export function AdminReviewsPage() {
  useLanguage();
  return <AdminReviewsContent />;
}
