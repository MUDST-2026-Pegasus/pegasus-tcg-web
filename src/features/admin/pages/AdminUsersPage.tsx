import { ADMIN_USERS_FIXTURE } from "@/features/admin/admin.fixture";
import { AdminUsersContent } from "@/features/admin/components/AdminUsersContent";

export function AdminUsersPage() {
  return <AdminUsersContent data={ADMIN_USERS_FIXTURE} />;
}
