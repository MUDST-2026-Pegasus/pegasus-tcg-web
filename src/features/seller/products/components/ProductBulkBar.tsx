import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("seller");
  const disabled = readOnly || isPending;
  const actions = [
    {
      id: "reprice",
      label: t("products.bulkPrice.title", "แก้ไขราคาพร้อมกัน"),
      count: eligible.reprice,
      onClick: onReprice,
    },
    {
      id: "activate",
      label: t("products.actions.activate", "เปิดขาย"),
      count: eligible.activate,
      onClick: onActivate,
    },
    {
      id: "pause",
      label: t("products.actions.pause", "พักการขาย"),
      count: eligible.pause,
      onClick: onPause,
    },
  ];

  return (
    <div className="flex w-full flex-wrap items-center gap-3 rounded-[10px] bg-[#e6f4f2] px-4 py-3">
      <Checkbox
        checked
        disabled={isPending}
        aria-label={t("products.bulk.clear", "ล้างการเลือก {count} รายการ", { count: selectedCount })}
        onCheckedChange={onClear}
      />
      <p className="text-xs font-medium text-teal-600">
        {t("products.bulk.selected", "เลือกแล้ว {count} รายการ", { count: selectedCount })}
      </p>
      {isPending ? (
        <span className="flex items-center gap-1.5 text-xs text-teal-700">
          <Spinner className="size-3.5" />
          {t("products.bulk.updating", "กำลังอัปเดต…")}
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
