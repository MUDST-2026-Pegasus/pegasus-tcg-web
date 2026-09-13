import { useState } from "react";

import {
  ChevronDown,
  ChevronRight,
  ImageIcon,
  MapIcon,
  SearchIcon,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type {
  OrdersData,
  PaymentStatus,
  SellerOrder,
} from "../orders.types";

const PAYMENT_TEXT: Record<PaymentStatus, string> = {
  paid: "text-[#12805c]",
  pending: "text-[#b45309]",
  refunded: "text-gray-400",
};

type OrderCardProps = {
  order: SellerOrder;
  labels: OrdersData["card"];
  selected: boolean;
  onToggleSelect: () => void;
  defaultOpen?: boolean;
};

/**
 * การ์ดคำสั่งซื้อหนึ่งใบ — กดส่วนหัวเพื่อกาง/พับรายละเอียด กดเลขออเดอร์เพื่อไปหน้ารายละเอียด
 *
 * ปุ่มกาง/พับจริง ๆ คือลูกศรขวาสุด แต่ ::after ของมันขยายคลุมทั้งแถบหัวการ์ด
 * ช่องติ๊กกับลิงก์เลขออเดอร์ยกขึ้น z-10 ให้กดได้โดยไม่ไปกางการ์ด และไม่มีปุ่มซ้อนลิงก์
 * ฟอร์มเลขพัสดุเก็บ state ไว้ที่ตัวการ์ด (ไม่ใช่ใน panel) พับการ์ดแล้วค่าที่กรอกไม่หาย
 */
export function OrderCard({
  order,
  labels,
  selected,
  onToggleSelect,
  defaultOpen = false,
}: OrderCardProps) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState(labels.carriers[0]?.value ?? "");

  const isUrgent = Boolean(order.urgentLabel);
  const detailPath = `/seller/orders/${order.id}`;

  return (
    <Card
      className={cn(
        "w-full gap-0 rounded-xl border p-0 shadow-none ring-0",
        isUrgent
          ? "border-[#b45309] inset-ring-1 inset-ring-[#b45309]"
          : "border-border",
      )}
    >
      <Collapsible defaultOpen={defaultOpen}>
        <div className="relative flex items-center gap-3.5 px-5 py-4">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            aria-label={`${labels.selectLabel}: ${order.id}`}
            className="z-10"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <Link
                to={detailPath}
                className="relative z-10 rounded-sm text-sm font-semibold text-zinc-950 outline-none hover:text-teal-600 hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {order.id}
              </Link>
              {order.urgentLabel ? (
                <Badge className="h-5 rounded-full bg-[#fdf0dd] px-2 text-xs text-[#b45309]">
                  {order.urgentLabel}
                </Badge>
              ) : null}
            </div>
            <div className="flex min-w-0 items-center gap-1.5 text-xs">
              <span className="truncate text-gray-500">{order.buyer}</span>
              <span className="shrink-0 text-gray-400">
                · {order.orderedAtLabel}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-[3px]">
            <span className="text-base font-bold text-zinc-950">
              {order.total}
            </span>
            <span
              className={cn("text-[10px]", PAYMENT_TEXT[order.payment.status])}
            >
              {order.payment.label}
            </span>
          </div>

          <CollapsibleTrigger
            aria-label={`${labels.toggleLabel} ${order.id}`}
            className="group flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <ChevronDown
              aria-hidden="true"
              className="size-4 text-gray-500 transition-transform group-data-panel-open:rotate-180"
            />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
          <div className="flex flex-col gap-3.5 px-5 pb-4">
            <Separator className="bg-gray-100" />

            <ul className="flex flex-col gap-2.5">
              {order.lines.map((line) => {
                const LineIcon = line.kind === "shipping" ? ShoppingBag : ImageIcon;

                return (
                  <li key={line.id} className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gray-100">
                      <LineIcon
                        aria-hidden="true"
                        className="size-4 text-slate-500"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="truncate text-xs font-medium text-zinc-950">
                        {line.name}
                      </p>
                      {line.meta ? (
                        <p className="text-[10px] text-gray-400">{line.meta}</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-xs font-medium text-gray-700">
                      {line.price}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col gap-1.5 rounded-lg bg-neutral-50 p-3.5">
              <div className="flex items-center gap-1.5">
                <MapIcon aria-hidden="true" className="size-4 text-slate-500" />
                <p className="text-xs font-semibold text-gray-700">
                  {labels.addressTitle}
                </p>
              </div>
              <p className="text-xs leading-4 text-gray-500">{order.address}</p>
            </div>

            {order.status === "awaiting_pack" ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <InputGroup className="h-8 min-w-32 flex-1 rounded-lg border-input bg-background">
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    aria-label={`${labels.trackingPlaceholder}: ${order.id}`}
                    placeholder={labels.trackingPlaceholder}
                  />
                </InputGroup>

                <Select
                  items={Object.fromEntries(
                    labels.carriers.map((option) => [option.value, option.label]),
                  )}
                  value={carrier}
                  onValueChange={(value) => setCarrier(value ?? "")}
                >
                  <SelectTrigger
                    aria-label={labels.carrierPlaceholder}
                    className="h-8 w-48 rounded-lg border-input bg-background text-sm"
                  >
                    <SelectValue placeholder={labels.carrierPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {labels.carriers.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="rounded-md px-2.5">
                  {labels.printLabel}
                </Button>
                {/* ยังไม่มีเลขพัสดุ = ยืนยันจัดส่งไม่ได้ */}
                <Button
                  size="sm"
                  className="rounded-md px-2.5"
                  disabled={trackingNumber.trim() === "" || carrier === ""}
                >
                  {labels.confirmLabel}
                </Button>
              </div>
            ) : null}

            {order.shipment ? (
              <div className="flex items-center gap-1.5 text-xs">
                <Truck aria-hidden="true" className="size-4 text-slate-500" />
                <span className="font-semibold text-gray-700">
                  {labels.shipmentTitle}
                </span>
                <span className="text-gray-500">
                  {order.shipment.carrier} · {order.shipment.trackingNumber}
                </span>
              </div>
            ) : null}

            <Link
              to={detailPath}
              className="inline-flex items-center gap-0.5 self-end rounded-sm text-xs font-medium text-teal-600 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              {labels.detailLabel}
              <ChevronRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
