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

import type { ListingDraft } from "../../product-create.types";
import type { ProductEditData } from "../../product-edit.types";
import { toNumber } from "../../products.format";
import { CatalogCardSummary } from "../create/CatalogCardSummary";
import { ConditionCard } from "../create/ConditionCard";
import { DetailsCard } from "../create/DetailsCard";
import { PricingCard } from "../create/PricingCard";
import { PricingTipCard } from "../create/PricingTipCard";

const PRODUCTS_PATH = "/seller/products";

/** แก้อะไรไปแล้วหรือยัง — ต้นทุนกับจำนวนแก้ในหน้านี้ไม่ได้ จึงไม่ต้องเทียบ */
function hasChanges(draft: ListingDraft, initial: ListingDraft): boolean {
  return (
    draft.condition !== initial.condition ||
    toNumber(draft.price) !== toNumber(initial.price) ||
    draft.description !== initial.description ||
    draft.options.accept_offers !== initial.options.accept_offers ||
    draft.options.allow_trade !== initial.options.allow_trade
  );
}

type ProductEditContentProps = {
  data: ProductEditData;
  /** มาจากปุ่ม "ปรับราคาขาย" ในหน้าเติมสต็อก — โฟกัสช่องราคาให้เลย */
  focusPrice: boolean;
};

export function ProductEditContent({ data, focusPrice }: ProductEditContentProps) {
  const [draft, setDraft] = useState<ListingDraft>(data.initialDraft);

  const price = toNumber(draft.price);
  const canSave =
    hasChanges(draft, data.initialDraft) && price !== null && price > 0;

  const selectedCondition = data.condition.options.find(
    (option) => option.id === draft.condition,
  );

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
          <BreadcrumbItem>{data.breadcrumb.productLabel}</BreadcrumbItem>
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
          {/* ยังไม่ได้แก้อะไร หรือราคาไม่ถูกต้อง = บันทึกไม่ได้
              ยังไม่มี endpoint — วันที่ต่อ API ให้ส่งค่าที่แก้ตรงนี้ */}
          <Button size="sm" className="rounded-md px-2.5" disabled={!canSave}>
            {data.actions.saveLabel}
          </Button>
        </div>
      </div>

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
            stockLock={{
              ...data.stockLock,
              restockTo: `${PRODUCTS_PATH}/${data.productId}/restock`,
            }}
            autoFocusPrice={focusPrice}
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
                id: data.productId,
                type: selectedCondition?.badgeLabel ?? "—",
                title: data.catalogCard.name,
                price: price === null ? "฿—" : formatBaht(price),
              }}
            />
          </div>

          <PricingTipCard {...data.tip} />
        </div>
      </div>
    </div>
  );
}
