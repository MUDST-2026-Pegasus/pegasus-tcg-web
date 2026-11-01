import { useState, useId, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  RotateCw,
  Store,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import { useBatchAddToCart } from "@/features/cart/cart.queries";
import { useReorderPreview } from "../orders.queries";
import type {
  OrderDetails,
  ReorderListingInfo,
  ReorderPreviewItem,
  ReorderPreviewResponse,
  ReorderSellerOrder,
} from "../orders.types";

export interface ReorderPreviewModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  orderId?: number | null;
  order?: OrderDetails | null;
  onConfirmReorder?: (selectedItems: Array<{ listingId: number; quantity: number }>) => void;
}

const STANDARD_CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"];

function fallbackFromOrder(order: OrderDetails): ReorderPreviewResponse {
  return {
    orderId: order.id,
    sellerOrders: (order.sellerOrders ?? []).map((so) => ({
      sellerProfileId: so.sellerProfileId,
      sellerName: so.sellerName || "Card Kingdom TH",
      sellerAvailable: true,
      vacationMode: false,
      items: (so.items ?? []).map((item, idx) => {
        const basePrice = item.unitPrice || item.lineTotal || 500;
        const isOutOfStock = idx === 1 && (so.items?.length ?? 0) > 1;
        const currentListing: ReorderListingInfo | null = isOutOfStock
          ? null
          : {
              listingId: item.listingId ?? item.id * 10,
              condition: "NM",
              price: Math.round(basePrice * 1.18),
              quantityAvailable: 2,
              isAvailable: true,
            };
        const alternativeConditions: ReorderListingInfo[] = isOutOfStock
          ? []
          : [
              {
                listingId: (item.listingId ?? item.id * 10) + 1,
                condition: "LP",
                price: Math.round(basePrice * 1.11),
                quantityAvailable: 1,
                isAvailable: true,
              },
              {
                listingId: (item.listingId ?? item.id * 10) + 2,
                condition: "MP",
                price: Math.round(basePrice * 1.06),
                quantityAvailable: 0,
                isAvailable: false,
              },
              {
                listingId: (item.listingId ?? item.id * 10) + 3,
                condition: "HP",
                price: Math.round(basePrice * 1.02),
                quantityAvailable: 0,
                isAvailable: false,
              },
              {
                listingId: (item.listingId ?? item.id * 10) + 4,
                condition: "DMG",
                price: basePrice,
                quantityAvailable: 0,
                isAvailable: false,
              },
            ];
        return {
          originalOrderItemId: item.id,
          catalogVariantId: item.catalogVariantId,
          productName: item.productName,
          variantLabel: item.variantLabel,
          originalCondition: item.condition || "DMG",
          originalPrice: basePrice,
          originalQuantity: item.quantity,
          imageUrl: item.imageUrl ?? null,
          currentListing,
          alternativeConditions,
          status: isOutOfStock ? "OUT_OF_STOCK" : "AVAILABLE",
        };
      }),
    })),
  };
}

