import { useState } from "react";

import { Eye } from "lucide-react";
import { Link } from "react-router-dom";

import { ProductCard } from "@/components/common/ProductCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { formatBaht } from "@/features/seller/shared/seller.format";

import { getReadiness, toNumber } from "../../product-create.form";
import type {
  ListingDraft,
  ProductCreateData,
} from "../../product-create.types";

import { CatalogCardSummary } from "./CatalogCardSummary";
import { ConditionCard } from "./ConditionCard";
import { CreateStepper } from "./CreateStepper";
import { DetailsCard } from "./DetailsCard";
import { PricingCard } from "./PricingCard";
import { PricingTipCard } from "./PricingTipCard";
import { ReadinessCard } from "./ReadinessCard";

const PRODUCTS_PATH = "/seller/products";

type ProductCreateContentProps = {
  data: ProductCreateData;
};

export function ProductCreateContent({ data }: ProductCreateContentProps) {
  const [draft, setDraft] = useState<ListingDraft>(data.initialDraft);

  const readiness = getReadiness(draft);
  // ข้อมูลที่ขั้นนี้บังคับกรอกครบแล้ว — ไปขั้นถัดไปหรือลงขายได้
  const canProceed =
    readiness.condition && readiness.pricing && readiness.quantity;

  const selectedCondition = data.condition.options.find(
    (option) => option.id === draft.condition,
  );
  const price = toNumber(draft.price);

  function updateDraft<K extends keyof ListingDraft>(
    key: K,
    value: ListingDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs text-gray-500 sm:gap-1.5">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={PRODUCTS_PATH} />}>
              {data.breadcrumb.rootLabel}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-gray-700">
              {data.breadcrumb.currentLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-950">{data.title}</h1>
          <p className="text-xs text-gray-500">{data.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            render={<Link to={PRODUCTS_PATH} />}
            nativeButton={false}
          >
            {data.actions.cancelLabel}
          </Button>
          <Button variant="secondary" size="sm" className="rounded-md px-2.5">
            {data.actions.saveDraftLabel}
          </Button>
          <Button
            size="sm"
            className="rounded-md px-2.5"
            disabled={!canProceed}
          >
            {data.actions.publishLabel}
          </Button>
        </div>
      </div>

      <CreateStepper
        steps={data.steps}
        currentStepIndex={data.currentStepIndex}
      />

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <CatalogCardSummary {...data.catalogCard} />

          <ConditionCard
            {...data.condition}
            value={draft.condition}
            onValueChange={(value) => updateDraft("condition", value)}
          />

          <PricingCard
            {...data.pricing}
            draft={draft}
            onFieldChange={(field, value) => updateDraft(field, value)}
          />

          <DetailsCard
            {...data.details}
            description={draft.description}
            onDescriptionChange={(value) => updateDraft("description", value)}
            optionValues={draft.options}
            onOptionChange={(id, enabled) =>
              updateDraft("options", { ...draft.options, [id]: enabled })
            }
          />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <div className="flex items-center gap-1.5">
            <Eye aria-hidden="true" className="size-4 text-slate-500" />
            <p className="text-xs font-medium text-gray-500">
              {data.preview.title}
            </p>
          </div>

          <div className="flex justify-center">
            <ProductCard
              className="w-56"
              product={{
                id: "preview",
                type: selectedCondition?.badgeLabel ?? "—",
                title: data.catalogCard.name,
                price: price === null ? "฿—" : formatBaht(price),
              }}
            />
          </div>

          <ReadinessCard {...data.readiness} status={readiness} />

          <PricingTipCard {...data.tip} />

          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" className="rounded-md px-2.5">
              {data.navigation.backLabel}
            </Button>
            <Button
              size="sm"
              className="rounded-md px-2.5"
              disabled={!canProceed}
            >
              {data.navigation.nextLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
