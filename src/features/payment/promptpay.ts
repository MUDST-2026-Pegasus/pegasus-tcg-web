function field(tag: string, value: string) {
  return `${tag}${String(value.length).padStart(2, "0")}${value}`;
}

/** Fixed-amount Thai PromptPay merchant-presented payload. */
export function buildPromptPayPayload(promptPayId: string, amount: number): string {
  const id = promptPayId.trim().replace(/[-\s]/g, "");
  const phone = /^0[689]\d{8}$/.test(id);
  if (!phone && !/^\d{13}$/.test(id)) {
    throw new Error("Invalid PromptPay ID");
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9999999999.99 || amount.toFixed(2) === "0.00") {
    throw new Error("Invalid payment amount");
  }
  const merchant = field("00", "A000000677010111") +
    field(phone ? "01" : "02", phone ? `0066${id.slice(1)}` : id);
  const payload = field("00", "01") + field("01", "12") + field("29", merchant) +
    field("53", "764") + field("54", amount.toFixed(2)) + field("58", "TH") + "6304";
  let crc = 0xffff;
  for (const character of payload) {
    crc ^= character.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, "0");
}
