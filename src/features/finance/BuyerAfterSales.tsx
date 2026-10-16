import { useState, useId } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, UploadCloud, X, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { TextLinesSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatOrderDateTime } from "@/features/account/order-stage";
import type { SellerOrderDetails } from "@/features/account/orders.types";
import { afterSalesApi } from "./after-sales.api";
import { returnReasonLabel, returnStatusLabel } from "./after-sales.format";
import { BuyerOrderReview } from "./BuyerOrderReview";

const reasons = ["NOT_AS_DESCRIBED", "DAMAGED", "WRONG_ITEM", "NOT_RECEIVED", "COUNTERFEIT", "OTHER"];
const reasonItems = reasons.map((code) => ({ value: code, label: returnReasonLabel(code) }));

function getReturnStatusBadge(status: string) {
  switch (status) {
    case "REQUESTED":
      return { variant: "secondary" as const, className: "bg-amber-100 text-amber-800 border-transparent" };
    case "AWAITING_RETURN_SHIPMENT":
      return { variant: "secondary" as const, className: "bg-blue-100 text-blue-800 border-transparent" };
    case "IN_TRANSIT":
      return { variant: "secondary" as const, className: "bg-purple-100 text-purple-800 border-transparent" };
    case "RETURNED":
    case "APPROVED":
    case "REFUNDED":
      return { variant: "secondary" as const, className: "bg-emerald-100 text-emerald-800 border-transparent" };
    case "REJECTED":
      return { variant: "outline" as const, className: "text-destructive border-destructive/30" };
    default:
      return { variant: "outline" as const, className: "text-muted-foreground" };
  }
}