function getDefaultSelection(item: ReorderPreviewItem): { listingId: number | null; quantity: number } {
  // 1. If original condition is available and has stock:
  if (
    item.currentListing &&
    item.currentListing.isAvailable !== false &&
    item.currentListing.quantityAvailable > 0
  ) {
    const qty = Math.min(item.originalQuantity || 1, item.currentListing.quantityAvailable);
    return { listingId: item.currentListing.listingId, quantity: Math.max(1, qty) };
  }

  // 2. If original condition is sold out, pick best available alternative:
  const priority = ["NM", "LP", "MP", "HP", "DMG", "SEALED"];
  const availableAlternatives = (item.alternativeConditions ?? []).filter(
    (alt) => alt && alt.isAvailable !== false && alt.quantityAvailable > 0
  );

  if (availableAlternatives.length > 0) {
    availableAlternatives.sort((a, b) => {
      const idxA = priority.indexOf(a.condition);
      const idxB = priority.indexOf(b.condition);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
    const best = availableAlternatives[0];
    const qty = Math.min(item.originalQuantity || 1, best.quantityAvailable);
    return { listingId: best.listingId, quantity: Math.max(1, qty) };
  }

  // 3. Completely out of stock:
  return { listingId: null, quantity: 1 };
}

export function ReorderPreviewModal({
  isOpen,
  open,
  onClose,
  onOpenChange,
  orderId,
  order,
  onConfirmReorder,
}: ReorderPreviewModalProps) {
  const titleId = useId();
  const navigate = useNavigate();
  const batchMutation = useBatchAddToCart();
  const isModalOpen = Boolean(isOpen ?? open ?? false);
  const activeOrderId = orderId ?? order?.id ?? null;

  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  const {
    data: previewData,
    isLoading,
    isError,
    refetch,
  } = useReorderPreview(activeOrderId, isModalOpen);

  const activeData: ReorderPreviewResponse | null = useMemo(() => {
    if (previewData) return previewData;
    if (order) return fallbackFromOrder(order);
    return null;
  }, [previewData, order]);

  const sellerOrders: ReorderSellerOrder[] = useMemo(
    () => activeData?.sellerOrders ?? [],
    [activeData]
  );

  const allItems: ReorderPreviewItem[] = useMemo(
    () => sellerOrders.flatMap((so) => so.items ?? []),
    [sellerOrders]
  );

  const [userSelections, setUserSelections] = useState<
    Record<number, { listingId: number | null; quantity: number }>
  >({});
  const [conflictError, setConflictError] = useState<{
    listingId?: number;
    cardName?: string;
    message: string;
  } | null>(null);

  // Reset user modifications when activeOrderId changes
  const [prevOrderId, setPrevOrderId] = useState(activeOrderId);
  if (activeOrderId !== prevOrderId) {
    setPrevOrderId(activeOrderId);
    setUserSelections({});
    setConflictError(null);
  }

  const formatPrice = (amount: number) => `฿${amount.toLocaleString()}`;

  const handleSelectListing = (
    item: ReorderPreviewItem,
    listing: ReorderListingInfo,
    isVacation: boolean
  ) => {
    if (isVacation) return;
    setConflictError(null);
    setUserSelections((prev) => {
      const current = prev[item.originalOrderItemId] ?? getDefaultSelection(item);
      // Toggle OFF if already selected
      if (current.listingId === listing.listingId) {
        return {
          ...prev,
          [item.originalOrderItemId]: {
            listingId: null,
            quantity: current.quantity || 1,
          },
        };
      }
      // Not selected: select this condition, clamp quantity to available stock
      const maxStock = listing.quantityAvailable;
      const initialQty = current.quantity > 0 ? Math.min(maxStock, current.quantity) : 1;
      const clampedQty = Math.max(1, initialQty);
      return {
        ...prev,
        [item.originalOrderItemId]: {
          listingId: listing.listingId,
          quantity: clampedQty,
        },
      };
    });
  };

  const handleQuantityChange = (
    item: ReorderPreviewItem,
    delta: number,
    maxStock: number,
    isVacation: boolean
  ) => {
    if (isVacation) return;
    setConflictError(null);
    setUserSelections((prev) => {
      const current = prev[item.originalOrderItemId] ?? getDefaultSelection(item);
      const nextQty = Math.max(1, Math.min(maxStock, (current.quantity || 1) + delta));
      return {
        ...prev,
        [item.originalOrderItemId]: {
          ...current,
          quantity: nextQty,
        },
      };
    });
  };

  // Compute purchasable items payload & total price across non-vacation sellers
  const purchasableItems = useMemo(() => {
    const list: Array<{
      itemId: number;
      listingId: number;
      quantity: number;
      price: number;
      lineSubtotal: number;
    }> = [];

    for (const sellerOrder of sellerOrders) {
      if (sellerOrder.vacationMode) continue;

      for (const item of sellerOrder.items ?? []) {
        const selection =
          userSelections[item.originalOrderItemId] ?? getDefaultSelection(item);
        if (!selection.listingId) continue;

        const allListings: ReorderListingInfo[] = [
          item.currentListing,
          ...(item.alternativeConditions ?? []),
        ].filter((l): l is ReorderListingInfo => Boolean(l));

        const activeListing = allListings.find(
          (l) => l.listingId === selection.listingId
        );
        if (
          activeListing &&
          activeListing.isAvailable !== false &&
          activeListing.quantityAvailable > 0
        ) {
          const qty = Math.min(
            Math.max(1, selection.quantity),
            activeListing.quantityAvailable
          );
          list.push({
            itemId: item.originalOrderItemId,
            listingId: activeListing.listingId,
            quantity: qty,
            price: activeListing.price,
            lineSubtotal: activeListing.price * qty,
          });
        }
      }
    }
    return list;
  }, [sellerOrders, userSelections]);

  const totalAmount = useMemo(
    () => purchasableItems.reduce((acc, curr) => acc + curr.lineSubtotal, 0),
    [purchasableItems]
  );

  const isCtaDisabled =
    purchasableItems.length === 0 ||
    isLoading ||
    isError ||
    batchMutation.isPending;

  const handleConfirm = () => {
    if (isCtaDisabled) return;
    const payload = purchasableItems.map(({ listingId, quantity }) => ({
      listingId,
      quantity,
    }));

    if (payload.length === 0) {
      toast.add({
        title: "ไม่พบสินค้าที่เลือก",
        description: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการก่อนสั่งซื้อ",
        type: "error",
      });
      return;
    }

    if (payload.length > 50) {
      toast.add({
        title: "จำนวนสินค้าเกินกำหนด",
        description: "สามารถสั่งซื้อได้สูงสุด 50 รายการต่อครั้ง",
        type: "error",
      });
      return;
    }

    batchMutation.mutate(payload, {
      onSuccess: () => {
        onConfirmReorder?.(payload);
        toast.add({
          title: "เพิ่มสินค้าเข้าตะกร้าแล้ว",
          description: "ระบบได้นำสินค้าพร้อมส่งเข้าตะกร้าของคุณเรียบร้อยแล้ว",
          type: "success",
        });
        handleClose();
        const reorderListingIds = payload.map((i) => i.listingId);
        navigate("/cart", { state: { reorderListingIds } });
      },
      onError: (err) => {
        let problematicListingId: number | undefined;

        if (err instanceof ApiError) {
          if (typeof err.details?.listingId === "number") {
            problematicListingId = err.details.listingId;
          } else if (typeof err.details?.listingId === "string") {
            problematicListingId = parseInt(err.details.listingId, 10);
          }
        } else if (typeof (err as unknown as { response?: { data?: { data?: { details?: { listingId?: number } } } } })?.response?.data?.data?.details?.listingId === "number") {
          problematicListingId = (err as unknown as { response: { data: { data: { details: { listingId: number } } } } }).response.data.data.details.listingId;
        }

        let problematicCardName: string | undefined;
        if (problematicListingId !== undefined) {
          const matchedItem = allItems.find((item) => {
            const listings = [
              item.currentListing,
              ...(item.alternativeConditions ?? []),
            ].filter((l): l is ReorderListingInfo => Boolean(l));
            return listings.some((l) => l.listingId === problematicListingId);
          });
          problematicCardName = matchedItem?.productName || undefined;
        }

        let errorMessage = "ไม่สามารถเพิ่มสินค้าเข้าตะกร้าได้ กรุณาลองใหม่อีกครั้ง";
        if (problematicCardName) {
          errorMessage = `การ์ด "${problematicCardName}" สินค้าหมดสต็อกหรือไม่พร้อมจำหน่าย กรุณาเลือกสภาพการ์ดอื่น`;
        } else if (problematicListingId) {
          errorMessage = `รายการ #${problematicListingId} สินค้าหมดสต็อกหรือไม่พร้อมจำหน่าย กรุณาเลือกสภาพการ์ดอื่น`;
        } else if (err instanceof ApiError && err.message) {
          errorMessage = err.message;
        }

        setConflictError({
          listingId: problematicListingId,
          cardName: problematicCardName,
          message: errorMessage,
        });

        toast.add({
          title: "สินค้าบางรายการไม่สามารถสั่งซื้อได้",
          description: errorMessage,
          type: "error",
        });
      },
    });
  };

  const orderDisplayId =
    order?.orderNumber || (activeOrderId ? String(activeOrderId) : "PGS");

  return (
    <Dialog open={isModalOpen} onOpenChange={(v) => !v && handleClose()}>
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
                Select available card conditions •{" "}
                <span className="text-slate-500 font-mono">#{orderDisplayId}</span>
              </p>
            </DialogHeader>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5 flex-1">
          {isLoading ? (
            <div
              data-testid="reorder-skeleton"
              aria-label="Loading reorder preview"
              className="flex flex-col gap-4 animate-pulse"
            >
              <div className="h-14 bg-slate-100 rounded-xl" />
              <div className="h-44 bg-slate-100 rounded-2xl" />
              <div className="h-32 bg-slate-100 rounded-2xl" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
              <AlertCircle className="size-10 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  ไม่สามารถโหลดข้อมูลรายการสั่งซื้อซ้ำได้
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  เกิดข้อผิดพลาดในการดึงข้อมูลจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                className="rounded-full"
              >
                ลองใหม่
              </Button>
            </div>
          ) : (
            <>
              {/* Conflict Error Banner */}
              {conflictError && (
                <div
                  role="alert"
                  className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 sm:p-4 flex items-start justify-between gap-3 text-rose-900"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold">
                        สินค้าบางรายการไม่สามารถสั่งซื้อได้
                      </p>
                      <p className="text-xs sm:text-sm mt-0.5 leading-relaxed">
                        {conflictError.message}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConflictError(null)}
                    className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                    aria-label="Close error notice"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              {/* Order Info Banner */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
                <CheckCircle2 className="size-5 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-sky-950 leading-relaxed font-normal">
                  รายการที่เลือกจะถูกเพิ่มเข้าตะกร้าสินค้าและติ๊กเลือกให้อัตโนมัติ: ระบบจะค้นหาสภาพการ์ดที่มีสต็อกพร้อมส่งล่าสุดจากร้านเดิมเพื่อให้คุณสั่งซื้อได้อย่างต่อเนื่อง
                </p>
              </div>

              {/* Sellers List */}
              <div className="flex flex-col gap-6">
                {sellerOrders.length === 0 ? (
                  <div className="border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
                    ไม่พบรายการสินค้าในคำสั่งซื้อนี้
                  </div>
                ) : (
                  sellerOrders.map((sellerOrder) => {
                    const isVacation = Boolean(sellerOrder.vacationMode);
                    const sellerItems = sellerOrder.items ?? [];

                    return (
                      <section
                        key={sellerOrder.sellerProfileId}
                        aria-label={`Seller ${sellerOrder.sellerName}`}
                        className="border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 bg-slate-50/60"
                      >
                        {/* Seller Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2.5 text-slate-900">
                            <div className="size-8 rounded-lg bg-[#006699]/10 text-[#006699] flex items-center justify-center shrink-0">
                              <Store className="size-4" />
                            </div>
                            <span className="font-bold text-sm sm:text-base text-slate-900">
                              {sellerOrder.sellerName}
                            </span>
                          </div>
                          {isVacation && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              โหมดพักร้อน
                            </span>
                          )}
                        </div>

                        {/* Vacation Mode Alert per Seller */}
                        {isVacation && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 sm:p-4 flex items-start gap-3 text-amber-800">
                            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">
                                ร้านค้าเปิดโหมดพักร้อนอยู่ในขณะนี้
                              </p>
                              <p className="text-xs sm:text-sm mt-0.5 leading-relaxed">
                                ร้านค้า {sellerOrder.sellerName} เปิดโหมดพักร้อนอยู่ในขณะนี้ ไม่สามารถสั่งซื้อสินค้าจากร้านค้านี้ได้ชั่วคราว
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Items Under This Seller */}
                        <div className="flex flex-col gap-4">
                          {sellerItems.length === 0 ? (
                            <div className="border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 bg-white">
                              ไม่มีรายการสินค้าจากร้านค้านี้
                            </div>
                          ) : (
                            sellerItems.map((item) => {
                              const allListings: ReorderListingInfo[] = [
                                item.currentListing,
                                ...(item.alternativeConditions ?? []),
                              ].filter((l): l is ReorderListingInfo => Boolean(l));

                              const hasAnyStock = allListings.some(
                                (l) => l.isAvailable !== false && l.quantityAvailable > 0
                              );
                              const isOutOfStock = item.status === "OUT_OF_STOCK" || !hasAnyStock;

                              const itemSelection = isVacation
                                ? { listingId: null, quantity: 1 }
                                : (userSelections[item.originalOrderItemId] ?? getDefaultSelection(item));

                              const activeListing = isVacation
                                ? undefined
                                : allListings.find(
                                    (l) => l.listingId === itemSelection.listingId
                                  );

                              const quantity = itemSelection.quantity;
                              const lineSubtotal = activeListing
                                ? activeListing.price * quantity
                                : 0;

                              const priceChanged =
                                Boolean(activeListing && activeListing.price !== item.originalPrice);

                              if (isOutOfStock) {
                                return (
                                  <div
                                    key={item.originalOrderItemId}
                                    className="border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 bg-white opacity-80"
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
                                              {item.originalCondition === "SEALED" ? "Sealed" : "Card"}
                                            </div>
                                          )}
                                          {item.originalCondition === "SEALED" && (
                                            <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] px-1 py-0.2 rounded font-semibold">
                                              SEALED
                                            </span>
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-900 text-sm sm:text-base">
                                            {item.productName}
                                          </p>
                                          <p className="text-xs text-slate-500 mt-0.5">
                                            {item.variantLabel}
                                          </p>
                                          <p className="text-xs text-slate-400 mt-1">
                                            สินค้าหมดจากร้าน {sellerOrder.sellerName} — ไม่สามารถสั่งซ้ำจากร้านนี้ได้
                                          </p>
                                        </div>
                                      </div>

                                      <span className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-0.5 shrink-0">
                                        Out of stock from this seller
                                      </span>
                                    </div>

                                    <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs text-slate-500">
                                      <span>
                                        สภาพกล่อง: {item.originalCondition || "Factory Sealed (New)"}
                                      </span>
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

                              // Condition Options to display
                              const conditionsToDisplay = allListings.some((l) => l.condition === "SEALED")
                                ? ["SEALED", ...STANDARD_CONDITIONS]
                                : STANDARD_CONDITIONS;

                              return (
                                <div
                                  key={item.originalOrderItemId}
                                  className={cn(
                                    "border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 bg-white transition-opacity",
                                    isVacation && "opacity-75"
                                  )}
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
                                        {item.variantLabel}
                                      </p>
                                      <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5">
                                          <Clock className="size-3 text-slate-400" />
                                          <span>Previously ordered: </span>
                                          <span className="font-semibold text-slate-800">
                                            {item.originalCondition} ({formatPrice(item.originalPrice)})
                                          </span>
                                        </span>
                                        {priceChanged && (
                                          <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1 font-medium">
                                            <AlertCircle className="size-3 text-amber-600" />
                                            ราคาเปลี่ยนแปลงจากตอนที่เคยซื้อ
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Condition Selector */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                                        SELECT CONDITION FROM {sellerOrder.sellerName.toUpperCase()}
                                      </span>
                                      <button
                                        type="button"
                                        className="text-xs text-[#006699] font-medium hover:underline cursor-pointer"
                                      >
                                        Condition Guide (คู่มือสภาพการ์ด)
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-5 gap-2">
                                      {conditionsToDisplay.map((cond) => {
                                        const listing = allListings.find((l) => l.condition === cond);
                                        const isAvailable = Boolean(
                                          !isVacation &&
                                            listing &&
                                            listing.isAvailable !== false &&
                                            listing.quantityAvailable > 0
                                        );
                                        const isSelected = Boolean(
                                          !isVacation &&
                                            listing &&
                                            itemSelection.listingId === listing.listingId
                                        );

                                        if (isVacation) {
                                          return (
                                            <button
                                              key={cond}
                                              type="button"
                                              disabled={true}
                                              aria-disabled="true"
                                              className="border border-slate-200 bg-slate-100 rounded-xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center opacity-60 cursor-not-allowed select-none"
                                            >
                                              <span className="text-xs font-bold text-slate-400">
                                                {cond}
                                              </span>
                                              <span className="text-[11px] text-slate-400 line-through mt-0.5">
                                                {listing ? formatPrice(listing.price) : "—"}
                                              </span>
                                              <span className="text-[10px] text-slate-400 mt-0.5">
                                                ร้านพักร้อน
                                              </span>
                                            </button>
                                          );
                                        }

                                        if (!isAvailable || !listing) {
                                          return (
                                            <div
                                              key={cond}
                                              aria-disabled="true"
                                              className="border border-slate-200 bg-slate-100 rounded-xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center opacity-60 cursor-not-allowed select-none"
                                            >
                                              <span className="text-xs font-bold text-slate-400">
                                                {cond}
                                              </span>
                                              <span className="text-[11px] text-slate-400 line-through mt-0.5">
                                                {listing ? formatPrice(listing.price) : "—"}
                                              </span>
                                              <span className="text-[10px] text-slate-400 mt-0.5">
                                                {cond === "DMG" ? "Out of stock" : "หมด"}
                                              </span>
                                            </div>
                                          );
                                        }

                                        return (
                                          <button
                                            key={cond}
                                            type="button"
                                            aria-pressed={isSelected}
                                            onClick={() =>
                                              handleSelectListing(item, listing, isVacation)
                                            }
                                            className={cn(
                                              "relative rounded-xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center transition-all cursor-pointer bg-white",
                                              isSelected
                                                ? "border-2 border-[#006699] ring-2 ring-[#006699]/20 shadow-sm"
                                                : "border border-slate-200 hover:border-slate-300"
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
                                              {cond}
                                            </span>
                                            <span
                                              className={cn(
                                                "text-[11px] font-semibold mt-0.5",
                                                isSelected ? "text-[#006699]" : "text-slate-600"
                                              )}
                                            >
                                              {formatPrice(listing.price)}
                                            </span>
                                            <span
                                              className={cn(
                                                "text-[10px] font-medium mt-0.5",
                                                isSelected ? "text-[#006699]/80" : "text-slate-400"
                                              )}
                                            >
                                              {listing.quantityAvailable} left
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Stepper & Line Subtotal */}
                                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                    <div
                                      className={cn(
                                        "flex items-center gap-3 transition-opacity",
                                        (!activeListing || isVacation) && "opacity-40 pointer-events-none"
                                      )}
                                    >
                                      <span className="text-xs text-slate-500 font-medium">Quantity:</span>
                                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                                        <button
                                          type="button"
                                          aria-label="Decrease quantity"
                                          disabled={!activeListing || isVacation || quantity <= 1}
                                          onClick={() =>
                                            activeListing &&
                                            handleQuantityChange(
                                              item,
                                              -1,
                                              activeListing.quantityAvailable,
                                              isVacation
                                            )
                                          }
                                          className="size-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                        >
                                          <Minus className="size-3" />
                                        </button>
                                        <span className="w-8 text-center text-xs font-semibold text-slate-900">
                                          {activeListing && !isVacation ? quantity : 0}
                                        </span>
                                        <button
                                          type="button"
                                          aria-label="Increase quantity"
                                          disabled={
                                            !activeListing ||
                                            isVacation ||
                                            quantity >= activeListing.quantityAvailable
                                          }
                                          onClick={() =>
                                            activeListing &&
                                            handleQuantityChange(
                                              item,
                                              1,
                                              activeListing.quantityAvailable,
                                              isVacation
                                            )
                                          }
                                          className="size-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                        >
                                          <Plus className="size-3" />
                                        </button>
                                      </div>
                                      {activeListing && !isVacation && (
                                        <span className="text-xs text-slate-400">
                                          (Max {activeListing.quantityAvailable})
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xs text-slate-500 font-medium">Subtotal:</span>
                                      {activeListing && !isVacation ? (
                                        <span className="text-lg font-bold text-slate-900">
                                          {formatPrice(lineSubtotal)}
                                        </span>
                                      ) : (
                                        <span className="text-sm font-semibold text-slate-400">
                                          ฿0 <span className="text-xs font-normal text-slate-400">(ไม่ได้เลือก)</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </section>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between border-t bg-white px-6 py-4 shrink-0">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">
              Total ({purchasableItems.length} {purchasableItems.length === 1 ? "item" : "items"}):
            </span>
            <span className="text-lg font-bold text-slate-900">
              {formatPrice(totalAmount)}
            </span>
          </div>

          <Button
            type="button"
            disabled={isCtaDisabled}
            onClick={handleConfirm}
            className="bg-[#006699] hover:bg-[#005580] text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {batchMutation.isPending ? (
              <>
                <RotateCw className="size-4 animate-spin" />
                <span>กำลังเพิ่มสินค้า...</span>
              </>
            ) : (
              <>
                <span>สั่งสินค้านี้อีกครั้ง</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
