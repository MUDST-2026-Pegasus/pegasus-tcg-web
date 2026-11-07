import { useLanguage } from "@/lib/language";
import { AdminUsersContent } from "@/features/admin/components/AdminUsersContent";

export function AdminUsersPage() {
  useLanguage();
  return <AdminUsersContent />;
}
