/**
 * Order status mappings and human-readable formatters for the buyer account portal.
 */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  PREPARING: "Processing",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  CANCELED: "Cancelled",
};

/**
 * Converts a SNAKE_CASE string (e.g., "RETURN_REQUESTED") to Title Case ("Return Requested").
 */
export function snakeCaseToTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats backend order and package status enums into clean, human-readable text.
 *
 * Mappings:
 * - PENDING_PAYMENT -> "Pending Payment"
 * - PAID -> "Paid"
 * - PREPARING / PROCESSING -> "Processing"
 * - SHIPPED -> "Shipped"
 * - DELIVERED -> "Delivered"
 * - COMPLETED -> "Completed"
 * - CANCELLED -> "Cancelled"
 * - Fallback: converts SNAKE_CASE to Title Case (e.g. RETURN_REQUESTED -> Return Requested)
 */
export function formatOrderStatus(status?: string | null): string {
  if (!status) return "";
  const upper = status.trim().toUpperCase();

  if (ORDER_STATUS_LABELS[upper]) {
    return ORDER_STATUS_LABELS[upper];
  }

  return snakeCaseToTitleCase(upper);
}

export type OrderStatusBadgeConfig = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
};

/**
 * Returns badge variant, styling classes, and human-readable label for an order or package status.
 */
export function getOrderStatusBadge(status?: string | null): OrderStatusBadgeConfig {
  const label = formatOrderStatus(status);
  const upper = (status ?? "").trim().toUpperCase();

  switch (upper) {
    case "PENDING_PAYMENT":
      return {
        label,
        variant: "secondary",
        className: "bg-amber-500 text-white hover:bg-amber-600 border-transparent",
      };
    case "PAID":
    case "PREPARING":
    case "PROCESSING":
      return {
        label,
        variant: "secondary",
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent",
      };
    case "SHIPPED":
      return {
        label,
        variant: "secondary",
        className: "bg-purple-100 text-purple-800 hover:bg-purple-100 border-transparent",
      };
    case "DELIVERED":
    case "COMPLETED":
      return {
        label,
        variant: "secondary",
        className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent",
      };
    case "CANCELLED":
    case "CANCELED":
      return {
        label,
        variant: "outline",
        className: "text-muted-foreground",
      };
    default:
      return {
        label,
        variant: "outline",
        className: "text-muted-foreground",
      };
  }
}
