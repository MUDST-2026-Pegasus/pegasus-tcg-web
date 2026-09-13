import { useState } from "react";

import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/features/seller/shared/seller.types";
import { cn } from "@/lib/utils";

import type { OrderDetail } from "../../order-detail.types";

import { BuyerCard } from "./BuyerCard";
import { OrderProfitCard } from "./OrderProfitCard";
import { OrderTimelineCard } from "./OrderTimelineCard";
import { PackingListCard } from "./PackingListCard";
import { PaymentCard } from "./PaymentCard";
import { ShippingInfoCard } from "./ShippingInfoCard";

const STATUS_BADGE: Record<OrderStatus, string> = {
  awaiting_pack: "bg-[#fdf0dd] text-[#b45309]",
  awaiting_payment: "bg-[#fdf0dd] text-[#b45309]",
  shipped: "bg-[#ede9fe] text-[#6d28d9]",
  completed: "bg-[#e3f4ec] text-[#12805c]",
  cancelled: "bg-[#eef1f2] text-[#6b7280]",
};

type OrderDetailContentProps = {
  data: OrderDetail;
};

export function OrderDetailContent({ data }: OrderDetailContentProps) {
  const [carrier, setCarrier] = useState(
    data.shipping.form?.carriers[0]?.value ?? "",
  );
  const [trackingNumber, setTrackingNumber] = useState("");
  const [packedIds, setPackedIds] = useState<string[]>([]);

  const canConfirm = carrier !== "" && trackingNumber.trim() !== "";

  function handleTogglePacked(id: string) {
    setPackedIds((current) =>
      current.includes(id)
        ? current.filter((packedId) => packedId !== id)
        : [...current, id],
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs text-gray-500 sm:gap-1.5">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/seller/orders" />}>
              {data.breadcrumb.rootLabel}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link to={`/seller/orders?status=${data.status}`} />}
            >
              {data.breadcrumb.statusLabel}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-gray-700">
              {data.id}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-zinc-950">{data.id}</h1>
            <Badge
              className={cn(
                "h-5 rounded-full px-2 text-xs",
                STATUS_BADGE[data.status],
              )}
            >
              {data.statusLabel}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">{data.subtitle}</p>
        </div>

        {data.actions ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-md px-2.5">
              {data.actions.printLabel}
            </Button>
            {/* ยังไม่ได้กรอกเลขพัสดุในการ์ดข้อมูลการจัดส่ง = ยืนยันไม่ได้ */}
            <Button
              size="sm"
              className="rounded-md px-2.5"
              disabled={!canConfirm}
            >
              {data.actions.confirmLabel}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <PackingListCard
            {...data.items}
            packedIds={packedIds}
            onTogglePacked={handleTogglePacked}
          />
          <ShippingInfoCard
            {...data.shipping}
            carrier={carrier}
            onCarrierChange={setCarrier}
            trackingNumber={trackingNumber}
            onTrackingNumberChange={setTrackingNumber}
          />
          <OrderTimelineCard {...data.timeline} />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <BuyerCard {...data.buyer} />
          <PaymentCard {...data.payment} />
          {data.profit ? <OrderProfitCard {...data.profit} /> : null}
        </div>
      </div>
    </div>
  );
}
