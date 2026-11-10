import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye } from "lucide-react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { ProductCard } from "@/components/common";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { formatBaht } from "@/features/seller/shared/seller.format";
import { usePublishPermission } from "@/features/seller/shared/seller.queries";
import { useFileUpload } from "@/hooks/use-file-upload";
import { applyApiErrors } from "@/lib/form";

import {
  CONDITION_OPTIONS,
  defaultConditionFor,
  listingFormErrorMessage,
} from "../../listing-form.format";
import {
  ListingPartiallyCreatedError,
  useCreateListing,
  useMarketSnapshot,
} from "../../listing-form.queries";
import {
  CREATE_STEP_FIELDS,
  emptyListingForm,
  listingIssues,
  listingSchema,
  MAX_LISTING_PHOTOS,
  toCreatePayload,
  toUnitsPayload,
  type ListingFormValues,
} from "../../listing-form.schema";
import type { SelectedCard } from "../../listing-form.types";
import { toNumber } from "../../products.format";
import type { SellerListing } from "../../products.types";

import { CardPicker } from "./CardPicker";
import { CatalogCardSummary } from "./CatalogCardSummary";
import { ConditionCard } from "./ConditionCard";
import { CreateStepper, type CreateStep } from "./CreateStepper";
import { DetailsCard } from "./DetailsCard";
import { ListingPhotosCard } from "./ListingPhotosCard";
import { PricingCard } from "./PricingCard";
import { PricingTipCard } from "./PricingTipCard";
import { ReadinessCard, type ReadinessItem } from "./ReadinessCard";
import { ReviewCard } from "./ReviewCard";
import { useTranslate, translate } from "@/lib/i18n";

const PRODUCTS_PATH = "/seller/products";

const STEPS: CreateStep[] = [
  { id: "card", get label() { return translate("seller", "products.create.steps.card", "เลือกการ์ด"); } },
  { id: "condition-price", get label() { return translate("seller", "products.create.steps.pricing", "สภาพและราคา"); } },
  { id: "photos", get label() { return translate("seller", "products.create.steps.photos", "รูปภาพ"); } },
  { id: "review", get label() { return translate("seller", "products.create.steps.review", "ตรวจสอบ"); } },
];
const LAST_STEP = STEPS.length - 1;

/** ขั้นแรกที่มีช่องผิด — กดส่งจากขั้นไหนก็ตาม พาไปที่ช่องนั้น */
function firstStepWithErrors(errors: FieldErrors<ListingFormValues>): number {
  return CREATE_STEP_FIELDS.findIndex((fields) =>
    fields.some((field) => errors[field] !== undefined),
  );
}

/** แผน "ประกาศอื่นของคุณขายการ์ดใบนี้สภาพเดียวกันอยู่" — backend ถามว่าจะรวมไหม */
function twinNote(listing: SellerListing): string | undefined {
  const twin = listing.similarListings[0];
  return twin
    ? translate("seller", "products.create.duplicate", "ประกาศ #{id} ของคุณขายการ์ดใบนี้สภาพเดียวกันอยู่แล้ว — พิจารณารวมเป็นประกาศเดียว", { id: twin.id })
    : undefined;
}

/**
 * หน้า "ลงขายสินค้าใหม่" — เลือกการ์ด → สภาพและราคา → รูป → ตรวจสอบ
 * ทุกขั้นเป็นฟอร์มก้อนเดียว ส่งได้จากหัวหน้าในขั้นไหนก็ได้ ช่องที่ผิดพาไปขั้นนั้นเอง
 *
 * ส่ง = สร้างประกาศ (DRAFT) → ใส่การ์ดพร้อมต้นทุน → เปิดขาย (ถ้ากดลงขาย)
 * ดู `useCreateListing` สำหรับกรณีที่สร้างแล้วแต่ขั้นหลังพลาด
 */
