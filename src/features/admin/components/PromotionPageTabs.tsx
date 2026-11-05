import { useSearchParams } from "react-router-dom";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { usePromotions } from "../promotions.queries";
import { type PromotionPageTab, useSaleCount } from "../sales.queries";

/**
 * แท็บหน้า "โค้ดส่วนลด | ลดราคาสินค้า" (Figma SAL-A1 Page tabs) — เปลี่ยนแท็บแล้วล้าง filter ของอีกแท็บ
 */
export function PromotionPageTabs({ value }: { value: PromotionPageTab }) {
  const [, setParams] = useSearchParams();
  const codes = usePromotions({ page: 0, size: 1 });
  const sales = useSaleCount();

  return (
    <Tabs
      className="w-fit max-w-full"
      value={value}
      onValueChange={(next) => setParams(next === "sales" ? { tab: "sales" } : {})}
    >
      <TabsList aria-label="ประเภทโปรโมชั่น" className="h-auto gap-1 rounded-[8px] bg-[#eef1f2] p-1">
        <TabsTrigger
          value="codes"
          className="h-auto gap-2 rounded-[6px] border-0! px-3.5 py-1.5 text-sm text-muted-foreground data-active:font-semibold data-active:text-foreground data-active:shadow-xs"
        >
          โค้ดส่วนลด
          <span className="text-[13px] font-medium">{codes.data?.page.totalItems ?? "–"}</span>
        </TabsTrigger>
        <TabsTrigger
          value="sales"
          className="h-auto gap-2 rounded-[6px] border-0! px-3.5 py-1.5 text-sm text-muted-foreground data-active:font-semibold data-active:text-foreground data-active:shadow-xs"
        >
          ลดราคาสินค้า
          <span className="text-[13px] font-medium">{sales.data ?? "–"}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
