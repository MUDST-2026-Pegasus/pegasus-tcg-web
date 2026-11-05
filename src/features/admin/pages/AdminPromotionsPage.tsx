import { AdminPromotionsContent } from "@/features/admin/components/AdminPromotionsContent";
import { AdminSalesContent } from "@/features/admin/components/AdminSalesContent";
import { usePromotionPageTab } from "@/features/admin/sales.queries";

/** `/admin/promotions` — แท็บ "โค้ดส่วนลด" และ "ลดราคาสินค้า" (`?tab=sales`, TCG-681) */
export function AdminPromotionsPage() {
  const tab = usePromotionPageTab();
  return tab === "sales" ? <AdminSalesContent /> : <AdminPromotionsContent />;
}
