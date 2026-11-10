import { RefreshCw, Zap } from "lucide-react";

import { formatSaleBaht } from "@/components/sale";
import { Button } from "@/components/ui/button";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("sale");
  return (
    <PromotionDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      tone="warning"
      icon={<Zap />}
      title={t("quota.title", "ราคา Flash Sale เต็มแล้ว")}
      description={t("quota.description", "โควตาราคา{salePrice} ของ {name} ถูกซื้อครบแล้ว · ซื้อต่อได้ที่ราคาปกติ{listPrice}", { salePrice: salePrice != null ? ` ${formatSaleBaht(salePrice)}` : "", name: productName, listPrice: listPrice != null ? ` ${formatSaleBaht(listPrice)}` : "" })}
      actions={
        <>
          <Button variant="outline" disabled={pending} onClick={onRemove}>
            {t("quota.remove", "นำออก")}
          </Button>
          <Button disabled={pending} onClick={onBuyAtListPrice}>
            {t("quota.buyAtList", "ซื้อราคาปกติ")}
          </Button>
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
  const { t } = useTranslate("sale");
  return (
    <PromotionDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      tone="warning"
      icon={<RefreshCw />}
      title={t("priceChanged.title", "ราคาสินค้าบางรายการเปลี่ยน")}
      description={t("priceChanged.description", "ราคาลดจบแล้วระหว่างที่สินค้าอยู่ในตะกร้า")}
      actions={
        <>
          <Button variant="outline" disabled={pending} onClick={onRemove}>
            {t("priceChanged.remove", "นำออกจากตะกร้า")}
          </Button>
          <Button disabled={pending} onClick={onAccept}>
            {t("priceChanged.accept", "ยืนยันราคาใหม่")}
          </Button>
        </>
      }
    >
      <dl className="grid gap-1.5 rounded-md bg-muted px-3.5 py-2.5 text-xs [&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&_dt]:text-muted-foreground [&_dd]:font-semibold">
        {items.map((item) => (
          <div key={item.id}>
            <dt className="truncate">{item.name}</dt>
            <dd>
              {formatSaleBaht(item.from)} → {item.to == null ? t("priceChanged.unavailable", "ไม่พร้อมจำหน่าย") : formatSaleBaht(item.to)}
            </dd>
          </div>
        ))}
        <div className="border-t pt-1.5">
          <dt>{t("priceChanged.newTotal", "ยอดรวมใหม่")}</dt>
          <dd>{formatSaleBaht(newTotal)}</dd>
        </div>
      </dl>
    </PromotionDialog>
  );
}
