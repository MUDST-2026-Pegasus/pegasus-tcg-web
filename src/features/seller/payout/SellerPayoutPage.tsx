import { PayoutContent } from "./components/PayoutContent";
import { getPayoutData } from "./payout.api";

export function SellerPayoutPage() {
  return <PayoutContent data={getPayoutData()} />;
}
