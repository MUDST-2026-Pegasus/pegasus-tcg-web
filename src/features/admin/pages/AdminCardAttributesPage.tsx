import { useLanguage } from "@/lib/language";
import { AdminCardAttributesContent } from "@/features/admin/components/AdminCardAttributesContent";

export function AdminCardAttributesPage() {
  useLanguage();
  return <AdminCardAttributesContent />;
}
