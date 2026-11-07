import { useLanguage } from "@/lib/language";
import { AdminRefundsContent } from "@/features/admin/components/AdminRefundsContent";

export function AdminRefundsPage() {
  useLanguage();
  return <AdminRefundsContent />;
}
