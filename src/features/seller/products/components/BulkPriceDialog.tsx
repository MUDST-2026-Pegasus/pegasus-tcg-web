import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { formatBaht } from "@/features/seller/shared/seller.format";

import { adjustPrice, canBulkReprice } from "../products.rules";
import type { SellerListingSummary } from "../products.types";
import { useTranslate } from "@/lib/i18n";

/** เปอร์เซ็นต์ติดลบได้ (ลดราคา) ทศนิยมไม่เกิน 2 ตำแหน่ง */
const PERCENT_PATTERN = /^-?\d{0,3}(\.\d{0,2})?$/;

type BulkPriceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: SellerListingSummary[];
  onSubmit: (percent: number) => void;
};

/** ปรับราคาหลายประกาศเป็นเปอร์เซ็นต์เดียวกัน เช่น -10 = ลด 10% */
export function BulkPriceDialog({
  open,
  onOpenChange,
  listings,
  onSubmit,
}: BulkPriceDialogProps) {
  const { t } = useTranslate("seller");
  const [percentText, setPercentText] = useState("");
  const inputId = useId();

  const eligible = listings.filter(canBulkReprice);
  const skipped = listings.length - eligible.length;
  const percent = Number(percentText);
  const valid =
    percentText !== "" &&
    Number.isFinite(percent) &&
    percent !== 0 &&
    percent > -100 &&
    percent < 1000 &&
    eligible.length > 0;
  const example = eligible[0];

  function handleOpenChange(next: boolean) {
    if (next) setPercentText("");
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (valid) onSubmit(percent);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[420px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-base font-bold text-foreground">
              {t("products.bulkPrice.title", "แก้ไขราคาพร้อมกัน")}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {t("products.bulkPrice.description", "ปรับ {count} ประกาศเป็นเปอร์เซ็นต์เดียวกัน", { count: eligible.length })}
              {skipped > 0
                ? t("products.bulkPrice.skipped", " · ข้าม {count} ประกาศที่ตั้งราคาตามตลาดหรือปิดไปแล้ว", { count: skipped })
                : ""}
            </DialogDescription>
          </div>

          <Field className="gap-1.5">
            <FieldLabel htmlFor={inputId} className="text-xs">
              {t("products.bulkPrice.adjust", "ปรับราคา")}
            </FieldLabel>
            <InputGroup className="h-9">
              <InputGroupInput
                id={inputId}
                autoFocus
                inputMode="decimal"
                placeholder={t("products.bulkPrice.placeholder", "เช่น -10 หรือ 5")}
                value={percentText}
                onChange={(event) => {
                  const typed = event.target.value.trim();
                  if (PERCENT_PATTERN.test(typed)) setPercentText(typed);
                }}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>%</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription className="text-[11px]">
              {t("products.bulkPrice.hint", "ติดลบ = ลดราคา · ปัดเป็นสตางค์ · ใช้กับการ์ดทุกใบบนแต่ละประกาศ")}
            </FieldDescription>
          </Field>

          {valid && example ? (
            <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-gray-600">
              {t("products.bulkPrice.example", "ตัวอย่าง: {name} {price} →", { name: example.card.productName, price: formatBaht(example.price) })}{" "}
              <span className="font-semibold text-foreground">
                {formatBaht(adjustPrice(example.price, percent))}
              </span>
            </p>
          ) : null}

          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md px-2.5"
              onClick={() => handleOpenChange(false)}
            >
              {t("actions.cancel", "ยกเลิก", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-md px-2.5"
              disabled={!valid}
            >
              {t("products.bulkPrice.submit", "ปรับราคา {count} ประกาศ", { count: eligible.length })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
