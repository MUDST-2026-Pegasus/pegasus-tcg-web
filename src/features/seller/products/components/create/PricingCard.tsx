import { useId } from "react";

import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Controller,
  useFormState,
  useWatch,
  type FieldPath,
  type UseFormReturn,
} from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBaht } from "@/features/seller/shared/seller.format";
import { cn } from "@/lib/utils";

import {
  AUTO_PRICE_MIN_SAMPLE,
  autoPricePreview,
  ESTIMATED_COMMISSION_PERCENT,
  sanitizeSignedDecimal,
} from "../../listing-form.format";
import {
  MAX_UNITS_PER_STOCK_IN,
  type ListingFormMode,
  type ListingFormValues,
} from "../../listing-form.schema";
import type { MarketSnapshot } from "../../listing-form.types";
import { formatSignedBaht, roundMoney, toNumber } from "../../products.format";
import type { PricingMode } from "../../products.types";
import { AmountInput } from "../AmountInput";
import { useTranslate, translate } from "@/lib/i18n";

/** ตั้งราคาห่างจากค่ากลางไม่เกินกี่ % ถึงนับว่า "ใกล้ค่ากลาง" */
const NEAR_MEDIAN_PERCENT = 5;

const INPUT_CLASS = "h-8 rounded-lg border-input bg-background px-2.5 text-sm";
const READ_ONLY_INPUT_CLASS =
  "h-8 rounded-lg border-input bg-gray-50 px-2.5 text-sm text-gray-500 focus-visible:border-input focus-visible:ring-0";
const LABEL_CLASS = "text-xs font-medium text-gray-700";
const HELPER_CLASS = "text-[10px] leading-normal text-gray-400";

const MODES: { value: PricingMode; title: string; description: string }[] = [
  {
    value: "MANUAL",
    get title() { return translate("seller", "products.create.pricing.mode.fixed", "ตั้งราคาเอง"); },
    get description() { return translate("seller", "products.create.pricing.mode.fixedHint", "ราคาคงที่ตามที่กรอก เปลี่ยนเองได้ทุกเมื่อ"); },
  },
  {
    value: "AUTO_MEDIAN",
    get title() { return translate("seller", "products.create.pricing.mode.auto", "ตามราคาตลาดอัตโนมัติ"); },
    get description() { return translate("seller", "products.create.pricing.mode.autoHint", "ระบบขยับราคาให้ทุกคืนตามค่ากลางตลาด ภายในขอบเขตที่คุณตั้ง"); },
  },
];

export type MarketState = {
  /** `null` = ยังไม่มีใครขาย · `undefined` = ยังไม่ได้โหลด */
  data: MarketSnapshot | null | undefined;
  isPending: boolean;
  /** ยังไม่ได้เลือกการ์ดหรือสภาพ = ยังไม่รู้จะเทียบกับตลาดไหน */
  enabled: boolean;
};

type PricingCardProps = {
  form: UseFormReturn<ListingFormValues>;
  mode: ListingFormMode;
  market: MarketState;
  /** หน้าแก้ไข: จำนวนมาจากคลัง แก้ที่นี่ไม่ได้ ต้องเติมผ่านหน้าเติมสต็อก */
  stock?: { quantityAvailable: number; restockTo: string };
  /** เปิดหน้ามาแล้วโฟกัสช่องราคาเลย (มาจากปุ่ม "ปรับราคาขาย") */
  autoFocusPrice?: boolean;
};

/**
 * ราคา โหมดราคา และ (ตอนลงขาย) ต้นทุนกับจำนวน
 *
 * AUTO_MEDIAN ต้องอธิบายให้ผู้ขายเข้าใจก่อนเลือก (SLR-03): ราคาจะขยับเองตอนตี 3
 * ตามสูตรของ `AutoPriceCalculator` จึงบังคับกรอกราคาต่ำสุด/สูงสุดเสมอ และโชว์ตัวอย่าง
 * ราคาที่จะได้ถ้าตลาดเป็นแบบตอนนี้
 */
