import { useState } from "react";

import { Info } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

import { calculateRestock } from "../../restock.calc";
import type { RestockData, RestockDraft } from "../../restock.types";

import { ProductStockCard } from "./ProductStockCard";
import { ProfitWarningCard } from "./ProfitWarningCard";
import { RestockFormCard } from "./RestockFormCard";
import { RestockHistoryCard } from "./RestockHistoryCard";
import { RestockSummaryCard } from "./RestockSummaryCard";
import { WeightedCostCard } from "./WeightedCostCard";

const PRODUCTS_PATH = "/seller/products";

type RestockContentProps = {
  data: RestockData;
};

export function RestockContent({ data }: RestockContentProps) {
  const [draft, setDraft] = useState<RestockDraft>(data.initialDraft);

  const result = calculateRestock(data.product, data.commissionPercent, draft);
  const showProfitWarning =
    result.isValid && result.newProfit < result.previousProfit;

  function handleFieldChange(field: keyof RestockDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
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
          {/* ยังไม่มีหน้ารายละเอียดสินค้า ชื่อสินค้าจึงเป็นข้อความเฉย ๆ */}
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
          {/* ยังกรอกจำนวน ต้นทุนรวม หรือวันที่ไม่ครบ = บันทึกไม่ได้ */}
          <Button
            size="sm"
            className="rounded-md px-2.5"
            disabled={!result.isValid}
          >
            {data.actions.saveLabel}
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <ProductStockCard {...data.product} />

          <RestockFormCard
            {...data.form}
            draft={draft}
            onFieldChange={handleFieldChange}
          />

          <WeightedCostCard
            {...data.calculation}
            product={data.product}
            result={result}
          />

          <RestockHistoryCard
            {...data.history}
            unit={data.product.unit}
            sourceOptions={data.form.sourceOptions}
            draft={draft}
            result={result}
          />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-72">
          <RestockSummaryCard
            {...data.summary}
            product={data.product}
            result={result}
          />

          {showProfitWarning ? (
            <ProfitWarningCard
              {...data.profitWarning}
              productId={data.productId}
              averageCost={data.product.averageCost}
              result={result}
            />
          ) : null}

          <div className="flex w-full flex-col gap-2 rounded-xl border border-zinc-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <Info aria-hidden="true" className="size-4 text-slate-500" />
              <p className="text-xs font-semibold text-gray-700">
                {data.info.title}
              </p>
            </div>
            <p className="text-xs leading-4 text-gray-500">
              {data.info.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
