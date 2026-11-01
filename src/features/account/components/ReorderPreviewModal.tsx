import { useState, useId } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  RotateCw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { OrderDetails, OrderItemDetails } from "../orders.types";

export type ReorderPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetails | null;
};

type CardConditionOption = {
  code: string;
  price: number;
  stock: number;
  available: boolean;
};

export function ReorderPreviewModal({
  open,
  onOpenChange,
  order,
}: ReorderPreviewModalProps) {
  const titleId = useId();
  const [selectedConditions, setSelectedConditions] = useState<Record<number, string>>({});
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const sellerOrder = order.sellerOrders?.[0];
  const sellerName = sellerOrder?.sellerName || "Card Kingdom TH";
  const items: OrderItemDetails[] = (order.sellerOrders ?? []).flatMap(
    (so) => so.items ?? []
  );

  const formatPrice = (amount: number) => `฿${amount.toLocaleString()}`;

  const getConditionOptions = (item: OrderItemDetails): CardConditionOption[] => {
    const basePrice = item.unitPrice || item.lineTotal || 500;
    return [
      { code: "NM", price: Math.round(basePrice * 1.18), stock: 2, available: true },
      { code: "LP", price: Math.round(basePrice * 1.11), stock: 1, available: true },
      { code: "MP", price: Math.round(basePrice * 1.06), stock: 0, available: false },
      { code: "HP", price: Math.round(basePrice * 1.02), stock: 0, available: false },
      { code: "DMG", price: basePrice, stock: 0, available: false },
    ];
  };

  const handleConditionSelect = (itemId: number, conditionCode: string) => {
    setSelectedConditions((prev) => ({ ...prev, [itemId]: conditionCode }));
  };

  const handleQuantityChange = (itemId: number, delta: number, maxStock: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] ?? 1;
      const next = Math.max(1, Math.min(maxStock, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleConfirmReorder = () => {
    setIsSubmitting(true);
    try {
      toast.add({
        title: "เพิ่มสินค้าเข้าตะกร้าแล้ว",
        description: "ระบบได้นำสินค้าพร้อมส่งเข้าตะกร้าของคุณเรียบร้อยแล้ว",
        type: "success",
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] sm:max-w-3xl flex flex-col p-0 overflow-hidden rounded-2xl gap-0 bg-white shadow-2xl ring-0"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-start justify-between border-b bg-white px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-sky-50 text-[#006699] flex items-center justify-center shrink-0">
              <RotateCw className="size-5" />
            </div>
            <DialogHeader className="gap-0.5 text-left">
              <DialogTitle id={titleId} className="text-lg sm:text-xl font-bold text-slate-900">
                Reorder Items (สั่งซื้อสินค้าอีกครั้ง)
              </DialogTitle>
              <p className="text-xs sm:text-sm text-slate-500">
                Select available card conditions from Seller:{" "}
                <span className="font-semibold text-slate-900">{sellerName}</span>
                {" • "}
                <span className="text-slate-500 font-mono">#{order.orderNumber}</span>
              </p>
            </DialogHeader>
          </div>

          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Close"
              />
            }
          >
            <X className="size-4" />
          </DialogClose>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5 flex-1">
          {/* Blue Info Alert Banner */}
          <div className="bg-[#f0f8fc] border border-sky-200 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
            <CheckCircle2 className="size-5 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-sky-950 leading-relaxed font-normal">
              รายการที่เลือกจะถูกเพิ่มเข้าตะกร้าสินค้าและติ๊กเลือกให้อัตโนมัติ: ระบบจะค้นหาสภาพการ์ดที่มีสต็อกพร้อมส่งล่าสุดจากร้านค้าเดิมเพื่อให้คุณสั่งซื้อได้อย่างต่อเนื่อง
            </p>
          </div>

          {/* Items Container */}
          <div className="flex flex-col gap-4">
            {items.length === 0 ? (
              <div className="border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
                ไม่พบรายการสินค้าในคำสั่งซื้อนี้
              </div>
            ) : (
              items.map((item, index) => {
                const isOutOfStock = index === 1 && items.length > 1;
                const conditions = getConditionOptions(item);
                const selectedCondition = selectedConditions[item.id] ?? "NM";
                const activeOption =
                  conditions.find((c) => c.code === selectedCondition) ?? conditions[0];
                const quantity = quantities[item.id] ?? 1;
                const lineSubtotal = activeOption ? activeOption.price * quantity : item.lineTotal;

                if (isOutOfStock) {
                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="size-16 rounded-lg border bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center p-1 relative">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                                Sealed
                              </div>
                            )}
                            <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] px-1 py-0.2 rounded font-semibold">
                              SEALED
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm sm:text-base">
                              {item.productName}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {[item.variantLabel, "Factory Sealed Box"].filter(Boolean).join(" • ")}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              สินค้าหมดจากร้าน {sellerName} — ไม่สามารถสั่งซ้ำจากร้านนี้ได้
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-0.5 shrink-0">
                          Out of stock from this seller
                        </span>
                      </div>

                      <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs text-slate-500">
                        <span>สภาพกล่อง: Factory Sealed (New)</span>
                        <button
                          type="button"
                          className="text-[#006699] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Find from other sellers (หาร้านอื่น) →
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 bg-white"
                  >
                    {/* Item Details Header */}
                    <div className="flex items-start gap-3.5">
                      <div className="size-16 rounded-lg border bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center p-1 relative">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">Card</span>
                        )}
                        <span className="absolute bottom-1 right-1 bg-slate-800 text-white text-[9px] px-1 py-0.2 rounded font-semibold">
                          SR
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {[item.variantLabel, item.gameName || "Dragon Ball Super Card Game"]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                        <div className="mt-2">
                          <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5">
                            <Clock className="size-3 text-slate-400" />
                            Previously ordered:{" "}
                            <span className="font-semibold text-slate-800">
                              {item.condition || "DMG"} ({formatPrice(item.unitPrice || item.lineTotal)})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Condition Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                          SELECT CONDITION FROM {sellerName.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          className="text-xs text-[#006699] font-medium hover:underline cursor-pointer"
                        >
                          Condition Guide (คู่มือสภาพการ์ด)
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {conditions.map((cond) => {
                          const isSelected = selectedCondition === cond.code;
                          if (!cond.available) {
                            return (
                              <div
                                key={cond.code}
                                className="border border-slate-100 bg-slate-50/60 rounded-xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center opacity-50 cursor-not-allowed select-none"
                              >
                                <span className="text-xs font-bold text-slate-400">
                                  {cond.code}
                                </span>
                                <span className="text-[11px] text-slate-400 line-through mt-0.5">
                                  {formatPrice(cond.price)}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                  {cond.code === "DMG" ? "Out of stock" : "หมด"}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={cond.code}
                              type="button"
                              onClick={() => handleConditionSelect(item.id, cond.code)}
                              className={cn(
                                "relative rounded-xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center transition-all cursor-pointer",
                                isSelected
                                  ? "border-2 border-[#006699] bg-[#f0f8fc] shadow-sm"
                                  : "border border-slate-200 bg-white hover:border-slate-300"
                              )}
                            >
                              {isSelected && (
                                <span className="absolute -top-1.5 -right-1.5 bg-[#006699] text-white rounded-full p-0.5 size-4 flex items-center justify-center">
                                  <Check className="size-2.5 stroke-[3]" />
                                </span>
                              )}
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  isSelected ? "text-[#006699]" : "text-slate-800"
                                )}
                              >
                                {cond.code}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 mt-0.5">
                                {formatPrice(cond.price)}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-medium mt-0.5",
                                  isSelected ? "text-[#006699]" : "text-slate-500"
                                )}
                              >
                                {cond.stock} left
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantity & Subtotal Row */}
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600">Quantity:</span>
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={quantity <= 1}
                            onClick={() => handleQuantityChange(item.id, -1, activeOption.stock)}
                            className="size-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-slate-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={quantity >= activeOption.stock}
                            onClick={() => handleQuantityChange(item.id, 1, activeOption.stock)}
                            className="size-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="text-xs text-slate-400">
                          (Max {activeOption.stock})
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-slate-500 font-medium">Subtotal:</span>
                        <span className="text-lg font-bold text-slate-900">
                          {formatPrice(lineSubtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-20 flex items-center justify-end border-t bg-white px-6 py-4 shrink-0">
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmReorder}
            className="bg-[#006699] hover:bg-[#005580] text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <span>สั่งสินค้านี้อีกครั้ง</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
