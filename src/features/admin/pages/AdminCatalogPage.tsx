import { useLanguage } from "@/lib/language";
import { AdminCatalogContent } from "@/features/admin/components/AdminCatalogContent";

export function AdminCatalogPage() {
  useLanguage();
  return <AdminCatalogContent />;
}
