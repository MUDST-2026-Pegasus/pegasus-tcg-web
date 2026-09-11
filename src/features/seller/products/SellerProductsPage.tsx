import { ProductsContent } from "./components/ProductsContent";
import { getProductsData } from "./products.api";

export function SellerProductsPage() {
  return <ProductsContent data={getProductsData()} />;
}
