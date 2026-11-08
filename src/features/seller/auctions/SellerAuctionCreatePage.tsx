import { useEffect, useId, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, ImageIcon, Lock } from "lucide-react";
import { Controller, useForm, useFormState, useWatch, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { formatBaht } from "@/features/auction/auction.format";
import { auctionKeys, useCreateAuction, useEligibleUnits, useSellerAuction } from "@/features/auction/auction.queries";
import type { EligibleUnit } from "@/features/auction/auction.types";
import { CONDITION_OPTIONS } from "@/features/seller/products/listing-form.format";
import { CreateStepper, type CreateStep } from "@/features/seller/products/components/create/CreateStepper";
import { MarketComparison } from "@/features/seller/products/components/create/PricingCard";
import { PricingTipCard } from "@/features/seller/products/components/create/PricingTipCard";
import { ReadinessCard, type ReadinessItem } from "@/features/seller/products/components/create/ReadinessCard";
import { toNumber } from "@/features/seller/products/products.format";
import { usePublishPermission } from "@/features/seller/shared/seller.queries";
import { applyApiErrors } from "@/lib/form";

import {
  AUCTION_STEP_FIELDS,
  MAX_SELLER_NOTE,
  auctionFormIssues,
  auctionFormSchema,
  createAuctionErrorIssue,
  emptyAuctionForm,
  isSelectableUnit,
  issueMessage,
  relistAuctionForm,
  toCreateAuctionPayload,
} from "./auction-form.schema";
import type { AuctionFormField, AuctionFormValues } from "./auction-form.types";
import { AuctionFieldError } from "./components/AuctionFieldError";
import { AuctionPreviewCard } from "./components/AuctionPreviewCard";
import { BahtField } from "./components/BahtField";
import { BuyNowSection } from "./components/BuyNowSection";
import { CloseTimePicker } from "./components/CloseTimePicker";
import { ConfirmOpenAuctionDialog } from "./components/ConfirmOpenAuctionDialog";
import { StockUnitPicker } from "./components/StockUnitPicker";

const AUCTIONS_PATH = "/seller/auctions";

const STEPS: CreateStep[] = [
  { id: "unit", label: "เลือกการ์ดจากสต็อก" },
  { id: "price-time", label: "ราคาและเวลา" },
  { id: "review", label: "ตรวจสอบ" },
];
const REVIEW_STEP = 2;

/** ข้อความ "อีก 3 วัน 4 ชม." เดินตามนาฬิกาทุก 30 วินาทีก็พอ */
const CLOCK_TICK_MS = 30_000;

function stepOf(path: AuctionFormField): number {
  return AUCTION_STEP_FIELDS.findIndex((fields) => fields.includes(path));
}

function firstStepWithErrors(errors: FieldErrors<AuctionFormValues>): number {
  return AUCTION_STEP_FIELDS.findIndex((fields) => fields.some((field) => errors[field] !== undefined));
}

/** "Near Mint (NM)" → "Near Mint" */
function conditionName(code: string): string {
  return CONDITION_OPTIONS.find((option) => option.value === code)?.label.replace(/\s*\(.*\)$/, "") ?? code;
}

function readFromId(value: string | null): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * `/seller/auctions/new` — เปิดประมูล 3 ขั้น: เลือกการ์ด → ราคาและเวลา → ยืนยัน (Figma S2a, S2, S3-A) [TCG-633 · FE-7]
 * โครงเดียวกับหน้า "ลงขายสินค้าใหม่" · `?from={auctionId}` = "ประมูลใหม่" เติมค่าจากประมูลเดิม
 */
export function SellerAuctionCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const fromId = readFromId(searchParams.get("from"));
  const { canPublish, reason } = usePublishPermission();
  const createAuction = useCreateAuction();

  const [step, setStep] = useState(0);
  const [pickedUnit, setPickedUnit] = useState<EligibleUnit | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema()),
    defaultValues: emptyAuctionForm(),
  });
  const { control, setValue, trigger, setError, handleSubmit, formState, reset } = form;
  const values = useWatch({ control }) as AuctionFormValues;

  // ---------- "ประมูลใหม่" ----------
  const source = useSellerAuction(fromId, { poll: false });
  // ค้นการ์ดใบเดิมด้วย id ตรง ๆ — สต็อกหน้าแรกมีแค่ 20 ใบ ใบเดิมอาจไม่อยู่ในนั้น [TCG-639]
  const sourceUnitUid = source.data?.unitUid ?? null;
  const stock = useEligibleUnits({ q: sourceUnitUid ?? undefined, size: 1 }, { enabled: sourceUnitUid !== null });
  // การ์ดใบเดิมของประมูลที่จะเปิดใหม่ — ยังว่างอยู่ถึงเลือกให้
  const relistUnit =
    source.data && stock.data
      ? (stock.data.page.items.find((item) => item.unitUid === sourceUnitUid && isSelectableUnit(item)) ?? null)
      : null;
  const prefilled = useRef(false);
  useEffect(() => {
    // การ์ดใบเดิมไม่อยู่แล้ว (`unitUid` = null) — เติมแค่ราคา/เวลา ให้ผู้ขายเลือกการ์ดเอง
    if (prefilled.current || !source.data || (sourceUnitUid !== null && !stock.data)) return;
    prefilled.current = true;
    reset({ ...relistAuctionForm(source.data), unitUid: relistUnit?.unitUid ?? null });
  }, [source.data, sourceUnitUid, stock.data, relistUnit, reset]);

  const unit = pickedUnit ?? (relistUnit && values.unitUid === relistUnit.unitUid ? relistUnit : null);

  function goTo(next: number) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function selectUnit(next: EligibleUnit) {
    setPickedUnit(next);
    setValue("unitUid", next.unitUid, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  }

  async function handleNext() {
    if (!(await trigger(AUCTION_STEP_FIELDS[step]))) return;
    goTo(step + 1);
  }

  /** "ถัดไป: ตรวจสอบ" / "เปิดประมูล" บนหัวหน้า — ตรวจทุกช่องก่อนเปิด dialog ยืนยัน */
  const openReview = handleSubmit(
    () => setStep(REVIEW_STEP),
    (errors) => {
      const target = firstStepWithErrors(errors);
      if (target >= 0) goTo(target);
    },
  );

  const submit = handleSubmit(async (submitted) => {
    try {
      const detail = await createAuction.mutateAsync(toCreateAuctionPayload(submitted));
      toast.add({ type: "success", title: "เปิดประมูลแล้ว", description: `${detail.auctionNumber} เริ่มรับบิดตั้งแต่ตอนนี้` });
      navigate(`${AUCTIONS_PATH}/${detail.id}`);
    } catch (error) {
      const issue = createAuctionErrorIssue(error, submitted, now);
      if (issue?.path) {
        setError(issue.path, { message: issueMessage({ ...issue, path: issue.path }) });
        if (issue.path === "unitUid") void queryClient.invalidateQueries({ queryKey: auctionKeys.seller() });
        goTo(stepOf(issue.path));
        return;
      }
      if (issue) {
        setError("root.server", { message: issue.detail ? `${issue.message}\n${issue.detail}` : issue.message });
      } else if (applyApiErrors(error, setError)) {
        const target = firstStepWithErrors(form.formState.errors);
        goTo(target >= 0 ? target : 1);
        return;
      } else {
        setError("root.server", { message: "เปิดประมูลไม่สำเร็จ ลองใหม่อีกครั้ง" });
      }
      setStep(1);
    }
  });

  const issues = new Set(auctionFormIssues(values, now).map((issue) => issue.path));
  const readiness: ReadinessItem[] = [
    { id: "unit", done: !issues.has("unitUid"), doneLabel: "เลือกการ์ดจากสต็อกแล้ว", pendingLabel: "ยังไม่ได้เลือกการ์ดจากสต็อก" },
    {
      id: "price",
      done: !issues.has("startingPrice") && !issues.has("bidIncrement"),
      doneLabel: "ตั้งราคาเริ่มต้นและขั้นบิดแล้ว",
      pendingLabel: "ยังไม่ได้ตั้งราคาเริ่มต้นและขั้นบิด",
    },
    {
      id: "close",
      done: !issues.has("closeDate") && !issues.has("closeTime"),
      doneLabel: "ตั้งเวลาปิดแล้ว",
      pendingLabel: "ยังไม่ได้ตั้งเวลาปิด",
    },
    {
      id: "buy-now",
      done: values.buyNowEnabled && !issues.has("buyNowPrice"),
      doneLabel: "ตั้งราคาซื้อทันที (ไม่บังคับ)",
      pendingLabel: "ยังไม่ได้ตั้งราคาซื้อทันที",
      optional: true,
    },
  ];

  const blocked = !canPublish;
  const busy = formState.isSubmitting;
  const serverError = formState.errors.root?.server?.message;

  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={(event) => event.preventDefault()}>
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs text-gray-500 sm:gap-1.5">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={AUCTIONS_PATH} />}>การประมูลของฉัน</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-gray-700">เปิดประมูลใหม่</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">เปิดประมูลใหม่</h1>
          <p className="text-xs text-gray-500">เลือกการ์ดจากสต็อกของคุณ ตั้งราคาเริ่มต้นและเวลา แล้วเลือกว่าจะเปิด "ซื้อทันที" หรือไม่</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-md px-2.5" nativeButton={false} render={<Link to={AUCTIONS_PATH} />}>
            ยกเลิก
          </Button>
          {step > 0 ? (
            <Button type="button" size="sm" className="rounded-md px-2.5" disabled={blocked || busy} title={blocked ? (reason ?? undefined) : undefined} onClick={openReview}>
              เปิดประมูล
            </Button>
          ) : null}
        </div>
      </div>

      {blocked && reason ? (
        <Alert>
          <AlertDescription>{reason}</AlertDescription>
        </Alert>
      ) : null}
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>
            <AuctionFieldError message={serverError} />
          </AlertDescription>
        </Alert>
      ) : null}

      <CreateStepper steps={STEPS} currentStepIndex={step} />

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          {step === 0 ? <StockUnitPicker value={values.unitUid} onSelect={selectUnit} error={formState.errors.unitUid?.message} /> : null}

          {step >= 1 && unit ? (
            <>
              <SelectedUnitCard unit={unit} onChange={() => goTo(0)} />
              <PriceTimeCard form={form} unit={unit} now={now} />
              <BuyNowSection form={form} />
              <SellerNoteCard form={form} />
            </>
          ) : null}
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <div className="flex items-center gap-1.5">
            <Eye aria-hidden className="size-4 text-slate-500" />
            <p className="text-xs font-medium text-gray-500">ตัวอย่างที่ผู้ซื้อจะเห็น</p>
          </div>
          <div className="flex justify-center">
            <AuctionPreviewCard unit={unit} values={values} now={now} />
          </div>

          <ReadinessCard title="พร้อมเปิดประมูลหรือยัง" items={readiness} />

          {step === 0 ? (
            <PricingTipCard title="เคล็ดลับเลือกการ์ด">ใบที่สภาพดีและมีรูปถ่ายจริงชัด ๆ มักมีคนบิดมากกว่าและราคาปิดสูงกว่า</PricingTipCard>
          ) : (
            <PricingTipCard title="เคล็ดลับตั้งราคาเริ่มต้น">
              ราคาเริ่มต้นราว 60–80% ของราคาตลาดดึงคนเข้าบิดได้มากกว่า และราคาปิดมักขึ้นไปใกล้ราคาตลาดเอง
            </PricingTipCard>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            {step === 0 ? (
              <>
                <Button variant="outline" size="sm" className="rounded-md px-2.5" nativeButton={false} render={<Link to={AUCTIONS_PATH} />}>
                  ยกเลิก
                </Button>
                <Button type="button" size="sm" className="rounded-md px-2.5" disabled={values.unitUid === null} onClick={handleNext}>
                  ถัดไป: {STEPS[1].label}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" size="sm" className="rounded-md px-2.5" onClick={() => goTo(0)}>
                  ย้อนกลับ
                </Button>
                <Button type="button" size="sm" className="rounded-md px-2.5" disabled={blocked || busy} onClick={openReview}>
                  ถัดไป: {STEPS[2].label}
                </Button>
              </>
            )}
          </div>
        </aside>
      </div>

      <ConfirmOpenAuctionDialog
        open={step === REVIEW_STEP}
        onOpenChange={(open) => !open && setStep(1)}
        unit={unit}
        values={values}
        now={now}
        pending={busy}
        onConfirm={() => void submit()}
      />
    </form>
  );
}

