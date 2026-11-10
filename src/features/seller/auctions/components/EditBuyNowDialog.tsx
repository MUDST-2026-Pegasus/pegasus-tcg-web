import { useState } from "react";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { formatBaht } from "@/features/auction/auction.format";
import { useUpdateAuction } from "@/features/auction/auction.queries";
import type { SellerAuctionDetail } from "@/features/auction/auction.types";
import { AmountInput } from "@/features/seller/products/components/AmountInput";
import { toNumber } from "@/features/seller/products/products.format";
import { ApiError } from "@/lib/api/errors";

import { buyNowPriceIssue, issueMessage } from "../auction-form.schema";
import { AuctionFieldError } from "./AuctionFieldError";
import { translateError, useTranslate } from "@/lib/i18n";

// eslint-disable-next-line no-restricted-syntax -- ฿ คือสัญลักษณ์สกุลเงิน (format เงินเป็นงาน I18N-02)
const BAHT_SIGN = "฿";

type EditBuyNowDialogProps = {
  detail: SellerAuctionDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * S3-F แก้ราคาซื้อทันที — ได้จนกว่าจะมีบิดแรก [TCG-634 · FE-8]
 * เปิดใหม่ทุกครั้งเริ่มจากค่าปัจจุบัน (หน้า S4 ใส่ key ตอนเปิด)
 */
export function EditBuyNowDialog({ detail, open, onOpenChange }: EditBuyNowDialogProps) {
  const { t } = useTranslate("auction");
  const update = useUpdateAuction(detail.id);
  const [enabled, setEnabled] = useState(detail.buyNowPrice !== null);
  const [price, setPrice] = useState(detail.buyNowPrice !== null ? String(detail.buyNowPrice) : "");
  const [submitted, setSubmitted] = useState(false);
  // server ตอบว่ามีคนบิดไปแล้วระหว่างที่ dialog เปิดอยู่
  const [hasBids, setHasBids] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const issue = enabled ? buyNowPriceIssue(price, detail.startingPrice) : null;
  const fieldError = serverError ?? (submitted && issue ? issueMessage(issue) : undefined);

  const save = () => {
    setSubmitted(true);
    setServerError(null);
    if (issue || update.isPending || hasBids) return;
    update.mutate(
      // หมายเหตุส่งค่าเดิม — dialog นี้แก้แค่ราคาซื้อทันที
      { buyNowPrice: enabled ? toNumber(price) : null, sellerNote: detail.sellerNote },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          if (error instanceof ApiError && error.code === "AUCTION_HAS_BIDS") {
            setHasBids(true);
          } else if (error instanceof ApiError && error.code === "BUY_NOW_BELOW_START") {
            setServerError(t("seller.editBuyNowDialog.text", "ราคาซื้อทันทีต้องสูงกว่าราคาเริ่มต้น"));
          } else {
            toast.add({ type: "error", title: t("seller.editBuyNowDialog.title", "บันทึกไม่สำเร็จ"), description: error instanceof ApiError ? translateError(error, error.message) : undefined });
          }
        },
      },
    );
  };

  const hint =
    detail.buyNowPrice !== null
      ? t("seller.editBuyNowDialog.text2", "เดิม {buyNowPrice} · ต้องสูงกว่าราคาเริ่มต้น {startingPrice}", { buyNowPrice: formatBaht(detail.buyNowPrice), startingPrice: formatBaht(detail.startingPrice) })
      : t("seller.editBuyNowDialog.text3", "ต้องสูงกว่าราคาเริ่มต้น {startingPrice}", { startingPrice: formatBaht(detail.startingPrice) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden rounded-2xl bg-card p-0 sm:max-w-[460px]">
        <div className="flex flex-col gap-4 px-6 pt-6 pb-5">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-base font-bold text-foreground">{t("seller.editBuyNowDialog.text4", "แก้ไขราคาซื้อทันที")}</DialogTitle>
            <DialogDescription className="text-xs leading-5 text-muted-foreground">
              {detail.item.card.productName} {t("seller.editBuyNowDialog.text5", "· ยังไม่มีผู้บิด · ราคาเริ่มต้น")}{" "}{formatBaht(detail.startingPrice)}
            </DialogDescription>
          </div>

          {hasBids ? (
            <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-red-700">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold">{t("seller.editBuyNowDialog.text6", "แก้ไม่ได้แล้ว — มีผู้บิดคนแรก")}</p>
                <p className="text-xs">{t("seller.editBuyNowDialog.text7", "ปุ่มซื้อทันทีหายไปแล้ว ประมูลนี้เป็นประมูลปกติจนหมดเวลา")}</p>
              </div>
            </div>
          ) : (
            <>
              <label className="flex items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3">
                <span className="text-sm font-medium text-foreground">{t("seller.editBuyNowDialog.text8", "เปิดซื้อทันที")}</span>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) => {
                    setEnabled(checked);
                    setServerError(null);
                  }}
                />
              </label>

              {enabled ? (
                <Field className="gap-1.5" data-invalid={Boolean(fieldError) || undefined}>
                  <FieldLabel htmlFor="edit-buy-now-price" className="text-xs font-medium text-gray-700">
                    {t("seller.editBuyNowDialog.text9", "ราคาซื้อทันที")}
                  </FieldLabel>
                  <div className="relative">
                    <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">{BAHT_SIGN}</span>
                    <AmountInput
                      id="edit-buy-now-price"
                      maxLength={16}
                      value={price}
                      onValueChange={(value) => {
                        setPrice(value);
                        setServerError(null);
                      }}
                      aria-invalid={Boolean(fieldError) || undefined}
                      className="h-9 rounded-lg border-input bg-background pl-7 text-sm"
                    />
                  </div>
                  <FieldDescription className="text-[11px] leading-normal text-gray-400">{hint}</FieldDescription>
                  <AuctionFieldError message={fieldError} />
                </Field>
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2.5 border-t border-muted bg-muted/30 px-6 py-4">
          <DialogClose render={<Button variant="outline" size="sm" className="rounded-md px-2.5" />}>{t("seller.editBuyNowDialog.text10", "ยกเลิก")}</DialogClose>
          <Button size="sm" className="rounded-md px-2.5" disabled={update.isPending || hasBids} onClick={save}>
            {update.isPending && <Spinner />}
            {t("seller.editBuyNowDialog.text11", "บันทึก")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
