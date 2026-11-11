import { Copy, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

import type { SellerReturnRequest } from "../../after-sales.types";
import { useTranslate } from "@/lib/i18n";

/**
 * IN_TRANSIT card body: buyer's return tracking, restock toggle, confirm receipt.
 */
export function ReturnInTransitBox({
  item,
  restock,
  isBusy,
  onRestockChange,
  onReceive,
}: {
  item: SellerReturnRequest;
  restock: boolean;
  isBusy: boolean;
  onRestockChange: (restock: boolean) => void;
  onReceive: () => void;
}) {
  const { t } = useTranslate("seller");

  function handleCopyTracking(tracking: string) {
    void navigator.clipboard.writeText(tracking);
    toast.add({
      type: "success",
      title: t("sellerReturns.inTransit.toastCopied", "คัดลอกเลขพัสดุแล้ว"),
      description: tracking,
    });
  }

  const expectedCards =
    item.items?.map((i) => `${i.cardName} ×${i.quantityReturned}`).join(", ") ||
    t("sellerReturns.inTransit.defaultReturnedCards", "การ์ดที่ส่งคืน");

  return (
    <div className="space-y-4">
      {/* Tracking Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card border border-border text-foreground shadow-2xs">
            <Package className="size-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-muted-foreground">
              {t("sellerReturns.inTransit.title", "เลขพัสดุส่งคืนจากผู้ซื้อ")}
            </div>
            <div className="text-xs sm:text-sm font-bold text-foreground">
              {item.returnTrackingNumber ?? t("sellerReturns.inTransit.noTracking", "ไม่มีเลขพัสดุ")}
              <span className="font-normal text-muted-foreground ml-2">
                {t("sellerReturns.inTransit.expectedItemsPrefix", "· ของที่ต้องได้รับ: ")}
                {expectedCards}
              </span>
            </div>
          </div>
        </div>
        {item.returnTrackingNumber && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyTracking(item.returnTrackingNumber!)}
            className="self-start sm:self-auto text-xs"
          >
            <Copy className="size-3.5 mr-1.5" />
            {t("sellerReturns.inTransit.copyButton", "คัดลอก")}
          </Button>
        )}
      </div>

      {/* Restock Toggle & Confirm Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-start gap-3">
          <Switch
            id={`restock-${item.id}`}
            checked={restock}
            onCheckedChange={onRestockChange}
          />
          <div className="space-y-0.5">
            <label
              htmlFor={`restock-${item.id}`}
              className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer"
            >
              {t("sellerReturns.inTransit.restockLabel", "นำการ์ดกลับเข้าสต็อก")}
            </label>
            <p className="text-[11px] text-muted-foreground">
              {t("sellerReturns.inTransit.restockDesc", "ได้รับทุกใบในสภาพดี · ปิดไว้ถ้าการ์ดเสียหายจนขายต่อไม่ได้")}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          disabled={isBusy}
          onClick={onReceive}
          className="text-xs font-semibold px-4 shadow-xs self-end sm:self-auto"
        >
          {t("sellerReturns.inTransit.confirmReceiptButton", "ยืนยันได้รับสินค้าคืน")}
        </Button>
      </div>
    </div>
  );
}
