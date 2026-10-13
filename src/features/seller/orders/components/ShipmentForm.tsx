import { useState } from "react";

import { Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

import { CARRIER_OPTIONS, carrierLabel, orderErrorMessage } from "../orders.format";
import { useShipOrder } from "../orders.queries";

/** ตรงกับ `@Size(max = 64)` ของ `ShipOrderRequest.trackingNumber` */
const TRACKING_MAX = 64;

type ShipmentFormProps = {
  orderId: number;
  orderNumber: string;
};

/**
 * เลขพัสดุ + ขนส่ง + ยืนยันจัดส่ง ในแถวเดียว สำหรับการ์ดในหน้ารายการ
 * ยังไม่มีเลขพัสดุ = ยืนยันไม่ได้ ระบบส่งเลขให้ผู้ซื้อเองหลังยืนยัน
 */
export function ShipmentForm({ orderId, orderNumber }: ShipmentFormProps) {
  const ship = useShipOrder();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState(CARRIER_OPTIONS[0].value);

  const tracking = trackingNumber.trim();

  function handleConfirm() {
    ship.mutate(
      {
        id: orderId,
        payload: {
          carrierCode: carrier,
          carrierName: carrierLabel(carrier),
          trackingNumber: tracking,
        },
      },
      {
        onSuccess: () =>
          toast.add({
            type: "success",
            title: "ยืนยันจัดส่งแล้ว",
            description: `${orderNumber} · ${carrierLabel(carrier)} ${tracking}`,
          }),
        onError: (error) =>
          toast.add({
            type: "error",
            title: "ยืนยันจัดส่งไม่สำเร็จ",
            description: orderErrorMessage(error, "ตรวจเลขพัสดุแล้วลองใหม่อีกครั้ง"),
          }),
      },
    );
  }

  return (
    <>
      <InputGroup className="h-8 min-w-32 flex-1 rounded-lg border-input bg-background">
        <InputGroupAddon>
          <Truck />
        </InputGroupAddon>
        <InputGroupInput
          value={trackingNumber}
          maxLength={TRACKING_MAX}
          onChange={(event) => setTrackingNumber(event.target.value)}
          aria-label={`เลขพัสดุของ ${orderNumber}`}
          placeholder="กรอกเลขพัสดุ"
        />
      </InputGroup>

      <Select
        items={CARRIER_OPTIONS}
        value={carrier}
        onValueChange={(value) => {
          if (value !== null) setCarrier(value);
        }}
      >
        <SelectTrigger
          aria-label="เลือกขนส่ง"
          className="h-8 w-48 rounded-lg border-input bg-background text-sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {CARRIER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        size="sm"
        className="rounded-md px-2.5"
        disabled={tracking === "" || ship.isPending}
        onClick={handleConfirm}
      >
        {ship.isPending ? <Spinner /> : null}
        ยืนยันจัดส่ง
      </Button>
    </>
  );
}
