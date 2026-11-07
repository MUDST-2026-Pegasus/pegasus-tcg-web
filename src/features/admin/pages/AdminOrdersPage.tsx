import { useLanguage } from "@/lib/language";
import { AdminOrdersContent } from "@/features/admin/components/AdminOrdersContent";

export function AdminOrdersPage() {
  useLanguage();
  return <AdminOrdersContent />;
}
