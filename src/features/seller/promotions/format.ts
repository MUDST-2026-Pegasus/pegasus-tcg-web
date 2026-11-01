export const money = (value: number) => `฿${value.toLocaleString("th-TH")}`;
export const thaiDate = (value: string) => new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
export const maskBuyer = (name: string) => name.length <= 2 ? `${name[0] || ""}*` : `${name[0]}${"*".repeat(Math.min(3, name.length - 2))}${name.at(-1)}`;
