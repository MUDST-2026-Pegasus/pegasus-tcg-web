import { translate, useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import type { Payout, Wallet } from "@/features/finance/finance.types";
import { formatThaiDateTime, money, walletEntryLabel } from "../payout.format";

type Props = {
  wallet: Wallet | null;
  payouts: Payout[];
  page: number;
  pageSize: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onSelect: (payout: Payout) => void;
};

export function WalletLedger({ wallet, payouts, page, pageSize, isFetching, onPageChange, onSelect }: Props) {
  useLanguage();
  if (!wallet) {
    return <p className="p-8 text-center text-sm text-muted-foreground">{translate("ยังโหลดรายการเคลื่อนไหวกระเป๋าไม่ได้", "Unable to load wallet transactions")}</p>;
  }

  const { items, totalItems } = wallet.entries;
  const start = totalItems ? page * pageSize + 1 : 0;
  const end = Math.min((page + 1) * pageSize, totalItems);

  return (
    <>
      <div className="px-5 py-4">
        <h2 className="font-semibold">{translate("รายการเคลื่อนไหวกระเป๋า", "Wallet transactions")}</h2>
        <p className="text-xs text-muted-foreground">{translate("ทุกการเปลี่ยนแปลงยอดในกระเป๋า เรียงล่าสุดก่อน · ยอดที่ขอถอนจะขึ้นที่นี่เมื่อโอนสำเร็จเท่านั้น", "All wallet balance changes, newest first. Withdrawal requests appear here only after a successful transfer")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-3">{translate("วันที่", "Date")}</th>
              <th>{translate("รายการ", "Items")}</th>
              <th>{translate("อ้างอิง", "Reference")}</th>
              <th className="text-right">{translate("จำนวน", "Quantity")}</th>
              <th className="pr-5 text-right">{translate("คงเหลือ", "Remaining")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((entry) => {
              const linked = entry.referenceType === "PAYOUT"
                ? payouts.find((payout) => payout.id === entry.referenceId)
                : null;
              return (
                <tr key={entry.id} className="border-t">
                  <td className="px-5 py-4">{formatThaiDateTime(entry.createdAt)}</td>
                  <td className="font-medium">{walletEntryLabel(entry.type)}</td>
                  <td>
                    {linked ? (
                      <button type="button" className="text-teal-700 hover:underline" onClick={() => onSelect(linked)}>
                        {translate("คำขอถอน #", "Withdrawal request #")}{linked.id}
                      </button>
                    ) : entry.referenceId ? `${entry.referenceType ?? translate("รายการ", "Items")} #${entry.referenceId}` : "—"}
                  </td>
                  <td className={`text-right font-semibold ${entry.direction === "CREDIT" ? "text-emerald-700" : "text-destructive"}`}>
                    {entry.direction === "CREDIT" ? "+" : "−"}{money(entry.amount)}
                  </td>
                  <td className="pr-5 text-right text-muted-foreground">{money(entry.balanceAfter)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!items.length && <p className="p-8 text-center text-sm text-muted-foreground">{translate("ยังไม่มีรายการเคลื่อนไหว", "No transactions yet")}</p>}
      </div>
      <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
        <p aria-live="polite">{isFetching ? translate("กำลังโหลดรายการ...", "Loading items…") : `แสดง ${start}–${end} จาก ${totalItems} รายการ`}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isFetching || page === 0} onClick={() => onPageChange(page - 1)}>{translate("ก่อนหน้า", "Previous")}</Button>
          <Button variant="outline" size="sm" disabled={isFetching || (page + 1) * pageSize >= totalItems} onClick={() => onPageChange(page + 1)}>{translate("ถัดไป", "Next")}</Button>
        </div>
      </div>
    </>
  );
}