export function PricingCard({
  form,
  mode,
  market,
  stock,
  autoFocusPrice = false,
}: PricingCardProps) {
  const { t } = useTranslate("seller");
  const ids = {
    price: useId(),
    cost: useId(),
    quantity: useId(),
    offset: useId(),
    floor: useId(),
    ceiling: useId(),
  };
  const { control } = form;
  // แต่ละการ์ด subscribe formState เอง — React Compiler ข้ามการ render ซ้ำถ้า props เท่าเดิม
  const { errors } = useFormState({ control });

  const [pricingMode, priceText, unitCostText, quantityText] = useWatch({
    control,
    name: ["pricingMode", "price", "unitCost", "quantity"],
  });
  const isAuto = pricingMode === "AUTO_MEDIAN";

  const price = toNumber(priceText);
  const cost = mode === "create" ? (toNumber(unitCostText) ?? 0) : null;
  const quantity =
    mode === "create" ? (toNumber(quantityText) ?? 0) : (stock?.quantityAvailable ?? 0);

  const commission = roundMoney(
    ((price ?? 0) * ESTIMATED_COMMISSION_PERCENT) / 100,
  );
  const netPerUnit = roundMoney((price ?? 0) - commission - (cost ?? 0));
  const totalNet = roundMoney(netPerUnit * quantity);

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-base font-semibold text-foreground">{t("products.create.pricing.title", "ราคาและจำนวน")}</h2>
        <p className="text-xs text-gray-500">
          {mode === "create"
            ? t("products.create.pricing.costHint", "ต้นทุนใช้คำนวณกำไรในรายงานของคุณ ผู้ซื้อไม่เห็นข้อมูลนี้")
            : t("products.create.pricing.editStockHint", "จำนวนและต้นทุนมาจากประวัติการรับเข้า เพิ่มได้ที่หน้าเติมสต็อก")}
        </p>
      </div>

      <Controller
        control={control}
        name="pricingMode"
        render={({ field }) => (
          <RadioGroup
            aria-label={t("products.create.pricing.modeLabel", "โหมดราคา")}
            value={field.value}
            onValueChange={(next) => field.onChange(next as PricingMode)}
            className="grid gap-3 sm:grid-cols-2"
          >
            {MODES.map((option) => {
              const isSelected = option.value === field.value;
              return (
                <FieldLabel
                  key={option.value}
                  className={cn(
                    "w-full cursor-pointer items-start gap-2.5 rounded-[10px] p-3.5 ring-inset",
                    isSelected
                      ? "bg-emerald-50 ring-2 ring-teal-600"
                      : "bg-card ring-1 ring-border hover:bg-gray-50",
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    className="border-input bg-background data-checked:border-primary"
                  />
                  <span className="flex flex-1 flex-col gap-[3px]">
                    <span className="text-xs font-semibold text-foreground">
                      {option.title}
                    </span>
                    <span className="text-[10px] leading-4 font-normal text-gray-500">
                      {option.description}
                    </span>
                  </span>
                </FieldLabel>
              );
            })}
          </RadioGroup>
        )}
      />

      <div className="grid gap-3.5 sm:grid-cols-3">
        <MoneyField
          form={form}
          name="price"
          id={ids.price}
          label={isAuto ? t("products.create.pricing.startPrice", "ราคาเริ่มต้นต่อใบ (บาท) *") : t("products.create.pricing.price", "ราคาขายต่อใบ (บาท) *")}
          helper={
            isAuto
              ? t("products.create.pricing.startPriceHint", "ใช้ราคานี้จนกว่าระบบจะปรับครั้งแรก")
              : market.data
                ? t("products.create.pricing.marketNow", "ค่ากลางตลาดตอนนี้ {median}", { median: formatBaht(market.data.median) })
                : undefined
          }
          autoFocus={autoFocusPrice}
        />

        {mode === "create" ? (
          <>
            <MoneyField
              form={form}
              name="unitCost"
              id={ids.cost}
              label={t("products.create.pricing.unitCost", "ต้นทุนต่อใบ (บาท) *")}
              helper={t("products.create.pricing.unitCostHint", "ไม่แสดงต่อผู้ซื้อ ใส่ 0 ได้ถ้าไม่ได้ซื้อมา")}
            />
            <Field
              className="gap-1.5"
              data-invalid={Boolean(errors.quantity) || undefined}
            >
              <FieldLabel htmlFor={ids.quantity} className={LABEL_CLASS}>
                {t("products.create.pricing.quantity", "จำนวนที่มี (ใบ) *")}
              </FieldLabel>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <AmountInput
                    id={ids.quantity}
                    maxLength={3}
                    allowDecimal={false}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.quantity) || undefined}
                    className={INPUT_CLASS}
                  />
                )}
              />
              <FieldDescription className={HELPER_CLASS}>
                {t("products.create.pricing.quantityHint", "สูงสุด {max} ใบต่อครั้ง · ระบบตัดสต็อกเองเมื่อขายได้", { max: MAX_UNITS_PER_STOCK_IN })}
              </FieldDescription>
              <FieldError errors={[errors.quantity]} />
            </Field>
          </>
        ) : stock ? (
          <Field className="gap-1.5">
            <FieldLabel htmlFor={ids.quantity} className={LABEL_CLASS}>
              {t("products.create.pricing.available", "พร้อมขาย (ใบ)")}
            </FieldLabel>
            <Input
              id={ids.quantity}
              readOnly
              value={stock.quantityAvailable}
              className={READ_ONLY_INPUT_CLASS}
            />
            <FieldDescription className={HELPER_CLASS}>
              {t("products.create.pricing.addMoreAt", "เพิ่มจำนวนได้ที่หน้า")}{" "}
              <Link
                to={stock.restockTo}
                className="font-medium text-teal-600 no-underline hover:underline"
              >
                {t("products.actions.restock", "เติมสต็อก")}
              </Link>
            </FieldDescription>
          </Field>
        ) : null}
      </div>

      {isAuto ? (
        <AutoPricingFields form={form} ids={ids} market={market} />
      ) : null}

      <div className="flex flex-wrap items-center gap-y-3 rounded-[10px] border border-muted bg-neutral-50 p-4">
        <SummaryItem label={t("products.create.pricing.summary.price", "ราคาขาย")} value={formatBaht(price ?? 0)} strong />
        <SummaryItem
          label={t("products.create.pricing.summary.commission", "− ค่าคอมมิชชั่น ~{percent}%", { percent: ESTIMATED_COMMISSION_PERCENT })}
          value={formatBaht(commission)}
        />
        {cost !== null ? (
          <SummaryItem label={t("products.create.pricing.summary.cost", "− ต้นทุน")} value={formatBaht(cost)} />
        ) : null}
        <SummaryItem
          label={cost !== null ? t("products.create.pricing.summary.profit", "= กำไรต่อใบ") : t("products.create.pricing.summary.net", "= ได้รับต่อใบ")}
          value={formatSignedBaht(netPerUnit)}
          tone={netPerUnit < 0 ? "negative" : "positive"}
        />
        <div className="flex flex-col items-end gap-[5px]">
          <p className="text-xs text-gray-500">
            {cost !== null ? t("products.create.pricing.summary.totalProfit", "กำไรรวมถ้าขายหมด {quantity} ใบ", { quantity }) : t("products.create.pricing.summary.total", "รวมถ้าขายหมด {quantity} ใบ", { quantity })}
          </p>
          <p
            className={cn(
              "text-lg font-bold",
              totalNet < 0 ? "text-destructive" : "text-emerald-700",
            )}
          >
            {formatSignedBaht(totalNet)}
          </p>
        </div>
      </div>
      <p className={HELPER_CLASS}>
        {t("products.create.pricing.commissionNote", "ค่าคอมมิชชั่นคิดจากอัตรามาตรฐานของแพลตฟอร์ม ({percent}%) — บางหมวดอาจต่างกัน ยอดจริงอยู่ในคำสั่งซื้อ", { percent: ESTIMATED_COMMISSION_PERCENT })}
      </p>

      <MarketComparison market={market} price={price} />
    </Card>
  );
}

