import { useLanguage } from "@/lib/language";
import { AdminPayoutsContent } from "@/features/admin/components/AdminPayoutsContent";

export function AdminPayoutsPage() {
  useLanguage();
  return <AdminPayoutsContent />;
}
