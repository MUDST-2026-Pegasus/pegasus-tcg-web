import { translate, useLanguage } from "@/lib/language";
import { RefreshCw, Zap } from "lucide-react";

import { formatSaleBaht } from "@/components/sale";
import { Button } from "@/components/ui/button";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";

/**
 * Figma SAL-M1 (Buyer INFO) "ราคา Flash Sale เต็มแล้ว" — checkout ได้ `SALE_QUOTA_REACHED`
 * นำออก หรือซื้อต่อที่ราคาปกติ
 */
export function SaleQuotaDialog({
  open,
  productName,
  salePrice,
  listPrice,
  pending,
  onRemove,
  onBuyAtListPrice,
  onClose,
}: {
  open: boolean;
  productName: string;
  salePrice: number | null;
  listPrice: number | null;
  pending?: boolean;
  onRemove: () => void;
  onBuyAtListPrice: () => void;
  onClose: () => void;
}) {
  useLanguage();
  return (
    <PromotionDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      tone="warning"
      icon={<Zap />}
      title={translate("ราคา Flash Sale เต็มแล้ว", "Flash sale quota reached")}
      description={translate(`โควตาราคา${salePrice != null ? ` ${formatSaleBaht(salePrice)}` : ""} ของ ${productName} ถูกซื้อครบแล้ว · ซื้อต่อได้ที่ราคาปกติ${listPrice != null ? ` ${formatSaleBaht(listPrice)}` : ""}`, `The discounted quota${salePrice != null ? ` at ${formatSaleBaht(salePrice)}` : ""} for ${productName} has sold out · You can buy at the regular price${listPrice != null ? ` ${formatSaleBaht(listPrice)}` : ""}`)}
      actions={
        <>
          <Button variant="outline" disabled={pending} onClick={onRemove}>{translate("นำออก", "Remove")}</Button>
          <Button disabled={pending} onClick={onBuyAtListPrice}>{translate("ซื้อราคาปกติ", "Buy at regular price")}</Button>
        </>
      }
    />
  );
}

/**
 * Figma SAL-M1 (Buyer WARNING) "ราคาสินค้าบางรายการเปลี่ยน" — `CART_PRICE_CHANGED` / `priceChanged` (TCG-513)
 * ราคาลดจบระหว่างที่สินค้าอยู่ในตะกร้า
 */
export function CartPriceChangedDialog({
  open,
  items,
  newTotal,
  pending,
  onRemove,
  onAccept,
  onClose,
}: {
  open: boolean;
  items: Array<{ id: number; name: string; from: number; to: number | null }>;
  newTotal: number;
  pending?: boolean;
  onRemove: () => void;
  onAccept: () => void;
  onClose: () => void;
}) {
  useLanguage();
  return (
    <PromotionDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      tone="warning"
      icon={<RefreshCw />}
      title={translate("ราคาสินค้าบางรายการเปลี่ยน", "Some item prices have changed")}
      description={translate("ราคาลดจบแล้วระหว่างที่สินค้าอยู่ในตะกร้า", "The sale ended while the item was in your cart")}
      actions={
        <>
          <Button variant="outline" disabled={pending} onClick={onRemove}>{translate("นำออกจากตะกร้า", "Remove from cart")}</Button>
          <Button disabled={pending} onClick={onAccept}>{translate("ยืนยันราคาใหม่", "Confirm new prices")}</Button>
        </>
      }
    >
      <dl className="grid gap-1.5 rounded-md bg-muted px-3.5 py-2.5 text-xs [&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&_dt]:text-muted-foreground [&_dd]:font-semibold">
        {items.map((item) => (
          <div key={item.id}>
            <dt className="truncate">{item.name}</dt>
            <dd>
              {formatSaleBaht(item.from)} → {item.to == null ? translate("ไม่พร้อมจำหน่าย", "Unavailable") : formatSaleBaht(item.to)}
            </dd>
          </div>
        ))}
        <div className="border-t pt-1.5">
          <dt>{translate("ยอดรวมใหม่", "New total")}</dt>
          <dd>{formatSaleBaht(newTotal)}</dd>
        </div>
      </dl>
    </PromotionDialog>
  );
}
