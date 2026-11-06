import { useId } from "react";
import { TriangleAlert } from "lucide-react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import type { AuctionFormValues } from "../auction-form.types";
import { BahtField } from "./BahtField";

/** การ์ด "ซื้อทันที (ไม่บังคับ)" (Figma S2) [TCG-633 · FE-7] */
export function BuyNowSection({ form }: { form: UseFormReturn<AuctionFormValues> }) {
  const id = useId();
  const enabled = useWatch({ control: form.control, name: "buyNowEnabled" });

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id={`${id}-title`} className="text-sm font-bold text-foreground">
            ซื้อทันที (ไม่บังคับ)
          </h2>
          <p className="text-xs text-muted-foreground">ผู้ซื้อกดซื้อในราคานี้ได้ทันทีและประมูลจบเลย — ใช้ได้จนกว่าจะมีผู้บิดคนแรก</p>
        </div>
        <Controller
          control={form.control}
          name="buyNowEnabled"
          render={({ field }) => (
            <Switch
              aria-labelledby={`${id}-title`}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                // ปิดสวิตช์แล้ว error ของช่องราคาไม่ควรค้าง
                if (!checked) form.clearErrors("buyNowPrice");
              }}
            />
          )}
        />
      </div>

      {enabled ? (
        <>
          <div className="sm:max-w-[calc(50%-0.5rem)]">
            <BahtField form={form} name="buyNowPrice" id={`${id}-price`} label="ราคาซื้อทันที" hint="ต้องสูงกว่าราคาเริ่มต้น" />
          </div>
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            แบบ eBay: ปุ่ม "ซื้อทันที" จะหายไปเมื่อมีผู้บิดคนแรก · แก้ราคาหรือปิดสวิตช์ได้จนกว่าจะมีบิดแรก
          </p>
        </>
      ) : null}
    </Card>
  );
}
