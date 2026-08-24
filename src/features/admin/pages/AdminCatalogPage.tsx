import { ADMIN_CATALOG_FIXTURE } from "@/features/admin/admin.fixture";
import { AdminCatalogContent } from "@/features/admin/components/AdminCatalogContent";

export function AdminCatalogPage() {
  return <AdminCatalogContent data={ADMIN_CATALOG_FIXTURE} />;
}
