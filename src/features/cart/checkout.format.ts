export const checkoutMoney = (value: number) =>
  `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
