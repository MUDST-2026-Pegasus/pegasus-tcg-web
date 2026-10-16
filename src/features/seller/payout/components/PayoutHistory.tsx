import { CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Payout } from "@/features/finance/finance.types";
import { formatThaiDateTime, money, payoutDetail, payoutStatuses, PAYOUT_MINIMUM } from "../payout.format";
import { PayoutStatusBadge } from "./PayoutStatusBadge";

type Props = {
  payouts: Payout[] | null;
  filter: string;
  onFilterChange: (filter: string) => void;
  onSelect: (payout: Payout) => void;
};

const statusOptions = [
  { value: "ALL", label: "สถานะ: ทั้งหมด" },
  ...Object.entries(payoutStatuses).map(([value, status]) => ({ value, label: status.label })),
];

export function PayoutHistory({ payouts, filter, onFilterChange, onSelect }: Props) {
  if (!payouts) {
    return <p className="p-8 text-center text-sm text-muted-foreground">ยังโหลดรายการคำขอถอนเงินไม่ได้</p>;
  }

  const paidTotal = payouts
    .filter((payout) => payout.status === "PAID")
    .reduce((sum, payout) => sum + Number(payout.amount), 0);
  const history = filter === "ALL" ? payouts : payouts.filter((payout) => payout.status === filter);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="font-semibold">คำขอถอนเงิน</h2>
          <p className="text-xs text-muted-foreground">{payouts.length} คำขอ · โอนสำเร็จแล้วรวม {money(paidTotal)}</p>
        </div>
        <Select items={statusOptions} value={filter} onValueChange={(next) => {
          if (next !== null) onFilterChange(next);
        }}>
          <SelectTrigger aria-label="สถานะคำขอ" className="h-9 min-w-40 rounded-lg border-input bg-background text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {history.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px] text-left text-sm">
            <thead className="bg-[#f0f3f3] text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3">วันที่ขอ</th>
                <th>เลขที่</th>
                <th>จำนวนเงิน</th>
                <th>สถานะ</th>
                <th>รายละเอียด</th>
                <th className="pr-5"> </th>
              </tr>
            </thead>
            <tbody>
              {history.map((payout) => (
                <tr key={payout.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => onSelect(payout)}>
                  <td className="px-5 py-4">{formatThaiDateTime(payout.requestedAt)}</td>
                  <td>#{payout.id}</td>
                  <td className="font-semibold">{money(payout.amount)}</td>
                  <td><PayoutStatusBadge status={payout.status} /></td>
                  <td className={payout.status === "REJECTED" || payout.status === "FAILED" ? "text-red-700" : ""}>{payoutDetail(payout)}</td>
                  <td className="pr-5"><button type="button" className="text-teal-700 hover:underline" onClick={() => onSelect(payout)}>ดูรายละเอียด ›</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <CardContent className="py-12 text-center">
          <p className="font-semibold">ยังไม่มีคำขอถอนเงิน</p>
          <p className="mt-1 text-sm text-muted-foreground">เมื่อมียอดถอนได้อย่างน้อย {money(PAYOUT_MINIMUM)} คุณสามารถส่งคำขอถอนเงินได้ที่ปุ่มด้านบน</p>
        </CardContent>
      )}
    </>
  );
}