function MoneyField({
  form,
  name,
  id,
  label,
  helper,
  autoFocus,
}: {
  form: UseFormReturn<ListingFormValues>;
  name: FieldPath<ListingFormValues> &
    ("price" | "unitCost" | "autoPriceFloor" | "autoPriceCeiling");
  id: string;
  label: string;
  helper?: string;
  autoFocus?: boolean;
}) {
  const { errors } = useFormState({ control: form.control, name });
  const error = errors[name];
  return (
    <Field className="gap-1.5" data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id} className={LABEL_CLASS}>
        {label}
      </FieldLabel>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <AmountInput
            id={id}
            autoFocus={autoFocus}
            maxLength={16}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={Boolean(error) || undefined}
            className={INPUT_CLASS}
          />
        )}
      />
      {helper ? (
        <FieldDescription className={HELPER_CLASS}>{helper}</FieldDescription>
      ) : null}
      <FieldError errors={[error]} />
    </Field>
  );
}

/** ส่วนต่างจากค่ากลาง + ขอบเขตราคา พร้อมคำอธิบายว่าระบบจะทำอะไรกับราคา */
function AutoPricingFields({
  form,
  ids,
  market,
}: {
  form: UseFormReturn<ListingFormValues>;
  ids: { offset: string; floor: string; ceiling: string };
  market: MarketState;
}) {
  const { t } = useTranslate("seller");
  const { control } = form;
  const formState = useFormState({ control, name: "autoPriceOffsetPercent" });
  const [offsetText, floorText, ceilingText] = useWatch({
    control,
    name: ["autoPriceOffsetPercent", "autoPriceFloor", "autoPriceCeiling"],
  });
  const offset = toNumber(offsetText.replace(/^-$/, "")) ?? 0;
  const floor = toNumber(floorText);
  const ceiling = toNumber(ceilingText);

  const enoughSample =
    market.data !== null &&
    market.data !== undefined &&
    market.data.listingCount >= AUTO_PRICE_MIN_SAMPLE;
  const preview =
    market.data && enoughSample
      ? autoPricePreview({
          median: market.data.median,
          offsetPercent: offset,
          floor,
          ceiling,
        })
      : null;

  return (
    <div className="flex flex-col gap-3.5 rounded-[10px] border border-teal-100 bg-emerald-50/50 p-4">
      <div className="flex gap-2.5">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-teal-600" />
        <div className="flex flex-col gap-1.5 text-xs leading-5 text-gray-700">
          <p className="font-semibold text-foreground">{t("products.create.pricing.auto.howTitle", "ราคาอัตโนมัติทำงานอย่างไร")}</p>
          <ul className="flex list-disc flex-col gap-0.5 pl-4">
            <li>
              {t("products.create.pricing.auto.how1", "ทุกคืนตี 3 ระบบหาค่ากลางราคาของประกาศที่เปิดขายอยู่ของการ์ดพิมพ์นี้ในสภาพเดียวกัน")}
            </li>
            <li>
              {t("products.create.pricing.auto.how2", "ราคาใหม่ = ค่ากลาง × (1 + ส่วนต่าง %) แล้วไม่ต่ำกว่าราคาต่ำสุด และไม่สูงกว่าราคาสูงสุดที่คุณตั้ง")}
            </li>
            <li>
              {t("products.create.pricing.auto.how3", "ถ้ามีประกาศในตลาดน้อยกว่า {min} ใบ ราคาจะคงเดิม (ใช้ราคาเริ่มต้น)", { min: AUTO_PRICE_MIN_SAMPLE })}
            </li>
            <li>{t("products.create.pricing.auto.how4", "ราคาทุกครั้งที่ระบบเปลี่ยนถูกบันทึกในประวัติราคาของประกาศ")}</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        <Field
          className="gap-1.5"
          data-invalid={Boolean(formState.errors.autoPriceOffsetPercent) || undefined}
        >
          <FieldLabel htmlFor={ids.offset} className={LABEL_CLASS}>
            {t("products.create.pricing.auto.offset", "ส่วนต่างจากค่ากลาง (%)")}
          </FieldLabel>
          <Controller
            control={control}
            name="autoPriceOffsetPercent"
            render={({ field }) => (
              <Input
                id={ids.offset}
                inputMode="decimal"
                maxLength={7}
                value={field.value}
                onChange={(event) =>
                  field.onChange(sanitizeSignedDecimal(event.target.value))
                }
                onBlur={field.onBlur}
                aria-invalid={Boolean(formState.errors.autoPriceOffsetPercent) || undefined}
                className={INPUT_CLASS}
              />
            )}
          />
          <FieldDescription className={HELPER_CLASS}>
            {t("products.create.pricing.auto.offsetHint", "เช่น -5 = ถูกกว่าค่ากลาง 5% · 0 = เท่าค่ากลาง")}
          </FieldDescription>
          <FieldError errors={[formState.errors.autoPriceOffsetPercent]} />
        </Field>

        <MoneyField
          form={form}
          name="autoPriceFloor"
          id={ids.floor}
          label={t("products.create.pricing.auto.floor", "ราคาต่ำสุด (บาท) *")}
          helper={t("products.create.pricing.auto.floorHint", "ระบบจะไม่ลดราคาต่ำกว่านี้")}
        />
        <MoneyField
          form={form}
          name="autoPriceCeiling"
          id={ids.ceiling}
          label={t("products.create.pricing.auto.ceiling", "ราคาสูงสุด (บาท) *")}
          helper={t("products.create.pricing.auto.ceilingHint", "ระบบจะไม่ขึ้นราคาเกินนี้")}
        />
      </div>

      <p className="text-xs text-gray-700">
        {!market.enabled
          ? t("products.create.pricing.auto.previewNeedsCard", "เลือกการ์ดและสภาพก่อน จะได้เห็นตัวอย่างราคาจากตลาด")
          : market.isPending
            ? t("products.create.pricing.auto.previewLoading", "กำลังดูราคาในตลาด…")
            : preview && market.data
              ? `${t("products.create.pricing.auto.preview", "ถ้าตลาดเป็นแบบตอนนี้ (ค่ากลาง {median} จาก {count} ประกาศ) คืนนี้ราคาจะเป็น {price}", { median: formatBaht(market.data.median), count: market.data.listingCount, price: formatBaht(preview.price) })}${
                  preview.heldAt === "floor"
                    ? t("products.create.pricing.auto.hitFloor", " — ชนราคาต่ำสุดที่ตั้งไว้")
                    : preview.heldAt === "ceiling"
                      ? t("products.create.pricing.auto.hitCeiling", " — ชนราคาสูงสุดที่ตั้งไว้")
                      : ""
                }`
              : t("products.create.pricing.auto.notEnough", "ตอนนี้มีประกาศในตลาดไม่ถึง {min} ใบ ราคาจะคงอยู่ที่ราคาเริ่มต้นจนกว่าตลาดจะมีข้อมูลพอ", { min: AUTO_PRICE_MIN_SAMPLE })}
      </p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="flex min-w-28 flex-1 flex-col gap-[5px]">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={cn(
          tone
            ? cn(
                "text-lg font-bold",
                tone === "negative" ? "text-destructive" : "text-emerald-700",
              )
            : cn(
                "text-base font-semibold",
                strong ? "text-foreground" : "text-gray-500",
              ),
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** แถบเทียบราคาของเรากับช่วงต่ำสุด–สูงสุดของประกาศอื่นที่เปิดขายอยู่ (หน้าเปิดประมูลใช้ด้วย) */
export function MarketComparison({
  market,
  price,
}: {
  market: MarketState;
  price: number | null;
}) {
  const { t } = useTranslate("seller");
  if (!market.enabled) {
    return null;
  }
  if (market.isPending) {
    return <Skeleton aria-hidden="true" className="h-16 w-full rounded-lg" />;
  }
  if (!market.data) {
    return (
      <p className="rounded-lg bg-neutral-50 px-3.5 py-3 text-xs text-gray-500">
        {t("products.create.pricing.market.empty", "ยังไม่มีใครเปิดขายการ์ดพิมพ์นี้ในสภาพนี้ — คุณจะเป็นประกาศแรก")}
      </p>
    );
  }

  const snapshot = market.data;
  const range = snapshot.high - snapshot.low;
  const pricePosition =
    price === null || range <= 0
      ? 0
      : Math.min(Math.max((price - snapshot.low) / range, 0), 1) * 100;

  const diffPercent =
    price === null ? null : ((price - snapshot.median) / snapshot.median) * 100;
  const isNearMedian =
    diffPercent !== null && Math.abs(diffPercent) <= NEAR_MEDIAN_PERCENT;

  let badgeLabel: string | null = null;
  if (diffPercent !== null) {
    const rounded = Math.abs(diffPercent).toFixed(1);
    if (rounded === "0.0") badgeLabel = t("products.create.pricing.market.equal", "เท่ากับค่ากลาง");
    else if (diffPercent > 0) badgeLabel = t("products.create.pricing.market.above", "สูงกว่าค่ากลาง {percent}%", { percent: rounded });
    else badgeLabel = t("products.create.pricing.market.below", "ต่ำกว่าค่ากลาง {percent}%", { percent: rounded });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-700">
          {t("products.create.pricing.market.title", "เทียบกับราคาตลาด ({count} ประกาศที่ขายอยู่)", { count: snapshot.listingCount })}
        </p>
        {badgeLabel ? (
          <Badge
            className={cn(
              "h-5 rounded-full px-2 text-xs",
              isNearMedian
                ? "bg-green-100 text-emerald-700"
                : "bg-orange-100 text-amber-700",
            )}
          >
            {badgeLabel}
          </Badge>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        style={{ "--price-position": `${pricePosition}%` } as React.CSSProperties}
        className="flex h-7 items-center overflow-hidden rounded-lg bg-secondary"
      >
        <div className="h-7 w-(--price-position) rounded-lg bg-emerald-50" />
        {price !== null ? (
          <div className="h-7 w-[3px] shrink-0 bg-teal-600" />
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] text-gray-400">
          {t("products.create.pricing.market.low", "ต่ำสุด {price}", { price: formatBaht(snapshot.low) })}
        </p>
        <p className="text-[10px] font-medium text-gray-700">
          {t("products.create.pricing.market.median", "ค่ากลาง {price}", { price: formatBaht(snapshot.median) })}
        </p>
        <p className="text-[10px] text-gray-400">
          {t("products.create.pricing.market.high", "สูงสุด {price}", { price: formatBaht(snapshot.high) })}
        </p>
      </div>
    </div>
  );
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-555]
// @tolgee-key {"key": "products.create.pricing.mode.fixed", "ns": "seller", "defaultValue": "ตั้งราคาเอง"}
// @tolgee-key {"key": "products.create.pricing.mode.fixedHint", "ns": "seller", "defaultValue": "ราคาคงที่ตามที่กรอก เปลี่ยนเองได้ทุกเมื่อ"}
// @tolgee-key {"key": "products.create.pricing.mode.auto", "ns": "seller", "defaultValue": "ตามราคาตลาดอัตโนมัติ"}
// @tolgee-key {"key": "products.create.pricing.mode.autoHint", "ns": "seller", "defaultValue": "ระบบขยับราคาให้ทุกคืนตามค่ากลางตลาด ภายในขอบเขตที่คุณตั้ง"}
