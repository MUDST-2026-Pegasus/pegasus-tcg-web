import { ProductCreateContent } from "./components/create/ProductCreateContent";
import { getProductCreateData } from "./product-create.api";

export function SellerProductCreatePage() {
  return <ProductCreateContent data={getProductCreateData()} />;
}
