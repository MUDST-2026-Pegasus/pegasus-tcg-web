import { useParams } from "react-router-dom";

import { SellerSaleFormContent } from "./components/SellerSaleFormContent";

/** `/seller/sales/new` และ `/seller/sales/:id/edit` (TCG-682 · Figma SAL-S2) */
export function SellerSaleFormPage() {
  const id = Number(useParams().id) || 0;
  return <SellerSaleFormContent id={id} />;
}
