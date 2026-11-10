import { useParams } from "react-router-dom";

import { AdminSaleFormContent } from "@/features/admin/components/AdminSaleFormContent";

/** `/admin/sales/new` และ `/admin/sales/:id/edit` (TCG-681 · Figma SAL-A2) */
export function AdminSaleFormPage() {
  const id = Number(useParams().id) || 0;
  return <AdminSaleFormContent id={id} />;
}