/** ขั้น 2 หัวการ์ด: ใบที่เลือก + "เปลี่ยนการ์ด" + แถบสภาพตามสต็อก */
function SelectedUnitCard({ unit, onChange }: { unit: EligibleUnit; onChange: () => void }) {
  const { item } = unit;
  const chips = [item.gameName, item.cardNumber, item.rarity, item.setName].filter((chip): chip is string => Boolean(chip));
  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-foreground">การ์ดจากสต็อกของคุณ</h2>
        <Button type="button" variant="outline" size="sm" className="rounded-md px-2.5" onClick={onChange}>
          เปลี่ยนการ์ด
        </Button>
      </div>
      <div className="flex items-center gap-4 rounded-xl bg-teal-50 p-3">
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
          {item.card.officialImageUrl ? (
            <img src={item.card.officialImageUrl} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon aria-hidden className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="truncate text-sm font-semibold text-foreground">{item.card.productName}</p>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span key={chip} className="rounded bg-card px-1.5 py-0.5 text-[11px] font-medium text-teal-700">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
        <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        สภาพ {conditionName(item.condition)} (ตามสต็อก) · การ์ดใบนี้จะถูกล็อกจากหน้าร้านระหว่างประมูล และกลับเข้าสต็อกเองถ้าไม่มีผู้บิด
      </p>
    </Card>
  );
}

/** การ์ด "ราคาและเวลาประมูล" */
function PriceTimeCard({ form, unit, now }: { form: UseFormReturn<AuctionFormValues>; unit: EligibleUnit; now: number }) {
  const id = useId();
  const [startingPrice, closeDate, closeTime] = useWatch({ control: form.control, name: ["startingPrice", "closeDate", "closeTime"] });
  const { errors, isSubmitted } = useFormState({ control: form.control, name: ["closeDate", "closeTime"] });
  const guide = unit.marketGuide;

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-foreground">ราคาและเวลาประมูล</h2>
        <p className="text-xs text-muted-foreground">ผู้ซื้อต้องบิดอย่างน้อยราคาเริ่มต้น และเพิ่มครั้งละไม่น้อยกว่าขั้นบิด</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BahtField
          form={form}
          name="startingPrice"
          id={`${id}-start`}
          label="ราคาเริ่มต้น"
          required
          hint={guide ? `ราคาตลาดตอนนี้ ${formatBaht(guide.median)}` : undefined}
        />
        <BahtField form={form} name="bidIncrement" id={`${id}-increment`} label="บิดขั้นต่ำครั้งละ" required hint="แนะนำ ~5% ของราคาเริ่มต้น" />
      </div>

      <Field className="gap-1.5">
        <FieldLabel className="text-xs font-medium text-gray-700">เวลาปิดประมูล *</FieldLabel>
        <CloseTimePicker
          date={closeDate}
          time={closeTime}
          now={now}
          error={errors.closeDate?.message ?? errors.closeTime?.message}
          onChange={(next) => {
            const options = { shouldDirty: true, shouldValidate: isSubmitted };
            form.setValue("closeDate", next.date, options);
            form.setValue("closeTime", next.time, options);
            if (isSubmitted) void form.trigger(["closeDate", "closeTime"]);
          }}
        />
      </Field>

      <MarketComparison
        market={{ data: guide ? { listingCount: guide.listingCount, low: guide.min, median: guide.median, high: guide.max } : null, isPending: false, enabled: true }}
        price={toNumber(startingPrice)}
      />
    </Card>
  );
}

