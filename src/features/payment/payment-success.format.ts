import { formatDateTime } from "@/lib/i18n";
export function paymentSuccessDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDateTime(date);
}

export function paymentMethodName(method: string | undefined): string {
  switch (method) {
    case "BANK_TRANSFER": return "Bank Transfer";
    case "QR": return "QR";
    case "PROMPTPAY": return "PromptPay";
    case "CARD": return "Card";
    default: return method?.replaceAll("_", " ") || "—";
  }
}
