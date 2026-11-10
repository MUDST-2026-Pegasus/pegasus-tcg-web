import { translate } from "@/lib/i18n";
export const CARRIER_OPTIONS: { value: string; label: string }[] = [
  { value: "KERRY", label: "Kerry Express" },
  { value: "FLASH", label: "Flash Express" },
  { value: "JT", label: "J&T Express" },
  { value: "SPX", label: "SPX Express" },
  { value: "THAILAND_POST_EMS", get label() { return translate("common", "carriers.thailandPostEms", "ไปรษณีย์ไทย EMS"); } },
  { value: "THAILAND_POST", get label() { return translate("common", "carriers.thailandPostRegistered", "ไปรษณีย์ไทย ลงทะเบียน"); } },
];

export function carrierLabel(code: string): string {
  return CARRIER_OPTIONS.find((option) => option.value === code)?.label ?? code;
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "carriers.thailandPostEms", "ns": "common", "defaultValue": "ไปรษณีย์ไทย EMS"}
// @tolgee-key {"key": "carriers.thailandPostRegistered", "ns": "common", "defaultValue": "ไปรษณีย์ไทย ลงทะเบียน"}
