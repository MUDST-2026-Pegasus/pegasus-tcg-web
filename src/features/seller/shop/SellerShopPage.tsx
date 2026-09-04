import { ShopContent } from "./components/ShopContent";
import { getShopData } from "./shop.api";

export function SellerShopPage() {
  return <ShopContent data={getShopData()} />;
}
