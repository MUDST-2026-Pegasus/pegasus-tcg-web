import { useLanguage } from "@/lib/language";
import { AdminOverviewContent } from "@/features/admin/components/AdminOverviewContent";

export function AdminOverviewPage() {
  useLanguage();
  return <AdminOverviewContent />;
}
