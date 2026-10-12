import { OrdersContent } from "./components/OrdersContent";
import { getOrdersData } from "./orders.api";

export function SellerOrdersPage() {
  return <OrdersContent data={getOrdersData()} />;
}
