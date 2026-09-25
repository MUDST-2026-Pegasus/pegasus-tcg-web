import { useId, useState, type FormEvent } from "react";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatBaht } from "@/features/seller/shared/seller.format";

import { listingErrorMessage, toNumber } from "../products.format";
import { useChangeListingPrice } from "../products.queries";
import { isPriceEditable } from "../products.rules";
import type { SellerListingSummary } from "../products.types";

import { AmountInput } from "./AmountInput";

/** ขอบบนของ `@Digits(integer = 12, fraction = 2)` ใน `ListingPriceRequest.java` */
const MAX_PRICE = 1e12;

type ListingPriceCellProps = {
  listing: SellerListingSummary;
  /** ร้านยังแก้ประกาศไม่ได้ (`canPublish = false`) */
  readOnly: boolean;
};

/**
 * ราคาในตาราง กดแล้วแก้ได้ทันที (`PATCH /{id}/price`) — ตารางเปลี่ยนเลขให้เห็นก่อน
 * backend ตอบ ถ้าพลาดย้อนกลับเป็นราคาเดิมพร้อมแจ้งเหตุผล
 *
 * แก้ได้เฉพาะประกาศราคาเอง (MANUAL) ที่ยังไม่ปิด — ประกาศราคาตามตลาด (AUTO_MEDIAN)
 * ถ้าส่ง MANUAL ไปจะเปลี่ยนวิธีตั้งราคาทิ้งโดยไม่ตั้งใจ จึงให้ไปแก้ที่หน้าแก้ไขประกาศแทน
 */
export function ListingPriceCell({ listing, readOnly }: ListingPriceCellProps) {
  const changePrice = useChangeListingPrice();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputId = useId();

  const name = listing.card.productName;
  const price = (
    <span className="text-xs font-semibold text-zinc-950">
      {formatBaht(listing.price)}
    </span>
  );

  if (listing.pricingMode === "AUTO_MEDIAN") {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<span tabIndex={0} className="flex items-center gap-1.5" />}
        >
          {price}
          <span className="rounded bg-sky-50 px-1 text-[10px] text-sky-700">
            อัตโนมัติ
          </span>
        </TooltipTrigger>
        <TooltipContent>
          ราคาตามตลาด ระบบปรับให้ทุกคืน เปลี่ยนวิธีตั้งราคาได้ที่หน้าแก้ไขประกาศ
        </TooltipContent>
      </Tooltip>
    );
  }

  if (readOnly || !isPriceEditable(listing)) {
    return price;
  }

  const next = toNumber(draft);
  const invalid = next === null || next <= 0 || next >= MAX_PRICE;

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(String(listing.price));
    }
    setOpen(nextOpen);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (next === null || invalid) return;

    setOpen(false);
    if (next === listing.price) return;

    changePrice.mutate(
      { id: listing.id, payload: { pricingMode: "MANUAL", price: next } },
      {
        onSuccess: () =>
          toast.add({
            type: "success",
            title: "เปลี่ยนราคาแล้ว",
            description: `${name} · ${formatBaht(next)}`,
          }),
        onError: (error) =>
          toast.add({
            type: "error",
            title: "เปลี่ยนราคาไม่สำเร็จ",
            description: listingErrorMessage(
              error,
              "ราคากลับเป็นค่าเดิมแล้ว ลองใหม่อีกครั้ง",
            ),
          }),
      },
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`แก้ราคา: ${name}`}
            className="group -mx-1 flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-gray-100"
          />
        }
      >
        {price}
        <Pencil
          aria-hidden="true"
          className="size-3 text-gray-400 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-3 rounded-xl p-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field className="gap-1.5">
            <FieldLabel htmlFor={inputId} className="text-xs">
              ราคาขายต่อใบ (บาท)
            </FieldLabel>
            <AmountInput
              id={inputId}
              autoFocus
              value={draft}
              onValueChange={setDraft}
              aria-invalid={invalid}
              className="h-8"
            />
            <FieldDescription className="text-[11px]">
              ใช้กับการ์ดทุกใบบนประกาศนี้
            </FieldDescription>
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md px-2.5"
              onClick={() => setOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-md px-2.5"
              disabled={invalid}
            >
              บันทึก
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
