import type { ReactNode } from "react";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBaht } from "@/features/seller/shared/seller.format";

import { CONDITION_OPTIONS } from "../../listing-form.format";
import type { ListingFormValues } from "../../listing-form.schema";
import type { SelectedCard } from "../../listing-form.types";
import { toNumber } from "../../products.format";
import { useTranslate } from "@/lib/i18n";

type ReviewCardProps = {
  form: UseFormReturn<ListingFormValues>;
  card: SelectedCard | null;
  /** พาไปแก้ที่ขั้นนั้น (index ของขั้น) */
  onEditStep: (step: number) => void;
};

const money = (text: string) => {
  const value = toNumber(text);
  return value === null ? "—" : formatBaht(value);
};

/** ขั้นสุดท้าย — สรุปทุกอย่างก่อนกดลงขายหรือบันทึกฉบับร่าง */
export function ReviewCard({ form, card, onEditStep }: ReviewCardProps) {
  const { t } = useTranslate("seller");
  const values = useWatch({ control: form.control });
  const condition = CONDITION_OPTIONS.find(
    (option) => option.value === values.condition,
  );
  const isAuto = values.pricingMode === "AUTO_MEDIAN";

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-base font-semibold text-foreground">{t("products.create.review.title", "ตรวจสอบก่อนลงขาย")}</h2>
        <p className="text-xs text-gray-500">
          {t("products.create.review.subtitle", "\"ลงขายทันที\" ผู้ซื้อเห็นประกาศเลย · \"บันทึกฉบับร่าง\" การ์ดเข้าคลังแล้วแต่ยังไม่เปิดขาย เปิดทีหลังได้จากหน้าจัดการสินค้า")}
        </p>
      </div>

      <dl className="flex flex-col divide-y divide-muted rounded-lg border border-muted">
        <Row label={t("products.create.review.card", "การ์ด")} step={0} onEditStep={onEditStep}>
          {card ? (
            <>
              {card.productName}
              <span className="block text-[11px] text-gray-500">
                {card.variantLabel} · <span className="font-mono">{card.sku}</span>
              </span>
            </>
          ) : (
            "—"
          )}
        </Row>
        <Row label={t("products.create.review.condition", "สภาพ")} step={1} onEditStep={onEditStep}>
          {condition?.label ?? "—"}
        </Row>
        <Row label={t("products.create.review.price", "ราคา")} step={1} onEditStep={onEditStep}>
          {isAuto ? (
            <>
              {t("products.create.review.autoOffset", "ตามราคาตลาด ส่วนต่าง {percent}%", { percent: values.autoPriceOffsetPercent || "0" })}
              <span className="block text-[11px] text-gray-500">
                {t("products.create.review.autoRange", "ช่วง {floor}–{ceiling} · เริ่มที่ {price}", { floor: money(values.autoPriceFloor ?? ""), ceiling: money(values.autoPriceCeiling ?? ""), price: money(values.price ?? "") })}
              </span>
            </>
          ) : (
            money(values.price ?? "")
          )}
        </Row>
        <Row label={t("products.create.review.quantity", "จำนวน")} step={1} onEditStep={onEditStep}>
          {t("products.create.review.quantityCost", "{quantity} ใบ · ต้นทุน {cost} / ใบ", { quantity: values.quantity || "—", cost: money(values.unitCost ?? "") })}
        </Row>
        <Row label={t("products.create.review.grade", "เกรด")} step={1} onEditStep={onEditStep}>
          {values.gradingCompany?.trim()
            ? `${values.gradingCompany.trim()} ${values.gradeValue ?? ""}`.trim()
            : "—"}
        </Row>
        <Row label={t("products.create.review.lot", "ป้ายล็อต")} step={1} onEditStep={onEditStep}>
          {values.lotLabel?.trim() || "—"}
        </Row>
        <Row label={t("products.create.review.note", "คำอธิบาย")} step={1} onEditStep={onEditStep}>
          <span className="whitespace-pre-line">
            {values.publicNote?.trim() || "—"}
          </span>
        </Row>
        <Row label={t("products.create.review.photos", "รูป")} step={2} onEditStep={onEditStep}>
          {values.imageKeys?.length
            ? t("products.create.review.photoCount", "{count} รูป", { count: values.imageKeys.length })
            : t("products.create.review.noPhotos", "ยังไม่มีรูป (ไม่บังคับ แต่ประกาศที่มีรูปจริงขายง่ายกว่า)")}
        </Row>
      </dl>
    </Card>
  );
}

function Row({
  label,
  step,
  onEditStep,
  children,
}: {
  label: string;
  step: number;
  onEditStep: (step: number) => void;
  children: ReactNode;
}) {
  const { t } = useTranslate("seller");
  return (
    <div className="flex items-start gap-3 px-3.5 py-2.5">
      <dt className="w-20 shrink-0 text-xs text-gray-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-foreground">{children}</dd>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 rounded-md px-2 text-xs text-teal-600"
        onClick={() => onEditStep(step)}
      >
        {t("products.create.review.edit", "แก้")}
      </Button>
    </div>
  );
}
