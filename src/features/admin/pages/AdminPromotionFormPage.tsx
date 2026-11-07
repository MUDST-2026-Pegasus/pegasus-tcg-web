import { useLanguage } from "@/lib/language";
import { useParams } from "react-router-dom";

import { AdminPromotionFormContent } from "@/features/admin/components/AdminPromotionFormContent";

/** `/admin/promotions/new` และ `/admin/promotions/:id/edit` */
export function AdminPromotionFormPage() {
  useLanguage();
  const id = Number(useParams().id) || 0;
  return <AdminPromotionFormContent id={id} />;
}
