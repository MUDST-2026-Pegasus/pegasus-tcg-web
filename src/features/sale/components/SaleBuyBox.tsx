import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Minus, Plus } from "lucide-react";

import {
  PriceTag,
  formatCountdown,
  formatSaleBaht,
  isOnSale,
  priceTagState,
  quotaProgress,
  savingPerUnit,
  useCountdown,
} from "@/components/sale";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAddCartItem } from "@/features/cart/cart.queries";
import { addToCartErrorMessage } from "@/features/cart/cart.format";
import type { PublicListingDto } from "@/features/catalog/catalog.types";
import { cn } from "@/lib/utils";

import { notifyAddedAtSalePrice } from "../sale.notify";
import { untilLabel } from "../sale.format";

/**
 * Buy box ของหน้า listing (Figma SAL-B3 A / B)
 * - ลดราคา: แถบแคมเปญ + "ประหยัด ฿X"
 * - Flash: หัวส้ม + นับถอยหลัง + โควตา + จำกัดต่อคน · ถึง 0 เรียก `onExpired` ให้หน้าโหลดราคาใหม่
 * ตัวเลขทั้งหมดมาจาก `pricing` ของ API
 */
export function SaleBuyBox({
  listing,
  title,
  onExpired,
}: {
  listing: PublicListingDto;
  title: string;
  onExpired: () => void;
}) {
  const pricing = listing.pricing ?? null;
  const state = priceTagState(pricing);
  const sale = isOnSale(pricing) ? pricing.sale : null;
  const flash = state === "flash" && sale != null;
  const addCartItem = useAddCartItem();
  const [quantity, setQuantity] = useState(1);
  const left = useCountdown(sale?.endsAt, onExpired);
  const progress = flash ? quotaProgress(listing.saleQuota, sale.quotaLeft) : null;
  const limit = sale?.perBuyerLimit ?? null;
  const max = Math.max(1, listing.quantityAvailable);
  const soldOut = listing.quantityAvailable <= 0;

  const add = async () => {
    try {
      await addCartItem.mutateAsync({ listingId: listing.id, quantity });
      if (!notifyAddedAtSalePrice(title, quantity, pricing)) {
        toast.add({ title: "เพิ่มลงตะกร้าแล้ว", description: `${title} × ${quantity}`, type: "success" });
      }
    } catch (error) {
      toast.add({ title: "เพิ่มลงตะกร้าไม่สำเร็จ", description: addToCartErrorMessage(error), type: "error" });
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", flash && "border-[#fdba74]")}>
      {flash ? (
        <div className="flex items-center justify-between bg-linear-to-r from-[#f97316] to-[#dc2626] px-4 py-2 text-white">
          <span className="text-sm font-black">⚡ FLASH SALE</span>
          <span className="text-sm font-semibold tabular-nums" role="timer">
            จบใน {formatCountdown(left)}
          </span>
        </div>
      ) : null}
      <div className="grid gap-3 p-4">
        <p className="font-semibold">{title}</p>
        <PriceTag pricing={pricing} price={listing.price} size="lg" inline={flash} />

        {sale && !flash ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[#fdecec] px-3 py-2 text-xs text-[#b42318]">
            <span>
              {sale.name} · ลด {pricing?.discountPercent}% {untilLabel(sale.endsAt)}
            </span>
            {sale.slug ? (
              <Link to={`/sale/${sale.slug}`} className="font-semibold hover:underline">
                ดูแคมเปญ →
              </Link>
            ) : null}
          </div>
        ) : null}
        {sale && !flash ? (
          <p className="text-xs text-[#007a4a]">ประหยัด {formatSaleBaht(savingPerUnit(pricing))} · ใช้โค้ดส่วนลดเพิ่มได้ที่ตะกร้า</p>
        ) : null}

        {flash ? (
          <div className="grid gap-1.5">
            <div className="h-2 overflow-hidden rounded bg-[#fde2d4]" aria-hidden>
              <div className="h-full rounded bg-[#ea580c]" style={{ width: `${progress?.percent ?? 0}%` }} />
            </div>
            <p className="text-xs font-medium text-[#c2410c]">
              {[
                progress ? `ขายแล้ว ${progress.sold}/${progress.quota}` : null,
                sale.quotaLeft != null ? `ราคานี้เหลือ ${sale.quotaLeft} ชิ้น` : null,
                limit != null ? `คนละ ${limit} ชิ้น` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>จำนวน:</span>
          <div className="flex items-center rounded-full border">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="ลดจำนวน"
              className="size-7 rounded-full"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => value - 1)}
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="w-6 text-center font-semibold text-foreground" aria-live="polite">
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="เพิ่มจำนวน"
              className="size-7 rounded-full"
              disabled={quantity >= max}
              onClick={() => setQuantity((value) => value + 1)}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          {flash && limit != null && pricing ? (
            <span>
              (สูงสุด {limit} ที่ราคา Flash · ชิ้นถัดไปราคาปกติ {formatSaleBaht(pricing.listPrice)})
            </span>
          ) : (
            <span>มี {listing.quantityAvailable} ชิ้น</span>
          )}
        </div>

        <Button
          className={cn("h-11 rounded-lg text-sm font-semibold", flash && "bg-[#dc2626] text-white hover:bg-[#dc2626]/90")}
          disabled={soldOut || addCartItem.isPending}
          onClick={() => void add()}
        >
          {addCartItem.isPending ? <Loader2 className="size-4 animate-spin" /> : soldOut ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
        </Button>
      </div>
    </div>
  );
}