export function BuyerAfterSales({
  order,
  defaultOpen = false,
}: {
  order: SellerOrderDetails;
  defaultOpen?: boolean;
}) {
  const cache = useQueryClient();
  const fileInputId = useId();
  const returns = useQuery({
    queryKey: ["finance", "buyer-returns", order.id],
    queryFn: () => afterSalesApi.buyerReturns(order.id),
  });
  const evidence = useFileUpload({ purpose: "RETURN_EVIDENCE", multiple: true, maxFiles: 10 });
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(defaultOpen);
  const [reason, setReason] = useState(reasons[0]);
  const [description, setDescription] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [tracking, setTracking] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  const canReturn =
    ["SHIPPED", "DELIVERED"].includes(order.status) &&
    !!order.autoCompleteAt &&
    Date.parse(order.autoCompleteAt) > returns.dataUpdatedAt;

  const hasReturns = (returns.data?.length ?? 0) > 0;
  const isCompleted = order.status === "COMPLETED";

  // Hide the entire section if no after-sales actions or reviews are applicable
  if (!returns.isPending && !returns.isError && !canReturn && !hasReturns && !isCompleted) {
    return null;
  }

  async function act(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      await cache.invalidateQueries({ queryKey: ["finance", "buyer-returns", order.id] });
      toast.add({ type: "success", title: success });
    } catch (error) {
      toast.add({
        type: "error",
        title: "ดำเนินการไม่สำเร็จ",
        description: getErrorMessage(error, "กรุณาลองอีกครั้ง"),
      });
    } finally {
      setBusy(false);
    }
  }

  async function createReturn() {
    const items = (order.items ?? [])
      .map((item) => ({ orderItemId: item.id, quantity: quantities[item.id] ?? 0 }))
      .filter((item) => item.quantity > 0);
    if (!items.length) return;
    await act(
      () =>
        afterSalesApi.requestReturn(order.id, {
          reasonCode: reason,
          description,
          evidenceKeys: evidence.objectKeys,
          items,
        }),
      "ส่งคำขอคืนสินค้าแล้ว"
    );
    setIsReturnFormOpen(false);
  }

  const selectedItemCount = Object.values(quantities).reduce((sum, q) => sum + (q > 0 ? q : 0), 0);

  return (
    <section className="space-y-3.5 border-t border-border/80 pt-4 text-sm">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-foreground">
          {isCompleted ? "รีวิวร้านค้าและบริการหลังการขาย" : "บริการหลังการขาย"}
        </h4>
        {canReturn && order.autoCompleteAt && !hasReturns && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground/80" />
            ขอคืนสินค้าได้ถึง {formatOrderDateTime(order.autoCompleteAt)}
          </span>
        )}
      </div>

      {returns.isPending && (
        <div role="status" aria-busy="true" aria-label="กำลังโหลดคำขอคืนสินค้า">
          <TextLinesSkeleton lines={2} />
        </div>
      )}

      {returns.isError && (
        <div
          role="alert"
          className="flex items-center justify-between p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>โหลดคำขอคืนสินค้าไม่สำเร็จ</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => void returns.refetch()}>
            ลองอีกครั้ง
          </Button>
        </div>
      )}

      {/* Existing Return Requests List */}
      {returns.data?.map((item) => {
        const badgeConfig = getReturnStatusBadge(item.status);
        return (
          <div
            key={item.id}
            className="space-y-3 rounded-xl border border-border/70 bg-card p-4 text-xs shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <p className="font-semibold text-sm text-foreground">
                  คำขอคืน #{item.id} · {returnStatusLabel(item.status)} · {returnReasonLabel(item.reasonCode)}
                </p>
              </div>
              <Badge variant={badgeConfig.variant} className={cn("text-xs font-medium", badgeConfig.className)}>
                {returnStatusLabel(item.status)}
              </Badge>
            </div>

            {item.refundAmount != null && (
              <p className="font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg inline-block">
                ยอดเงินคืนที่ระบุ: ฿{Number(item.refundAmount).toLocaleString()}
              </p>
            )}

            {item.status === "AWAITING_RETURN_SHIPMENT" && (
              <div className="pt-2 border-t border-border/60 space-y-2">
                <p className="font-medium text-foreground">แจ้งส่งพัสดุคืนร้านค้า</p>
                <div className="flex gap-2">
                  <Input
                    aria-label={`เลขพัสดุคืน ${item.id}`}
                    placeholder="ระบุเลขพัสดุส่งคืน"
                    value={tracking[item.id] ?? ""}
                    onChange={(e) => setTracking((old) => ({ ...old, [item.id]: e.target.value }))}
                    className="flex-1 rounded-lg text-xs"
                  />
                  <Button
                    size="sm"
                    disabled={busy || !tracking[item.id]?.trim()}
                    onClick={() =>
                      void act(
                        () => afterSalesApi.shipReturn(order.id, item.id, tracking[item.id].trim()),
                        "บันทึกเลขพัสดุแล้ว"
                      )
                    }
                  >
                    แจ้งส่งคืน
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Return Request Action or Form */}
      {canReturn && !hasReturns && (
        <>
          {!isReturnFormOpen ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 sm:p-4 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-background border border-border/60 text-primary shadow-xs shrink-0">
                    <RotateCcw className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">ต้องการแจ้งปัญหาหรือขอคืนสินค้า?</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      หากสินค้าชำรุด เสียหาย หรือไม่ตรงตามรายละเอียด สามารถยื่นคำขอคืนสินค้าได้
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReturnFormOpen(true)}
                  className="shrink-0 font-medium border-border/80 hover:bg-background cursor-pointer self-start sm:self-center"
                >
                  <RotateCcw className="size-3.5 mr-1.5" />
                  ขอคืนสินค้า
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-primary/25 bg-card p-4 sm:p-5 space-y-4 shadow-xs animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h5 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <RotateCcw className="size-4 text-primary" />
                    ยื่นคำขอคืนสินค้า
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    กรอกข้อมูลและเลือกสินค้าที่ต้องการขอคืน
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReturnFormOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5"
                >
                  ยกเลิก
                </Button>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  สาเหตุการคืนสินค้า <span className="text-destructive">*</span>
                </label>
                <Select
                  items={reasonItems}
                  value={reason}
                  onValueChange={(value) => setReason(value ?? reasons[0])}
                >
                  <SelectTrigger
                    aria-label="สาเหตุคืนสินค้า"
                    className="w-full rounded-lg border-border bg-background text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {reasonItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  รายละเอียดเพิ่มเติม (ไม่บังคับ)
                </label>
                <Textarea
                  aria-label="รายละเอียดการคืน"
                  placeholder="ระบุอาการ ตำหนิ หรือปัญหาที่พบเพื่อช่วยให้ร้านค้าตรวจสอบได้รวดเร็วยิ่งขึ้น..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-20 text-xs rounded-lg resize-y"
                />
              </div>

              {/* Items Quantity Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    เลือกรายการและระบุจำนวนที่ต้องการคืน <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    เลือกแล้ว {selectedItemCount} ชิ้น
                  </span>
                </div>
                <div className="space-y-2">
                  {(order.items ?? []).map((item) => {
                    const currentQty = quantities[item.id] ?? 0;
                    const isSelected = currentQty > 0;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between gap-3 p-3 rounded-lg border transition-all text-xs",
                          isSelected
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/60 bg-muted/20 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="size-11 rounded border bg-background overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-[9px] text-muted-foreground">Art</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">{item.productName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {[item.variantLabel, item.condition].filter(Boolean).join(" • ")} · มีทั้งหมด {item.quantity} ชิ้น
                            </p>
                          </div>
                        </div>

                        {/* Stepper Input */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-7 rounded-md"
                            disabled={currentQty <= 0}
                            onClick={() =>
                              setQuantities((old) => ({
                                ...old,
                                [item.id]: Math.max(0, currentQty - 1),
                              }))
                            }
                            aria-label={`ลดจำนวน ${item.productName}`}
                          >
                            -
                          </Button>
                          <Input
                            className="w-12 h-7 text-center text-xs p-1 rounded-md"
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={currentQty}
                            aria-label={item.productName}
                            onChange={(e) =>
                              setQuantities((old) => ({
                                ...old,
                                [item.id]: Math.min(item.quantity, Math.max(0, Number(e.target.value))),
                              }))
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-7 rounded-md"
                            disabled={currentQty >= item.quantity}
                            onClick={() =>
                              setQuantities((old) => ({
                                ...old,
                                [item.id]: Math.min(item.quantity, currentQty + 1),
                              }))
                            }
                            aria-label={`เพิ่มจำนวน ${item.productName}`}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Evidence Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  หลักฐานประกอบ (รูปภาพ) (ไม่บังคับ)
                </label>
                <div className="border border-dashed border-border rounded-lg p-3.5 text-center bg-muted/10 hover:bg-muted/20 transition-colors">
                  <label
                    htmlFor={fileInputId}
                    className="cursor-pointer flex flex-col items-center justify-center gap-1"
                  >
                    <UploadCloud className="size-5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">คลิกเพื่อเลือกไฟล์รูปภาพ</span>
                    <span className="text-[11px] text-muted-foreground">
                      รองรับ JPG, PNG, WebP สูงสุด 10 รูป
                    </span>
                    <input
                      id={fileInputId}
                      type="file"
                      multiple
                      accept={evidence.accept}
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files?.length) evidence.addFiles(e.target.files);
                      }}
                    />
                  </label>
                </div>

                {evidence.items.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {evidence.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-[11px] border border-border"
                      >
                        {item.previewUrl && (
                          <img
                            src={item.previewUrl}
                            alt={item.file.name}
                            className="size-4 object-cover rounded"
                          />
                        )}
                        <span className="max-w-32 truncate">{item.file.name}</span>
                        {item.status === "uploading" && (
                          <span className="text-muted-foreground text-[10px]">กำลังอัปโหลด...</span>
                        )}
                        {item.status === "done" && (
                          <CheckCircle2 className="size-3 text-emerald-600" />
                        )}
                        {item.status === "error" && (
                          <span className="text-destructive font-semibold">!</span>
                        )}
                        <button
                          type="button"
                          onClick={() => evidence.remove(item.id)}
                          className="text-muted-foreground hover:text-foreground ml-1"
                          aria-label={`ลบไฟล์ ${item.file.name}`}
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReturnFormOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || evidence.isUploading || selectedItemCount === 0}
                  onClick={() => void createReturn()}
                  className="font-medium"
                >
                  {busy ? "กำลังส่งคำขอ..." : "ส่งคำขอคืนสินค้า"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Review Section (shown when status === 'COMPLETED') */}
      <BuyerOrderReview orderId={order.id} status={order.status} />
    </section>
  );
}
