import { useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Info, Layers, RotateCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReorderItems } from "../orders.queries";
import type {
  OrderDetails,
  ReorderItemDto,
  ReorderItemsResponse,
} from "../orders.types";
import { intlLocale } from "@/lib/i18n";

export interface ReorderPreviewModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  orderId?: number | null;
  order?: OrderDetails | null;
  onConfirmReorder?: (selectedItems: Array<{ listingId: number; quantity: number }>) => void;
}

function fallbackFromOrder(order: OrderDetails): ReorderItemsResponse {
  const items: ReorderItemDto[] = (order.sellerOrders ?? []).flatMap((so) =>
    (so.items ?? []).map((item) => ({
      orderItemId: item.id,
      catalogVariantId: item.catalogVariantId,
      productSlug: String(item.catalogVariantId),
      productName: item.productName,
      variantLabel: item.gameName ? `${item.variantLabel} • ${item.gameName}` : item.variantLabel,
      rarity: undefined,
      imageUrl: item.imageUrl ?? undefined,
      originalCondition: item.condition || "NM",
      originalPrice: item.unitPrice || item.lineTotal || 0,
      originalQuantity: item.quantity,
      originalSellerName: so.sellerName ?? undefined,
    }))
  );

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    items,
  };
}

function ReorderCardImage({
  imageUrl,
  productName,
  rarity,
}: {
  imageUrl?: string;
  productName: string;
  rarity?: string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative size-[72px] shrink-0 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
      {rarity && (
        <span className="absolute top-1 left-1 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none z-10 shadow-sm">
          {rarity}
        </span>
      )}
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={productName}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300">
          <Layers className="size-6 opacity-40" />
        </div>
      )}
    </div>
  );
}

export function ReorderPreviewModal({
  isOpen,
  open,
  onClose,
  onOpenChange,
  orderId,
  order,
}: ReorderPreviewModalProps) {
  const titleId = useId();
  const navigate = useNavigate();
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
  } = useReorderItems(activeOrderId, isModalOpen);

  const activeData: ReorderItemsResponse | null = useMemo(() => {
    if (previewData) return previewData;
    if (order) return fallbackFromOrder(order);
    return null;
  }, [previewData, order]);

  const uniqueItems = useMemo(() => {
    if (!activeData?.items) return [];
    return activeData.items.filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            (t.productSlug && t.productSlug === item.productSlug) ||
            (t.catalogVariantId && t.catalogVariantId === item.catalogVariantId)
        )
    );
  }, [activeData]);

  const displayOrderNumber =
    activeData?.orderNumber ||
    order?.orderNumber ||
    (activeOrderId ? String(activeOrderId) : "");

  const handleReorderClick = (item: ReorderItemDto) => {
    handleClose();
    // Prioritize productSlug for PDP routing (e.g. /products/fb05-119-son-goku-scr)
    const targetSlug = item.productSlug || item.catalogVariantId;
    navigate(`/products/${targetSlug}`);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-testid="reorder-modal"
        showCloseButton={false}
        overlayClassName="bg-black/50"
        className="max-h-[90vh] sm:max-w-2xl flex flex-col p-0 overflow-hidden rounded-2xl gap-0 bg-white text-slate-900 shadow-2xl border border-slate-200/80 outline-none"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-full bg-sky-50 text-[#006699] flex items-center justify-center shrink-0 mt-0.5">
              <RotateCw className="size-5" />
            </div>
            <DialogHeader className="gap-0 text-left">
              <DialogTitle
                id={titleId}
                aria-label="สั่งซื้อสินค้าอีกครั้ง (Reorder Items) - Reorder Items (สั่งซื้อสินค้าอีกครั้ง)"
                className="text-lg font-bold text-slate-900 leading-snug"
              >
                สั่งซื้อสินค้าอีกครั้ง{" "}
                <span className="font-normal text-slate-500 text-sm">
                  (Reorder Items)
                </span>
              </DialogTitle>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
                เลือกการ์ดที่ต้องการเพื่อไปยังหน้ารายละเอียดสินค้า • คำสั่งซื้อ{" "}
                <span className="font-mono">#{displayOrderNumber}</span>
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

        {/* Scrollable Content (Card Item List) */}
        <div className="overflow-y-auto max-h-[60vh] px-6 py-5 flex flex-col gap-3 bg-white flex-1">
          {isLoading ? (
            <div
              data-testid="reorder-skeleton"
              aria-label="Loading reorder preview"
              className="flex flex-col gap-3 animate-pulse"
            >
              <div className="h-24 bg-slate-100 rounded-xl" />
              <div className="h-24 bg-slate-100 rounded-xl" />
              <div className="h-24 bg-slate-100 rounded-xl" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
              <AlertCircle className="size-10 text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  ไม่สามารถโหลดข้อมูลรายการสั่งซื้อซ้ำได้
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  เกิดข้อผิดพลาดในการดึงข้อมูลจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                className="rounded-lg"
              >
                ลองใหม่
              </Button>
            </div>
          ) : uniqueItems.length === 0 ? (
            <div className="border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              ไม่พบรายการสินค้าในคำสั่งซื้อนี้
            </div>
          ) : (
            uniqueItems.map((item) => (
              <div
                key={item.orderItemId}
                className="rounded-xl border border-slate-200 p-4 bg-white hover:bg-slate-50/50 transition flex items-center justify-between gap-4"
              >
                {/* Left Column: Square thumbnail with rarity */}
                <ReorderCardImage
                  imageUrl={item.imageUrl}
                  productName={item.productName}
                  rarity={item.rarity}
                />

                {/* Middle Column: Card Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {item.productName}
                    </span>
                    {item.originalCondition && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                        สภาพเดิม: {item.originalCondition}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {item.variantLabel}
                  </p>

                  <div className="mt-1.5">
                    <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md inline-block font-normal">
                      ราคาเดิมที่เคยซื้อ: ฿{item.originalPrice.toLocaleString(intlLocale())} • จำนวน {item.originalQuantity} ใบ
                    </span>
                  </div>
                </div>

                {/* Right Column: Action Button */}
                <Button
                  type="button"
                  data-testid="reorder-item-btn"
                  onClick={() => handleReorderClick(item)}
                  className="bg-[#006699] hover:bg-[#005580] text-white rounded-lg px-4 py-2 font-medium text-xs sm:text-sm shrink-0 flex items-center gap-1 transition-colors shadow-none cursor-pointer"
                >
                  สั่งซื้ออีกครั้ง →
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="size-4 shrink-0 text-slate-400" />
            <span>คลิกเพื่อไปดูสต็อกและราคาปัจจุบันในหน้ารายละเอียดสินค้า</span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-5 py-2 text-sm font-medium h-auto cursor-pointer"
          >
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
