import { useLanguage } from "@/lib/language";
import { ProductsContent } from "./components/ProductsContent";

export function SellerProductsPage() {
  useLanguage();
  return <ProductsContent />;
}
