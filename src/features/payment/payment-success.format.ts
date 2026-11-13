import { formatDateTime, translate } from "@/lib/i18n";

// @tolgee-key {"key":"payment.method.bankTransfer","ns":"buyer","defaultValue":"โอนผ่านธนาคาร"}
// @tolgee-key {"key":"payment.method.card","ns":"buyer","defaultValue":"บัตร"}

export function paymentSuccessDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDateTime(date);
}

export function paymentMethodName(method: string | undefined): string {
  switch (method) {
    case "BANK_TRANSFER": return translate("buyer", "payment.method.bankTransfer", "โอนผ่านธนาคาร");
    case "QR": return "QR";
    case "PROMPTPAY": return "PromptPay";
    case "CARD": return translate("buyer", "payment.method.card", "บัตร");
    default: return method?.replaceAll("_", " ") || "—";
  }
}
