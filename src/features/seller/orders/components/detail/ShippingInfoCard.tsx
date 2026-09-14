import { useId, useState } from "react";

import { CheckIcon, CopyIcon, TriangleAlert, UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { OrderDetail } from "../../order-detail.types";

const FIELD_CLASS = "h-8 rounded-lg border-input bg-background text-sm";
const LABEL_CLASS = "text-xs font-medium text-gray-700";

type ShippingInfoCardProps = OrderDetail["shipping"] & {
  carrier: string;
  onCarrierChange: (value: string) => void;
  trackingNumber: string;
  onTrackingNumberChange: (value: string) => void;
};

/**
 * ที่อยู่ผู้รับ + ขนส่ง/เลขพัสดุ
 *
 * ค่าในฟอร์มถูกยกขึ้นไปเก็บที่ OrderDetailContent เพราะปุ่ม "ยืนยันจัดส่ง"
 * อยู่มุมขวาบนของหน้า ต้องรู้ว่ากรอกเลขพัสดุแล้วหรือยัง
 */
export function ShippingInfoCard({
  title,
  recipientTitle,
  copyLabel,
  copiedLabel,
  recipientLines,
  carrierLabel,
  trackingLabel,
  form,
  shipment,
  carrier,
  onCarrierChange,
  trackingNumber,
  onTrackingNumberChange,
}: ShippingInfoCardProps) {
  const [copied, setCopied] = useState(false);
  const carrierId = useId();
  const trackingId = useId();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(recipientLines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // เบราว์เซอร์ไม่ให้สิทธิ์ clipboard ก็แค่ไม่ขึ้นว่าคัดลอกแล้ว
    }
  }

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-base font-semibold text-zinc-950">{title}</p>

      <div className="flex flex-col gap-2 rounded-[10px] border border-gray-100 bg-neutral-50 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserIcon aria-hidden="true" className="size-4 text-slate-500" />
            <p className="text-xs font-semibold text-gray-700">
              {recipientTitle}
            </p>
          </div>

          <Button
            variant="ghost"
            size="xs"
            onClick={handleCopy}
            className="h-auto gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-teal-600 hover:bg-[#e6f4f2] hover:text-teal-600"
          >
            {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
            <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
          </Button>
        </div>

        <address className="flex flex-col text-xs leading-5 text-gray-700 not-italic">
          {recipientLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </address>
      </div>

      {form ? (
        <>
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={carrierId} className={LABEL_CLASS}>
                {carrierLabel} *
              </Label>
              <Select
                items={Object.fromEntries(
                  form.carriers.map((option) => [option.value, option.label]),
                )}
                value={carrier}
                onValueChange={(value) => onCarrierChange(value ?? "")}
              >
                <SelectTrigger id={carrierId} className={`${FIELD_CLASS} w-full`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {form.carriers.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={trackingId} className={LABEL_CLASS}>
                {trackingLabel} *
              </Label>
              <Input
                id={trackingId}
                required
                value={trackingNumber}
                onChange={(event) => onTrackingNumberChange(event.target.value)}
                placeholder={form.trackingPlaceholder}
                className={`${FIELD_CLASS} px-2.5`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#fdf0dd] px-3.5 py-2.5">
            <TriangleAlert
              aria-hidden="true"
              className="size-4 shrink-0 text-[#b45309]"
            />
            <p className="flex-1 text-xs leading-4 text-[#b45309]">{form.note}</p>
          </div>
        </>
      ) : null}

      {shipment ? (
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={carrierId} className={LABEL_CLASS}>
              {carrierLabel}
            </Label>
            <Input
              id={carrierId}
              readOnly
              value={shipment.carrier}
              className={`${FIELD_CLASS} px-2.5`}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={trackingId} className={LABEL_CLASS}>
              {trackingLabel}
            </Label>
            <Input
              id={trackingId}
              readOnly
              value={shipment.trackingNumber}
              className={`${FIELD_CLASS} px-2.5`}
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
