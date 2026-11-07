import { translate, useLanguage } from "@/lib/language";
import type { ReactNode } from "react";
import { ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CONDITION_LABELS } from "@/features/catalog/catalog.mappers";
import type { CardCondition } from "@/features/catalog/catalog.types";
import { PriceTag, isOnSale } from "@/components/sale";
import { saleEndedInCart } from "@/features/sale/sale.cart";
import { checkoutMoney } from "../checkout.format";
import type { CartItemResponse } from "../cart.types";

export interface CartSellerGroupProps {
  sellerName: string;
  sellerUsername?: string | null;
  items: CartItemResponse[];
  selectedIds: Set<number>;
  onToggleItem(id: number): void;
  onToggleSeller(checked: boolean): void;
  onQuantity(id: number, quantity: number): void;
  onRemove(id: number): void;
  quantityBusy?: boolean;
  removeBusy?: boolean;
  /** "โค้ดร้าน" row, only while something from this shop is ticked. */
  codeSlot?: ReactNode;
  /** After the shop's code. */
  subtotal: number;
}

function initials(name: string) {
  const words = name.trim().split(/[\s_.-]+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

/** C1: one shop's items with a whole-shop checkbox, its code row and "รวมร้านนี้". */
export function CartSellerGroup({
  sellerName,
  sellerUsername,
  items,
  selectedIds,
  onToggleItem,
  onToggleSeller,
  onQuantity,
  onRemove,
  quantityBusy = false,
  removeBusy = false,
  codeSlot,
  subtotal,
}: CartSellerGroupProps) {
  useLanguage();
  const checkedCount = items.filter((item) => selectedIds.has(item.id)).length;
  const allChecked = checkedCount === items.length;

  return (
    <Card className="gap-0 rounded-xl p-0 shadow-none">
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <Checkbox
          aria-label={translate(`เลือกทั้งร้าน ${sellerName}`, `Select all from ${sellerName}`)}
          checked={allChecked}
          indeterminate={checkedCount > 0 && !allChecked}
          onCheckedChange={(checked) => onToggleSeller(checked === true)}
        />
        <span className="flex size-7 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white" aria-hidden>
          {initials(sellerName)}
        </span>
        {sellerUsername ? (
          <Link to={`/u/${encodeURIComponent(sellerUsername)}`}
            className="flex items-center gap-1 text-sm font-semibold text-foreground hover:underline focus-visible:underline">
            {sellerName} <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </Link>
        ) : (
          <span className="text-sm font-semibold text-foreground">{sellerName}</span>
        )}
      </div>

      <ul className="flex flex-col">
        {items.map((item) => {
          const name = item.productName || translate(`ประกาศ #${item.listingId}`, `Listing #${item.listingId}`);
          const price = item.currentPrice ?? item.unitPriceAtAdd;
          const condition = item.condition
            ? CONDITION_LABELS[item.condition as CardCondition] ?? item.condition
            : null;
          return (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              <Checkbox
                aria-label={translate(`เลือก ${name}`, `Select ${name}`)}
                checked={selectedIds.has(item.id)}
                onCheckedChange={() => onToggleItem(item.id)}
              />
              <div className="flex h-16 w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {item.imageUrl && <img src={item.imageUrl} alt={name} className="size-full object-contain" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-foreground">{name}</h3>
                <p className="truncate text-xs text-muted-foreground">
                  {[item.variantLabel, condition].filter(Boolean).join(" · ")}
                </p>
                {isOnSale(item.pricing) && !item.priceChanged && (
                  <p className="mt-0.5 text-[11px] font-medium text-[#dc2626]">
                    {item.pricing.sale.name} −{item.pricing.discountPercent}%
                  </p>
                )}
                {item.priceChanged && (
                  <p className="mt-1 w-fit rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                    {saleEndedInCart(item)
                      ? translate(`⚠ ราคาลดจบแล้ว ราคากลับเป็น ${checkoutMoney(item.currentPrice ?? 0)} (เดิม ${checkoutMoney(item.unitPriceAtAdd)}) · กด "ยอมรับราคาใหม่" ก่อนไปต่อ`, `⚠ The sale ended. The price is now ${checkoutMoney(item.currentPrice ?? 0)} (was ${checkoutMoney(item.unitPriceAtAdd)}). Accept the new price before continuing`)
                      : <>{translate("ราคาเปลี่ยน:", "Price changed:")} {checkoutMoney(item.unitPriceAtAdd)} → {item.currentPrice == null ? translate("ไม่พร้อมจำหน่าย", "Unavailable") : checkoutMoney(item.currentPrice)}</>}
                  </p>
                )}
                {!item.purchasable && (
                  <p className="mt-1 w-fit rounded-md border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                    {translate("สินค้านี้ไม่พร้อมจำหน่ายแล้ว", "This item is no longer available")}</p>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-full border px-2 py-0.5">
                <button type="button" aria-label={translate(`ลดจำนวน ${name}`, `Decrease quantity of ${name}`)}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                  disabled={item.quantity <= 1 || quantityBusy}
                  onClick={() => onQuantity(item.id, item.quantity - 1)}>
                  <Minus className="size-3" />
                </button>
                <span className="w-4 text-center text-xs font-medium" aria-label={translate(`จำนวน ${name}`, `Quantity of ${name}`)}>{item.quantity}</span>
                <button type="button" aria-label={translate(`เพิ่มจำนวน ${name}`, `Increase quantity of ${name}`)}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                  disabled={(item.quantityAvailable !== null && item.quantity >= item.quantityAvailable) || quantityBusy}
                  onClick={() => onQuantity(item.id, item.quantity + 1)}>
                  <Plus className="size-3" />
                </button>
              </div>
              {isOnSale(item.pricing) && !item.priceChanged ? (
                <PriceTag pricing={item.pricing} size="sm" showBadge={false} className="w-20 items-end text-right" />
              ) : (
                <strong className="w-20 text-right text-sm font-semibold">{checkoutMoney(price)}</strong>
              )}
              <Button type="button" variant="ghost" size="icon-xs" aria-label={translate(`ลบ ${name}`, `Remove ${name}`)}
                disabled={removeBusy} onClick={() => onRemove(item.id)}
                className="text-muted-foreground hover:text-destructive">
                <Trash2 />
              </Button>
            </li>
          );
        })}
      </ul>

      {codeSlot && <div className="px-5 pt-1 pb-2">{codeSlot}</div>}

      <div className="flex items-center justify-between px-5 pt-2 pb-5">
        <span className="text-xs text-muted-foreground">{translate("รวมร้านนี้", "Shop total")}</span>
        <strong className="text-base font-bold">{checkoutMoney(subtotal)}</strong>
      </div>
    </Card>
  );
}