export function ListingCreateContent() {
  const { t } = useTranslate("seller");
  const navigate = useNavigate();
  const { canPublish, reason } = usePublishPermission();
  const createListing = useCreateListing();

  const [step, setStep] = useState(0);
  const [card, setCard] = useState<SelectedCard | null>(null);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema("create")),
    defaultValues: emptyListingForm(),
  });
  const { control, setValue, getValues, trigger, setError, handleSubmit, formState } =
    form;
  const values = useWatch({ control }) as ListingFormValues;

  const market = useMarketSnapshot(values.catalogVariantId, values.condition);

  const upload = useFileUpload({
    purpose: "LISTING_IMAGE",
    multiple: true,
    maxFiles: MAX_LISTING_PHOTOS,
    // คงลำดับที่ผู้ขายจัดไว้ (ตั้งรูปหลักแล้ว) เพิ่มรูปใหม่ต่อท้าย ตัดรูปที่ถูกเอาออก
    onChange: (uploaded) => {
      const current = getValues("imageKeys");
      setValue(
        "imageKeys",
        [
          ...current.filter((key) => uploaded.includes(key)),
          ...uploaded.filter((key) => !current.includes(key)),
        ],
        { shouldDirty: true, shouldValidate: formState.isSubmitted },
      );
    },
  });

  function goTo(next: number) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function handleSelectCard(selected: SelectedCard) {
    setCard(selected);
    setValue("catalogVariantId", selected.variantId, { shouldValidate: true });
    const suggested = defaultConditionFor(selected.productType);
    if (suggested && getValues("condition") === null) {
      setValue("condition", suggested);
    }
    goTo(1);
  }

  async function handleNext() {
    if (await trigger(CREATE_STEP_FIELDS[step])) {
      goTo(step + 1);
    }
  }

  const submit = (publish: boolean) =>
    handleSubmit(
      async (submitted) => {
        try {
          const listing = await createListing.mutateAsync({
            listing: toCreatePayload(submitted),
            units: toUnitsPayload(submitted),
            publish,
          });
          toast.add({
            type: "success",
            title: publish ? t("products.create.toast.published", "ลงขายแล้ว") : t("products.create.toast.drafted", "บันทึกฉบับร่างแล้ว"),
            description: twinNote(listing),
          });
          navigate(publish ? PRODUCTS_PATH : `${PRODUCTS_PATH}?status=DRAFT`);
        } catch (error) {
          if (error instanceof ListingPartiallyCreatedError) {
            // ประกาศมีแล้ว — พาไปแก้ต่อ ไม่ให้กดส่งซ้ำจนได้ประกาศซ้อน
            toast.add({
              type: "error",
              title:
                error.step === "units"
                  ? t("products.create.toast.stockFailed", "สร้างประกาศแล้ว แต่ใส่การ์ดเข้าประกาศไม่สำเร็จ")
                  : t("products.create.toast.publishFailed", "บันทึกเป็นฉบับร่างแล้ว แต่เปิดขายไม่สำเร็จ"),
              description: t("products.create.toast.continueHint", "{reason} — แก้ต่อได้ที่หน้านี้ หรือเปิดขายจากหน้าจัดการสินค้า", { reason: listingFormErrorMessage(error.cause, t("products.tryAgain", "ลองใหม่อีกครั้ง")) }),
            });
            navigate(`${PRODUCTS_PATH}/${error.listing.id}/edit`);
            return;
          }
          // ชื่อฟิลด์ใน violations ตรงกับชื่อช่องอยู่แล้ว — พาไปขั้นที่มีช่องผิด
          if (applyApiErrors(error, setError)) {
            const target = firstStepWithErrors(form.formState.errors);
            if (target >= 0) goTo(target);
            return;
          }
          setError("root.server", {
            message: listingFormErrorMessage(
              error,
              t("products.create.toast.failed", "ลงประกาศไม่สำเร็จ ลองใหม่อีกครั้ง"),
            ),
          });
        }
      },
      (errors) => {
        const target = firstStepWithErrors(errors);
        if (target >= 0) goTo(target);
      },
    );

  const issues = new Set(
    listingIssues(values, "create").map((issue) => issue.path),
  );
  const readiness: ReadinessItem[] = [
    {
      id: "card",
      done: !issues.has("catalogVariantId"),
      doneLabel: t("products.create.readiness.cardDone", "เลือกการ์ดจากแคตตาล็อกแล้ว"),
      pendingLabel: t("products.create.readiness.cardMissing", "ยังไม่เลือกการ์ดจากแคตตาล็อก"),
    },
    {
      id: "condition",
      done: !issues.has("condition"),
      doneLabel: t("products.create.readiness.conditionDone", "ระบุสภาพการ์ดแล้ว"),
      pendingLabel: t("products.create.readiness.conditionMissing", "ยังไม่ระบุสภาพการ์ด"),
    },
    {
      id: "pricing",
      done: !["price", "autoPriceOffsetPercent", "autoPriceFloor", "autoPriceCeiling"].some(
        (path) => issues.has(path as keyof ListingFormValues),
      ),
      doneLabel: t("products.create.readiness.priceDone", "ตั้งราคาแล้ว"),
      pendingLabel:
        values.pricingMode === "AUTO_MEDIAN"
          ? t("products.create.readiness.autoPriceMissing", "ยังไม่ได้ตั้งราคาเริ่มต้นและขอบเขตราคา")
          : t("products.create.readiness.priceMissing", "ยังไม่ได้ตั้งราคา"),
    },
    {
      id: "stock",
      done: !issues.has("unitCost") && !issues.has("quantity"),
      doneLabel: t("products.create.readiness.stockDone", "ระบุจำนวนและต้นทุนแล้ว"),
      pendingLabel: t("products.create.readiness.stockMissing", "ยังไม่ระบุจำนวนหรือต้นทุน"),
    },
    {
      id: "photos",
      done: values.imageKeys.length > 0,
      doneLabel: t("products.create.readiness.photosDone", "อัปโหลดรูปจริงแล้ว {count} รูป", { count: values.imageKeys.length }),
      pendingLabel: t("products.create.readiness.photosMissing", "ยังไม่อัปโหลดรูปจริง"),
      optional: true,
    },
  ];

  const selectedCondition = CONDITION_OPTIONS.find(
    (option) => option.value === values.condition,
  );
  const price = toNumber(values.price);
  const previewImage =
    upload.items.find((item) => item.objectKey === values.imageKeys[0])
      ?.previewUrl ??
    card?.imageUrl ??
    undefined;

  const isBusy = formState.isSubmitting || upload.isUploading;
  const blockedReason = !canPublish ? (reason ?? undefined) : undefined;

  const submitButtons = (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="rounded-md px-2.5"
        disabled={!canPublish || isBusy}
        title={blockedReason}
        onClick={submit(false)}
      >
        {t("products.create.actions.draft", "บันทึกฉบับร่าง")}
      </Button>
      <Button
        type="button"
        size="sm"
        className="rounded-md px-2.5"
        disabled={!canPublish || isBusy}
        title={blockedReason}
        onClick={submit(true)}
      >
        {formState.isSubmitting ? <Spinner data-icon="inline-start" /> : null}
        {t("products.create.actions.publish", "ลงขายทันที")}
      </Button>
    </>
  );

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(event) => event.preventDefault()}
    >
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs text-gray-500 sm:gap-1.5">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={PRODUCTS_PATH} />}>
              {t("products.title", "จัดการสินค้า")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-gray-700">
              {t("products.create.title", "ลงขายสินค้าใหม่")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">{t("products.create.title", "ลงขายสินค้าใหม่")}</h1>
          <p className="text-xs text-gray-500">
            {t("products.create.subtitle", "เลือกการ์ดจากแคตตาล็อกกลาง แล้วกำหนดสภาพ ราคา และจำนวนของคุณเอง")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            render={<Link to={PRODUCTS_PATH} />}
            nativeButton={false}
          >
            {t("actions.cancel", "ยกเลิก", { ns: "common" })}
          </Button>
          {submitButtons}
        </div>
      </div>

      {blockedReason ? (
        <Alert>
          <AlertDescription>{blockedReason}</AlertDescription>
        </Alert>
      ) : null}
      {formState.errors.root?.server?.message ? (
        <Alert variant="destructive">
          <AlertDescription>{formState.errors.root.server.message}</AlertDescription>
        </Alert>
      ) : null}

      <CreateStepper steps={STEPS} currentStepIndex={step} />

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          {step === 0 ? (
            <>
              {card ? (
                <CatalogCardSummary title={t("products.create.selectedCard", "การ์ดที่เลือกอยู่")} card={card} />
              ) : null}
              <CardPicker
                onSelect={handleSelectCard}
                error={formState.errors.catalogVariantId?.message}
              />
            </>
          ) : null}

          {step === 1 && card ? (
            <>
              <CatalogCardSummary
                title={t("products.create.selectedCatalogCard", "การ์ดที่เลือกจากแคตตาล็อก")}
                card={card}
                onChange={() => goTo(0)}
              />
              <ConditionCard
                value={values.condition}
                onValueChange={(next) =>
                  setValue("condition", next, {
                    shouldDirty: true,
                    shouldValidate: formState.isSubmitted,
                  })
                }
                error={formState.errors.condition?.message}
              />
              <PricingCard
                form={form}
                mode="create"
                market={{
                  data: market.data,
                  isPending: market.isPending,
                  enabled: values.catalogVariantId !== null && values.condition !== null,
                }}
              />
              <DetailsCard form={form} />
            </>
          ) : null}

          {step === 2 ? <ListingPhotosCard form={form} upload={upload} /> : null}

          {step === LAST_STEP ? (
            <ReviewCard form={form} card={card} onEditStep={goTo} />
          ) : null}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <div className="flex items-center gap-1.5">
            <Eye aria-hidden="true" className="size-4 text-slate-500" />
            <p className="text-xs font-medium text-gray-500">
              {t("products.create.preview", "ตัวอย่างที่ผู้ซื้อจะเห็น")}
            </p>
          </div>

          <div className="flex justify-center">
            <ProductCard
              className="w-56"
              product={{
                id: "preview",
                type: selectedCondition?.badgeLabel ?? "—",
                title: card?.productName ?? t("products.create.noCard", "ยังไม่ได้เลือกการ์ด"),
                price: price === null ? t("products.create.noPrice", "฿—") : formatBaht(price),
                image: previewImage,
                imageAlt: card?.productName,
              }}
            />
          </div>

          <ReadinessCard items={readiness} />

          <PricingTipCard />

          <div className="flex flex-wrap items-center gap-2.5">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md px-2.5"
                onClick={() => goTo(step - 1)}
              >
                {t("products.create.actions.back", "ย้อนกลับ")}
              </Button>
            ) : null}
            {step < LAST_STEP ? (
              <Button
                type="button"
                size="sm"
                className="rounded-md px-2.5"
                disabled={step === 0 && card === null}
                onClick={handleNext}
              >
                {t("products.create.actions.next", "ถัดไป: {step}", { step: STEPS[step + 1].label })}
              </Button>
            ) : (
              submitButtons
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-555]
// @tolgee-key {"key": "products.create.steps.card", "ns": "seller", "defaultValue": "เลือกการ์ด"}
// @tolgee-key {"key": "products.create.steps.pricing", "ns": "seller", "defaultValue": "สภาพและราคา"}
// @tolgee-key {"key": "products.create.steps.photos", "ns": "seller", "defaultValue": "รูปภาพ"}
// @tolgee-key {"key": "products.create.steps.review", "ns": "seller", "defaultValue": "ตรวจสอบ"}
// @tolgee-key {"key": "products.create.duplicate", "ns": "seller", "defaultValue": "ประกาศ #{id} ของคุณขายการ์ดใบนี้สภาพเดียวกันอยู่แล้ว — พิจารณารวมเป็นประกาศเดียว"}
