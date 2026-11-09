import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ConfirmDialog } from "@/components/common";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { auctionKeys, useEligibleUnits } from "@/features/auction/auction.queries";
import { formatBaht } from "@/features/auction/auction.format";
import type { SellerAuctionDetail } from "@/features/auction/auction.types";
import { getMyListings, moveUnit } from "@/features/seller/products/products.api";
import { listingKeys } from "@/features/seller/products/products.queries";
import type { ListingQuery, ListingStatus, SellerListingSummary } from "@/features/seller/products/products.types";
import { ApiError } from "@/lib/api/errors";
import { intlLocale, translateError } from "@/lib/i18n";

/** ประกาศที่รับการ์ดได้ — ผู้ซื้อเห็นก่อน (ACTIVE / SOLD_OUT) แล้วค่อยที่ยังพักไว้ */
const TARGET_ORDER: ListingStatus[] = ["ACTIVE", "SOLD_OUT", "PAUSED", "DRAFT"];

function pickTarget(listings: SellerListingSummary[]): SellerListingSummary | null {
  for (const status of TARGET_ORDER) {
    const found = listings.find((listing) => listing.status === status);
    if (found) return found;
  }
  return null;
}

type ReturnToListingButtonProps = {
  detail: SellerAuctionDetail;
};

/**
 * "นำกลับไปลงขาย" — ประมูลไม่ได้ขาย การ์ดกลับเข้ามือ (`IN_STOCK`) โดยไม่ผูกกับประกาศไหน
 * ปุ่มนี้ย้ายใบเดิมเข้าประกาศของการ์ดพิมพ์ + สภาพเดียวกันที่ยังเปิดอยู่ [TCG-639]
 * ไม่แสดงเมื่อการ์ดไม่อยู่ในมือแล้ว (ลงขาย / ประมูลใหม่ไปแล้ว) หรือยังไม่มีประกาศที่รับได้
 */
export function ReturnToListingButton({ detail }: ReturnToListingButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const unitUid = detail.unitUid;

  // สถานะการ์ดตอนนี้ — `AVAILABLE` = อยู่ในมือ ยังไม่อยู่ในประกาศ
  const stock = useEligibleUnits({ q: unitUid ?? undefined, size: 1 }, { enabled: unitUid !== null });
  const inHand = stock.data?.page.items.find((item) => item.unitUid === unitUid)?.availability === "AVAILABLE";

  const listingQuery: ListingQuery = {
    variantId: detail.item.card.variantId,
    condition: detail.item.condition,
    page: 0,
    size: 20,
  };
  const listings = useQuery({
    queryKey: listingKeys.list(listingQuery),
    queryFn: () => getMyListings(listingQuery),
    enabled: inHand,
  });
  const target = listings.data ? pickTarget(listings.data.items) : null;

  const move = useMutation({
    mutationFn: (listingId: number) => moveUnit(unitUid ?? "", listingId),
    onSuccess: () => {
      setOpen(false);
      toast.add({
        type: "success",
        title: "นำการ์ดกลับไปลงขายแล้ว",
        description: `${detail.unitLabel} อยู่ในประกาศ ${formatBaht(target?.price ?? 0)} แล้ว`,
      });
      void queryClient.invalidateQueries({ queryKey: auctionKeys.seller() });
      void queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: "นำกลับไปลงขายไม่สำเร็จ",
        description: error instanceof ApiError ? translateError(error, error.message) : "ลองใหม่อีกครั้ง",
      });
    },
  });

  if (!inHand || !target) return null;

  const statusNote = target.status === "ACTIVE" || target.status === "SOLD_OUT" ? "" : " (ประกาศนี้ยังไม่เปิดขาย — เปิดได้ที่หน้าสินค้า)";

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-full px-4" onClick={() => setOpen(true)}>
        นำกลับไปลงขาย
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="นำการ์ดกลับไปลงขาย?"
        description={`${detail.item.card.productName} · ${detail.item.condition} · ใบ ${detail.unitLabel}`}
        confirmLabel="นำกลับไปลงขาย"
        cancelLabel="ยกเลิก"
        isPending={move.isPending}
        onConfirm={() => move.mutate(target.id)}
      >
        <p className="text-sm text-muted-foreground">
          ย้ายเข้าประกาศราคา {formatBaht(target.price)} (ขายอยู่ {target.quantityAvailable.toLocaleString(intlLocale())} ใบ)
          {statusNote} — ถ้าจะประมูลใหม่ภายหลังก็ยังเลือกการ์ดใบนี้ได้
        </p>
      </ConfirmDialog>
    </>
  );
}
