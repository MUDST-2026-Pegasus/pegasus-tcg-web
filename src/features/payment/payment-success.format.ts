export function paymentSuccessDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok", month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("month")} ${part("day")}, ${part("year")} ${part("hour")}:${part("minute")}`;
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
