export const CARRIER_OPTIONS: { value: string; label: string }[] = [
  { value: "KERRY", label: "Kerry Express" },
  { value: "FLASH", label: "Flash Express" },
  { value: "JT", label: "J&T Express" },
  { value: "SPX", label: "SPX Express" },
  { value: "THAILAND_POST_EMS", label: "ไปรษณีย์ไทย EMS" },
  { value: "THAILAND_POST", label: "ไปรษณีย์ไทย ลงทะเบียน" },
];

export function carrierLabel(code: string): string {
  return CARRIER_OPTIONS.find((option) => option.value === code)?.label ?? code;
}