/** การ์ด "หมายเหตุถึงผู้ซื้อ (ไม่บังคับ)" */
function SellerNoteCard({ form }: { form: UseFormReturn<AuctionFormValues> }) {
  const id = useId();
  const { errors } = useFormState({ control: form.control, name: "sellerNote" });
  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-sm font-bold text-foreground">
          หมายเหตุถึงผู้ซื้อ (ไม่บังคับ)
        </h2>
        <p className="text-xs text-muted-foreground">แสดงในหน้าประมูลใต้ชื่อผู้ขาย · แก้ได้จนกว่าจะมีบิดแรก · ห้ามใส่ช่องทางติดต่อนอกระบบ</p>
      </div>
      <Controller
        control={form.control}
        name="sellerNote"
        render={({ field }) => (
          <Textarea
            {...field}
            aria-labelledby={`${id}-title`}
            aria-invalid={Boolean(errors.sellerNote) || undefined}
            maxLength={MAX_SELLER_NOTE + 50}
            placeholder="เช่น เก็บใน Top Loader ตั้งแต่แกะซอง ไม่เคยเล่น มีรูปมุมทั้ง 4 ให้ดูก่อนซื้อ…"
            className="min-h-16 rounded-lg border-input bg-background text-sm"
          />
        )}
      />
      <AuctionFieldError message={errors.sellerNote?.message} />
    </Card>
  );
}
