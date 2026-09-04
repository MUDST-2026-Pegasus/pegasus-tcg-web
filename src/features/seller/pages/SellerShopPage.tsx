import { SellerShopContent } from "@/features/seller/components/SellerShopContent";
import { SELLER_SHOP_FIXTURE } from "@/features/seller/seller.fixture";

export function SellerShopPage() {
  return <SellerShopContent data={SELLER_SHOP_FIXTURE} />;
}
