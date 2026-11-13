import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { TextLinesSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import type { SellerOrderDetails } from "@/features/account/orders.types";

import { afterSalesApi } from "./after-sales.api";
import { BuyerOrderReview } from "./BuyerOrderReview";
import { BuyerReturnConfirmationDialog } from "./components/BuyerReturnConfirmationDialog";
import { returnReasonLabel, returnStatusLabel } from "./after-sales.format";
import { translateError, useTranslate } from "@/lib/i18n";

const reasons = ["NOT_AS_DESCRIBED", "DAMAGED", "WRONG_ITEM", "NOT_RECEIVED", "COUNTERFEIT", "OTHER"];

export function BuyerAfterSales({ order }: { order: SellerOrderDetails }) {
  const { t } = useTranslate("buyer");
  const cache = useQueryClient();
  const returns = useQuery({
    queryKey: ["finance", "buyer-returns", order.id],
    queryFn: () => afterSalesApi.buyerReturns(order.id),
  });
  const evidence = useFileUpload({ purpose: "RETURN_EVIDENCE", multiple: true, maxFiles: 10 });
  const [reason, setReason] = useState(reasons[0]);
  const [description, setDescription] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [tracking, setTracking] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const canReturn = ["SHIPPED", "DELIVERED"].includes(order.status)
    && !!order.autoCompleteAt
    && Date.parse(order.autoCompleteAt) > returns.dataUpdatedAt;

  async function act(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      await cache.invalidateQueries({ queryKey: ["finance", "buyer-returns", order.id] });
      toast.add({ type: "success", title: success });
    } catch (error) {
      toast.add({
        type: "error",
        title: t("buyerAfterSales.actionFailed", "ดำเนินการไม่สำเร็จ"),
        description: translateError(error, t("buyerAfterSales.retryHint", "กรุณาลองอีกครั้ง")),
      });
    } finally {
      setBusy(false);
    }
  }

  async function createReturn() {
    const items = order.items
      .map((item) => ({ orderItemId: item.id, quantity: quantities[item.id] ?? 0 }))
      .filter((item) => item.quantity > 0);
    if (!items.length) return;

    await act(
      () => afterSalesApi.requestReturn(order.id, {
        reasonCode: reason,
        description,
        evidenceKeys: evidence.objectKeys,
        items,
      }),
      t("buyerAfterSales.requestReturnSuccess", "ส่งคำขอคืนสินค้าแล้ว"),
    );
  }

  return (
    <section className="space-y-3 border-t pt-3 text-sm">
      <h4 className="font-semibold">{t("buyerAfterSales.sectionTitle", "คืนสินค้าและรีวิวร้าน")}</h4>
      {returns.isPending && (
        <div role="status" aria-busy="true" aria-label={t("buyerAfterSales.loadingReturnsAria", "กำลังโหลดคำขอคืนสินค้า")}>
          <TextLinesSkeleton lines={2} />
        </div>
      )}
      {returns.isError && (
        <p role="alert">
          {t("buyerAfterSales.loadReturnsFailed", "โหลดคำขอคืนสินค้าไม่สำเร็จ")}{" "}
          <Button variant="outline" size="sm" onClick={() => void returns.refetch()}>
            {t("actions.retry", "ลองอีกครั้ง", { ns: "common" })}
          </Button>
        </p>
      )}
      {returns.data?.map((item) => (
        <div key={item.id} className="space-y-2 rounded border p-3">
          <p>
            {t("buyerAfterSales.returnItemTitle", "คำขอคืน #{id} · {status} · {reason}", {
              id: item.id,
              status: returnStatusLabel(item.status, t),
              reason: returnReasonLabel(item.reasonCode, t),
            })}
          </p>
          {item.refundAmount != null && (
            <p>{t("buyerAfterSales.refundAmount", "ยอดคืน THB {amount}", { amount: item.refundAmount })}</p>
          )}
          {item.status === "AWAITING_RETURN_SHIPMENT" && (
            <div className="flex gap-2">
              <Input
                aria-label={t("buyerAfterSales.trackingInputAria", "เลขพัสดุคืน {id}", { id: item.id })}
                placeholder={t("buyerAfterSales.trackingPlaceholder", "เลขพัสดุส่งคืน")}
                value={tracking[item.id] ?? ""}
                onChange={(event) => setTracking((old) => ({ ...old, [item.id]: event.target.value }))}
              />
              <Button
                disabled={busy || !tracking[item.id]?.trim()}
                onClick={() => void act(
                  () => afterSalesApi.shipReturn(order.id, item.id, tracking[item.id].trim()),
                  t("buyerAfterSales.trackingSavedSuccess", "บันทึกเลขพัสดุแล้ว"),
                )}
              >
                {t("buyerAfterSales.shipReturnButton", "แจ้งส่งคืน")}
              </Button>
            </div>
          )}
        </div>
      ))}
      {canReturn && returns.data?.length === 0 && (
        <div className="space-y-3 rounded border p-3">
          <p className="font-medium">{t("buyerAfterSales.requestReturnCardTitle", "ขอคืนสินค้า (ก่อนสิ้นสุดระยะคืนสินค้า)")}</p>
          <Input
            aria-label={t("buyerAfterSales.descriptionAria", "รายละเอียดการคืน")}
            placeholder={t("buyerAfterSales.descriptionPlaceholder", "รายละเอียด")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          {order.items.map((item) => (
            <label key={item.id} className="flex items-center gap-2">
              {t("buyerAfterSales.productMaxQuantity", "{name} (สูงสุด {max})", { name: item.productName, max: item.quantity })}
              <Input
                className="max-w-24"
                type="number"
                min="0"
                max={item.quantity}
                value={quantities[item.id] ?? 0}
                onChange={(event) => setQuantities((old) => ({
                  ...old,
                  [item.id]: Math.min(item.quantity, Math.max(0, Number(event.target.value))),
                }))}
              />
            </label>
          ))}
          <label>
            {t("buyerAfterSales.evidenceLabel", "หลักฐานประกอบ (ไม่บังคับ)")}
            <Input
              type="file"
              multiple
              accept={evidence.accept}
              onChange={(event) => {
                if (event.target.files?.length) evidence.addFiles(event.target.files);
              }}
            />
          </label>
          {evidence.items.map((item) => (
            <p key={item.id}>
              {item.file.name}: {item.status === "error" ? item.error : item.status === "done" ? t("buyerAfterSales.uploaded", "อัปโหลดแล้ว") : t("buyerAfterSales.uploading", "กำลังอัปโหลด")}
            </p>
          ))}
          <Button
            disabled={busy || evidence.isUploading || !Object.values(quantities).some((value) => value > 0)}
            onClick={() => setConfirmReturn(true)}
          >
            {t("buyerAfterSales.sendRequestButton", "ส่งคำขอคืนสินค้า")}
          </Button>
        </div>
      )}

      <BuyerReturnConfirmationDialog
        open={confirmReturn}
        onOpenChange={setConfirmReturn}
        order={order}
        quantities={quantities}
        reason={reason}
        reasons={reasons}
        onReasonChange={setReason}
        isSubmitting={busy}
        onConfirm={() => {
          setConfirmReturn(false);
          void createReturn();
        }}
      />
      <BuyerOrderReview orderId={order.id} status={order.status} />
    </section>
  );
}
