import { useAuth } from "@/features/auth/auth.queries";
import { toSellerIdentity } from "@/features/seller/shared/seller.format";

import { ShopContent } from "./components/ShopContent";
import { getShopData } from "./shop.api";

export function SellerShopPage() {
  const { user } = useAuth();

  return <ShopContent data={getShopData(toSellerIdentity(user))} />;
}
