import { useLanguage } from "@/lib/language";
import { ListingCreateContent } from "./components/create/ListingCreateContent";

export function SellerProductCreatePage() {
  useLanguage();
  return <ListingCreateContent />;
}
