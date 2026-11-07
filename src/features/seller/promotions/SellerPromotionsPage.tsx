import { useLanguage } from "@/lib/language";
import { useSearchParams } from "react-router-dom";
import { SellerSalesContent } from "@/features/seller/sales/components/SellerSalesContent";

import { SellerPromotionsContent } from "./components/SellerPromotionsContent";
import type { PromotionStatus } from "./promotions.types";

const validStatuses = new Set(["ACTIVE", "SCHEDULED", "PAUSED", "EXPIRED", "USED_UP"]);

/** `/seller/promotions` — แท็บ "โค้ดส่วนลดร้าน" และ "ลดราคาสินค้า" (`?tab=sales`, TCG-682) */
export function SellerPromotionsPage() {
  useLanguage();
  const [params] = useSearchParams();
  return params.get("tab") === "sales" ? <SellerSalesContent /> : <SellerCodesTab />;
}

function SellerCodesTab() {
  useLanguage();
  const [params, setParams] = useSearchParams();
  const rawStatus = params.get("status") ?? "ALL";
  const status: PromotionStatus | "ALL" = validStatuses.has(rawStatus)
    ? rawStatus as PromotionStatus
    : "ALL";
  const page = Math.max(0, (Number(params.get("page")) || 1) - 1);

  function update(nextStatus: PromotionStatus | "ALL", nextPage = 0) {
    const next = new URLSearchParams(params);
    if (nextStatus === "ALL") next.delete("status");
    else next.set("status", nextStatus);
    if (nextPage === 0) next.delete("page");
    else next.set("page", String(nextPage + 1));
    setParams(next, { replace: true });
  }

  return (
    <SellerPromotionsContent
      status={status}
      page={page}
      onStatusChange={(next) => update(next)}
      onPageChange={(next) => update(status, next)}
    />
  );
}
