import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";

type ProductBulkBarProps = {
  selectedCount: number;
  /** จำนวนใบที่แต่ละปุ่มจะทำได้จริง — 0 = ปุ่มนั้นกดไม่ได้ */
  eligible: { reprice: number; activate: number; pause: number };
  /** ร้านยังแก้ประกาศไม่ได้ (`canPublish = false`) */
  readOnly: boolean;
  isPending: boolean;
  onClear: () => void;
  onReprice: () => void;
  onActivate: () => void;
  onPause: () => void;
};

/**
 * แถบสีเขียวที่โผล่มาเมื่อมีสินค้าถูกเลือก — กดติ๊กออกเพื่อล้างการเลือกทั้งหมด
 *
 * "เติมสต็อก" จากดีไซน์ยังไม่มี เพราะการรับของเข้าต้องกรอกต้นทุนทีละล็อต (SLR-04)
 */
export function ProductBulkBar({
  selectedCount,
  eligible,
  readOnly,
  isPending,
  onClear,
  onReprice,
  onActivate,
  onPause,
}: ProductBulkBarProps) {
  const disabled = readOnly || isPending;
  const actions = [
    {
      id: "reprice",
      label: "แก้ไขราคาพร้อมกัน",
      count: eligible.reprice,
      onClick: onReprice,
    },
    {
      id: "activate",
      label: "เปิดขาย",
      count: eligible.activate,
      onClick: onActivate,
    },
    {
      id: "pause",
      label: "พักการขาย",
      count: eligible.pause,
      onClick: onPause,
    },
  ];

  return (
    <div className="flex w-full flex-wrap items-center gap-3 rounded-[10px] bg-[#e6f4f2] px-4 py-3">
      <Checkbox
        checked
        disabled={isPending}
        aria-label={`ล้างการเลือก ${selectedCount} รายการ`}
        onCheckedChange={onClear}
      />
      <p className="text-xs font-medium text-teal-600">
        เลือกแล้ว {selectedCount} รายการ
      </p>
      {isPending ? (
        <span className="flex items-center gap-1.5 text-xs text-teal-700">
          <Spinner className="size-3.5" />
          กำลังอัปเดต…
        </span>
      ) : null}

      <div className="flex-1" />

      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          className="rounded-md px-2.5"
          disabled={disabled || action.count === 0}
          onClick={action.onClick}
        >
          {action.label}
          {action.count > 0 && action.count < selectedCount
            ? ` (${action.count})`
            : ""}
        </Button>
      ))}
    </div>
  );
}
