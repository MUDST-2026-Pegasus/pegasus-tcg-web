import { useSearchParams } from "react-router-dom";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSellerPromotions } from "@/features/seller/promotions/promotions.queries";

import { useSellerSaleCount } from "../sales.queries";
import { useTranslate } from "@/lib/i18n";

const TRIGGER =
  "h-auto gap-2 rounded-[6px] border-0! px-3.5 py-1.5 text-sm text-muted-foreground data-active:font-semibold data-active:text-foreground data-active:shadow-xs";

/** แท็บหน้า "โค้ดส่วนลดร้าน | ลดราคาสินค้า" ของ /seller/promotions (Figma SAL-S1) */
export function SellerPromotionPageTabs({ value }: { value: "codes" | "sales" }) {
  const { t } = useTranslate("sale");
  const [, setParams] = useSearchParams();
  const codes = useSellerPromotions("ALL", 0);
  const sales = useSellerSaleCount();
  const codeCount = codes.data?.page.totalItems;

  return (
    <Tabs className="w-fit max-w-full" value={value} onValueChange={(next) => setParams(next === "sales" ? { tab: "sales" } : {})}>
      <TabsList aria-label={t("seller.tabs.label", "ประเภทโปรโมชั่นของร้าน")} className="h-auto gap-1 rounded-[8px] bg-[#eef1f2] p-1">
        <TabsTrigger value="codes" className={TRIGGER}>
          {t("seller.tabs.codes", "โค้ดส่วนลดร้าน")} <span className="text-[13px] font-medium">{codeCount ?? "–"}</span>
        </TabsTrigger>
        <TabsTrigger value="sales" className={TRIGGER}>
          {t("seller.tabs.sales", "ลดราคาสินค้า")} <span className="text-[13px] font-medium">{sales.data ?? "–"}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
