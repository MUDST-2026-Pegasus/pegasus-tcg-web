import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Image as ImageIcon,
  Info,
  Lock,
  Package,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { afterSalesApi } from "./after-sales.api";
import {
  formatAgo,
  formatBaht,
  formatBahtShort,
  mapReturnErrorMessage,
  returnReasonLabel,
  sellerReturnStatusConfig,
} from "./after-sales.format";
import {
  calculatePresetPercentage,
  calculateReturnedCardsTotal,
  calculateTabCounts,
  categorizeReturns,
  sortReturns,
  validatePartialRefundAmount,
  type TabCategory,
} from "./after-sales.helpers";
import type { ReturnEvidenceLink, SellerReturnRequest } from "./after-sales.types";
import { ReturnEvidenceGrid } from "./seller-returns/components/ReturnEvidenceGrid";
import { ApproveReturnModal } from "./seller-returns/modals/ApproveReturnModal";
import { ConfirmReceiptModal } from "./seller-returns/modals/ConfirmReceiptModal";
import { EvidencePreviewModal } from "./seller-returns/modals/EvidencePreviewModal";
import { RejectReturnModal } from "./seller-returns/modals/RejectReturnModal";
import { ReturnPolicyModal } from "./seller-returns/modals/ReturnPolicyModal";

/**
 * Main Seller Returns Page Component
 */
export function SellerReturnsPage() {
  const cache = useQueryClient();

  // Queries
  const {
    data: allReturns = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["finance", "seller-returns"],
    queryFn: () => afterSalesApi.sellerReturns(),
  });

  // Client-side categorization & tab counts
  const categorized = useMemo(() => categorizeReturns(allReturns), [allReturns]);
  const tabCounts = useMemo(() => calculateTabCounts(allReturns), [allReturns]);

  // States
  const [activeTab, setActiveTab] = useState<TabCategory>("action_required");
  const [sortOrder, setSortOrder] = useState<"longest_first" | "newest_first">("longest_first");
  const [explicitExpandedId, setExplicitExpandedId] = useState<number | null | undefined>(undefined);

  // Form states per card
  const [resolutions, setResolutions] = useState<Record<number, "FULL_REFUND" | "PARTIAL_REFUND">>({});
  const [partialAmounts, setPartialAmounts] = useState<Record<number, string>>({});
  const [shipBackMap, setShipBackMap] = useState<Record<number, boolean>>({});
  const [restockMap, setRestockMap] = useState<Record<number, boolean>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  // Modal states
  const [approveModalItem, setApproveModalItem] = useState<SellerReturnRequest | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<SellerReturnRequest | null>(null);
  const [receiveModalItem, setReceiveModalItem] = useState<SellerReturnRequest | null>(null);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  // Evidence preview modal
  const [evidencePreview, setEvidencePreview] = useState<{
    link: ReturnEvidenceLink | null;
    list: ReturnEvidenceLink[];
  }>({ link: null, list: [] });

  // Sorted list for current active tab
  const currentTabReturns = useMemo(() => {
    return sortReturns(categorized[activeTab], sortOrder);
  }, [categorized, activeTab, sortOrder]);

  // Derived effective expanded ID (auto-expands first item in action_required tab unless user toggles)
  const effectiveExpandedId = useMemo(() => {
    if (explicitExpandedId !== undefined) {
      return explicitExpandedId;
    }
    if (activeTab === "action_required" && currentTabReturns.length > 0) {
      return currentTabReturns[0].id;
    }
    return null;
  }, [explicitExpandedId, activeTab, currentTabReturns]);

  // Copy tracking number helper
  const handleCopyTracking = (tracking: string) => {
    void navigator.clipboard.writeText(tracking);
    toast.add({
      type: "success",
      title: "คัดลอกเลขพัสดุแล้ว",
      description: tracking,
    });
  };

  // Determine currently active return for the 5-step widget
  const activeExpandedReturn = useMemo(() => {
    if (effectiveExpandedId) {
      const found = allReturns.find((r) => r.id === effectiveExpandedId);
      if (found) return found;
    }
    return currentTabReturns[0] ?? allReturns[0] ?? null;
  }, [effectiveExpandedId, allReturns, currentTabReturns]);

  // Calculate dynamic active step (1 to 5)
  const currentStep = useMemo(() => {
    if (!activeExpandedReturn) return 2;
    switch (activeExpandedReturn.status) {
      case "REQUESTED":
        return 2;
      case "AWAITING_RETURN_SHIPMENT":
        return 3;
      case "IN_TRANSIT":
        return 4;
      case "APPROVED":
      case "RECEIVED":
        return 5;
      case "REFUNDED":
      case "CLOSED":
        return 6; // all completed
      case "REJECTED":
        return 2;
      default:
        return 2;
    }
  }, [activeExpandedReturn]);

  // Pending Escrow total and sub-order count
  const pendingFundsSummary = useMemo(() => {
    const pendingStatuses = ["REQUESTED", "AWAITING_RETURN_SHIPMENT", "IN_TRANSIT", "APPROVED", "RECEIVED"];
    const pendingList = allReturns.filter((r) => pendingStatuses.includes(r.status));
    const total = pendingList.reduce((sum, r) => sum + (Number(r.sellerOrderGrandTotal) || 0), 0);
    return {
      count: pendingList.length,
      total,
    };
  }, [allReturns]);

  // Actions
  const handleApproveConfirm = async () => {
    if (!approveModalItem) return;
    const id = approveModalItem.id;
    const resolution = resolutions[id] ?? "FULL_REFUND";
    const amount =
      resolution === "FULL_REFUND"
        ? approveModalItem.sellerOrderGrandTotal
        : parseFloat(partialAmounts[id] || "0");
    const requireShipBack = shipBackMap[id] ?? true;

    setBusyId(id);
    try {
      await afterSalesApi.approveReturn(id, resolution, amount, requireShipBack);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["finance", "seller-returns"] }),
        cache.invalidateQueries({ queryKey: ["seller", "todos"] }),
        cache.invalidateQueries({ queryKey: ["seller", "dashboard"] }),
      ]);
      toast.add({
        type: "success",
        title: "อนุมัติคำขอคืนเงินเรียบร้อยแล้ว",
        description: `คำขอ RT-${id} จำนวนเงิน ${formatBaht(amount)}`,
      });
      setApproveModalItem(null);
    } catch (error) {
      toast.add({
        type: "error",
        title: "ดำเนินการไม่สำเร็จ",
        description: mapReturnErrorMessage(error),
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalItem) return;
    const id = rejectModalItem.id;

    setBusyId(id);
    try {
      await afterSalesApi.rejectReturn(id);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["finance", "seller-returns"] }),
        cache.invalidateQueries({ queryKey: ["seller", "todos"] }),
        cache.invalidateQueries({ queryKey: ["seller", "dashboard"] }),
      ]);
      toast.add({
        type: "success",
        title: "ปฏิเสธคำขอคืนสินค้าแล้ว",
        description: `คำขอ RT-${id} ถูกปฏิเสธ ระบบจะโอนเงิน Escrow ตามกำหนดเดิม`,
      });
      setRejectModalItem(null);
    } catch (error) {
      toast.add({
        type: "error",
        title: "ดำเนินการไม่สำเร็จ",
        description: mapReturnErrorMessage(error),
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReceiveConfirm = async () => {
    if (!receiveModalItem) return;
    const id = receiveModalItem.id;
    const restock = restockMap[id] ?? true;

    setBusyId(id);
    try {
      await afterSalesApi.receiveReturn(id, restock);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["finance", "seller-returns"] }),
        cache.invalidateQueries({ queryKey: ["seller", "todos"] }),
        cache.invalidateQueries({ queryKey: ["seller", "dashboard"] }),
      ]);
      toast.add({
        type: "success",
        title: "ยืนยันรับสินค้าคืนสำเร็จ",
        description: `ระบบปล่อยเงินคืนให้ผู้ซื้อ และ${restock ? "นำการ์ดกลับเข้าสต็อกเรียบร้อยแล้ว" : "ไม่นำกลับเข้าสต็อก"}`,
      });
      setReceiveModalItem(null);
    } catch (error) {
      toast.add({
        type: "error",
        title: "ดำเนินการไม่สำเร็จ",
        description: mapReturnErrorMessage(error),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-zinc-950">
              คำขอคืนสินค้า
            </h1>
            <p className="text-xs text-gray-500">
              {tabCounts.action_required} คำขอรอคุณดำเนินการ · เงินของออเดอร์ที่มีคำขอเปิดอยู่จะถูกพักไว้จนกว่าจะจบเรื่อง
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPolicyModalOpen(true)}
            className="self-start sm:self-auto rounded-lg bg-background text-xs font-medium"
          >
            นโยบายการคืนสินค้า
          </Button>
        </div>

        {/* Pill Tabs & Sorting */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("action_required");
                setExplicitExpandedId(undefined);
              }}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-2 text-xs transition-colors",
                activeTab === "action_required"
                  ? "bg-zinc-950 font-medium text-white"
                  : "border border-zinc-200 bg-white font-normal text-gray-700 hover:bg-gray-50"
              )}
            >
              ต้องดำเนินการ ({tabCounts.action_required})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("awaiting_shipment");
                setExplicitExpandedId(undefined);
              }}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-2 text-xs transition-colors",
                activeTab === "awaiting_shipment"
                  ? "bg-zinc-950 font-medium text-white"
                  : "border border-zinc-200 bg-white font-normal text-gray-700 hover:bg-gray-50"
              )}
            >
              รอผู้ซื้อส่งคืน ({tabCounts.awaiting_shipment})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("awaiting_refund");
                setExplicitExpandedId(undefined);
              }}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-2 text-xs transition-colors",
                activeTab === "awaiting_refund"
                  ? "bg-zinc-950 font-medium text-white"
                  : "border border-zinc-200 bg-white font-normal text-gray-700 hover:bg-gray-50"
              )}
            >
              รอคืนเงิน ({tabCounts.awaiting_refund})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("completed");
                setExplicitExpandedId(undefined);
              }}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-2 text-xs transition-colors",
                activeTab === "completed"
                  ? "bg-zinc-950 font-medium text-white"
                  : "border border-zinc-200 bg-white font-normal text-gray-700 hover:bg-gray-50"
              )}
            >
              เสร็จสิ้น ({tabCounts.completed})
            </button>
          </div>

          <div className="self-end sm:self-auto">
            <NativeSelect
              aria-label="เรียงลำดับคำขอคืนสินค้า"
              size="sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "longest_first" | "newest_first")}
              className="rounded-lg border-input bg-background text-xs font-medium text-foreground"
            >
              <option value="longest_first">เรียง: รอนานสุดก่อน</option>
              <option value="newest_first">เรียง: ใหม่สุดก่อน</option>
            </NativeSelect>
          </div>
        </div>

        {/* Loading and Error states */}
        {isLoading && (
          <div className="space-y-4 py-8">
            <div className="h-32 w-full animate-pulse rounded-xl bg-card border border-border" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-card border border-border" />
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center"
          >
            <XCircle className="size-8 text-destructive mb-2" />
            <p className="text-sm font-semibold text-destructive">โหลดคำขอคืนสินค้าไม่สำเร็จ</p>
            <p className="text-xs text-muted-foreground mt-1">กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="mt-4 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              ลองอีกครั้ง
            </Button>
          </div>
        )}

        {/* Main Content Layout: Left (List) & Right (Widgets) */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Return Request Cards */}
            <div className="lg:col-span-8 space-y-4">
              {currentTabReturns.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <RotateCcw className="size-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">ไม่มีคำขอในหมวดนี้</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    เมื่อมีคำขอคืนสินค้าในสถานะนี้ รายการจะปรากฏที่นี่โดยอัตโนมัติ
                  </p>
                </div>
              ) : (
                currentTabReturns.map((item, index) => {
                  const isExpanded = effectiveExpandedId === item.id;
                  const isActionRequiredTab = activeTab === "action_required";
                  const isHighlighted = isActionRequiredTab && (index === 0 || isExpanded);
                  const statusConf = sellerReturnStatusConfig(item.status);

                  // Card form states
                  const resolution = resolutions[item.id] ?? "FULL_REFUND";
                  const partialAmountStr = partialAmounts[item.id] ?? "";
                  const shipBack = shipBackMap[item.id] ?? true;
                  const restock = restockMap[item.id] ?? true;
                  const isBusy = busyId === item.id;

                  // Validation for partial refund
                  const partialVal = validatePartialRefundAmount(
                    partialAmountStr,
                    item.sellerOrderGrandTotal
                  );
                  const isPartialValid = resolution === "FULL_REFUND" || partialVal.valid;
                  const activeRefundAmount =
                    resolution === "FULL_REFUND"
                      ? item.sellerOrderGrandTotal
                      : parseFloat(partialAmountStr || "0");

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "gap-0 overflow-hidden rounded-xl border py-0 ring-0 transition-all duration-200",
                        isHighlighted && isExpanded
                          ? "border-amber-500/70 shadow-none inset-ring-1 inset-ring-amber-500/30"
                          : "border-border shadow-none"
                      )}
                    >
                      {/* Accordion Card Header */}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() => setExplicitExpandedId(isExpanded ? null : item.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setExplicitExpandedId(isExpanded ? null : item.id);
                          }
                        }}
                        className="flex cursor-pointer items-center justify-between p-4 sm:p-5 transition-colors hover:bg-muted/40 select-none"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-foreground tracking-tight">
                              RT-{item.id}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px] font-medium leading-none",
                                statusConf.className
                              )}
                            >
                              {statusConf.label}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span>{item.sellerOrderNumber}</span>
                            <span className="mx-1.5">·</span>
                            <span className="text-foreground font-medium">
                              {item.buyer?.username ?? "buyer"}
                            </span>
                            <span className="mx-1.5">·</span>
                            <span>
                              {item.status === "IN_TRANSIT"
                                ? `อนุมัติเมื่อ ${formatAgo(item.reviewedAt ?? item.requestedAt)}`
                                : `เปิดคำขอเมื่อ ${formatAgo(item.requestedAt)}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                              {formatBahtShort(item.sellerOrderGrandTotal)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {item.refundAmount && item.resolution === "PARTIAL_REFUND"
                                ? `คืนบางส่วน ${formatBahtShort(item.refundAmount)}`
                                : "ยอดออเดอร์ย่อย"}
                            </div>
                          </div>
                          <div className="text-muted-foreground hover:text-foreground transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="size-5" />
                            ) : (
                              <ChevronDown className="size-5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Accordion Card Body */}
                      {isExpanded && (
                        <CardContent className="border-t border-border p-4 sm:p-5 pt-4 space-y-5">
                          {/* Case 1: REQUESTED (Decision Box) */}
                          {item.status === "REQUESTED" && (
                            <>
                              {/* Reason & Description */}
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">
                                    เหตุผลจากผู้ซื้อ
                                  </span>
                                  <Badge
                                    variant="destructive"
                                    className="bg-destructive/10 text-destructive border-destructive/20 text-[11px] font-medium"
                                  >
                                    {returnReasonLabel(item.reasonCode)}
                                  </Badge>
                                </div>
                                {item.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground bg-muted/40 rounded-lg p-3 border border-border leading-relaxed italic">
                                    "{item.description}"
                                  </p>
                                )}
                              </div>

                              {/* Items to return */}
                              <div className="space-y-2">
                                <div className="text-xs font-semibold text-foreground">
                                  สินค้าที่ขอคืน · {item.items?.length ?? 0} รายการ
                                </div>
                                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                                  {item.items && item.items.length > 0 ? (
                                    item.items.map((cardItem) => (
                                      <div
                                        key={cardItem.returnItemId}
                                        className="flex items-center justify-between p-3"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 overflow-hidden shadow-2xs">
                                            {cardItem.imageUrl ? (
                                              <img
                                                src={cardItem.imageUrl}
                                                alt={cardItem.cardName}
                                                className="h-full w-full object-contain"
                                              />
                                            ) : (
                                              <ImageIcon className="size-5 text-muted-foreground" />
                                            )}
                                          </div>
                                          <div className="space-y-0.5">
                                            <div className="text-xs sm:text-sm font-medium text-foreground">
                                              {cardItem.cardName}
                                              {cardItem.variantLabel ? ` — ${cardItem.variantLabel}` : ""}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                              {cardItem.conditionCode} · คืน {cardItem.quantityReturned} จาก{" "}
                                              {cardItem.quantityOrdered} ใบ
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right text-xs sm:text-sm font-semibold text-foreground">
                                          {formatBahtShort(cardItem.unitPrice * cardItem.quantityReturned)}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-3 text-xs text-muted-foreground">
                                      ไม่พบรายการสินค้าที่ระบุคืน
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Evidence Grid */}
                              {item.evidenceKeys && item.evidenceKeys.length > 0 && (
                                <ReturnEvidenceGrid
                                  returnId={item.id}
                                  count={item.evidenceKeys.length}
                                  onImageClick={(link, list) =>
                                    setEvidencePreview({ link, list })
                                  }
                                />
                              )}

                              {/* Decision Action Box */}
                              <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
                                <div className="text-sm font-bold text-foreground">
                                  ตัดสินคำขอ
                                </div>

                                {/* Radio Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                      setResolutions((prev) => ({
                                        ...prev,
                                        [item.id]: "FULL_REFUND",
                                      }))
                                    }
                                    className={cn(
                                      "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
                                      resolution === "FULL_REFUND"
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                        : "border-border hover:border-border/80 bg-card"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                        resolution === "FULL_REFUND"
                                          ? "border-primary"
                                          : "border-muted-foreground"
                                      )}
                                    >
                                      {resolution === "FULL_REFUND" && (
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                      )}
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="text-xs sm:text-sm font-semibold text-foreground">
                                        คืนเต็มจำนวน
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">
                                        {formatBahtShort(item.sellerOrderGrandTotal)} · เท่ากับยอดออเดอร์ย่อย
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                      setResolutions((prev) => ({
                                        ...prev,
                                        [item.id]: "PARTIAL_REFUND",
                                      }))
                                    }
                                    className={cn(
                                      "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
                                      resolution === "PARTIAL_REFUND"
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                        : "border-border hover:border-border/80 bg-card"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                        resolution === "PARTIAL_REFUND"
                                          ? "border-primary"
                                          : "border-muted-foreground"
                                      )}
                                    >
                                      {resolution === "PARTIAL_REFUND" && (
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                      )}
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="text-xs sm:text-sm font-semibold text-foreground">
                                        คืนบางส่วน
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">
                                        ระบุยอดที่น้อยกว่า {formatBahtShort(item.sellerOrderGrandTotal)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Amount Input Row */}
                                <div className="space-y-2">
                                  <label
                                    htmlFor={`amount-${item.id}`}
                                    className="text-xs font-semibold text-foreground"
                                  >
                                    ยอดคืนเงิน
                                  </label>

                                  {resolution === "FULL_REFUND" ? (
                                    <div className="flex items-center gap-2">
                                      <div className="relative max-w-xs flex-1">
                                        <Input
                                          id={`amount-${item.id}`}
                                          readOnly
                                          disabled
                                          value={formatBaht(item.sellerOrderGrandTotal)}
                                          className="bg-muted text-muted-foreground font-medium text-xs sm:text-sm"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Lock className="size-3.5" />
                                        <span>ล็อคไว้เมื่อคืนเต็มจำนวน</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="relative max-w-xs">
                                        <Input
                                          id={`amount-${item.id}`}
                                          type="number"
                                          step="0.01"
                                          min="0.01"
                                          max={item.sellerOrderGrandTotal - 0.01}
                                          placeholder="0.00"
                                          value={partialAmountStr}
                                          onChange={(e) =>
                                            setPartialAmounts((prev) => ({
                                              ...prev,
                                              [item.id]: e.target.value,
                                            }))
                                          }
                                          className={cn(
                                            "text-xs sm:text-sm font-medium",
                                            !partialVal.valid && partialAmountStr
                                              ? "border-destructive focus-visible:ring-destructive/30"
                                              : ""
                                          )}
                                        />
                                      </div>

                                      {/* Quick Preset Buttons */}
                                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                        <span className="text-[11px] text-muted-foreground">ลัดยอด:</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPartialAmounts((prev) => ({
                                              ...prev,
                                              [item.id]: String(
                                                calculatePresetPercentage(25, item.sellerOrderGrandTotal)
                                              ),
                                            }))
                                          }
                                          className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                          25% ({formatBahtShort(calculatePresetPercentage(25, item.sellerOrderGrandTotal))})
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPartialAmounts((prev) => ({
                                              ...prev,
                                              [item.id]: String(
                                                calculatePresetPercentage(50, item.sellerOrderGrandTotal)
                                              ),
                                            }))
                                          }
                                          className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                          50% ({formatBahtShort(calculatePresetPercentage(50, item.sellerOrderGrandTotal))})
                                        </button>
                                        {calculateReturnedCardsTotal(item.items) <
                                          item.sellerOrderGrandTotal &&
                                          calculateReturnedCardsTotal(item.items) > 0 && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setPartialAmounts((prev) => ({
                                                  ...prev,
                                                  [item.id]: String(
                                                    calculateReturnedCardsTotal(item.items)
                                                  ),
                                                }))
                                              }
                                              className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                                            >
                                              ตามราคาสินค้าที่ขอคืน ({formatBahtShort(calculateReturnedCardsTotal(item.items))})
                                            </button>
                                          )}
                                      </div>

                                      {!partialVal.valid && partialAmountStr && (
                                        <p className="text-xs font-medium text-destructive">
                                          {partialVal.error}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Ship Back Toggle Switch */}
                                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                                  <Switch
                                    id={`shipBack-${item.id}`}
                                    checked={shipBack}
                                    onCheckedChange={(checked) =>
                                      setShipBackMap((prev) => ({
                                        ...prev,
                                        [item.id]: checked,
                                      }))
                                    }
                                  />
                                  <div className="space-y-0.5">
                                    <label
                                      htmlFor={`shipBack-${item.id}`}
                                      className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer"
                                    >
                                      ให้ผู้ซื้อส่งสินค้าคืนก่อนคืนเงิน
                                    </label>
                                    <p className="text-[11px] text-muted-foreground leading-normal">
                                      ปิดไว้ถ้าไม่ต้องการรับของคืน เช่น ผู้ซื้อไม่ได้รับสินค้า — ระบบจะสร้างรายการคืนเงินทันทีที่อนุมัติ
                                    </p>
                                  </div>
                                </div>

                                {/* Financial Outcome Notice Banner & Buttons */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border">
                                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-sm">
                                    <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                                    <span>
                                      ผลต่อคุณ:{" "}
                                      <strong className="font-semibold text-foreground">
                                        {resolution === "FULL_REFUND"
                                          ? `ไม่ได้รับเงินจากออเดอร์นี้ ${shipBack ? "· การ์ดกลับเข้าสต็อกให้ตอนยืนยันรับของ" : ""}`
                                          : `ได้รับส่วนต่าง ${formatBahtShort(Math.max(0, item.sellerOrderGrandTotal - activeRefundAmount))} หลังหักค่าคอมมิชชั่น`}
                                      </strong>
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isBusy}
                                      onClick={() => setRejectModalItem(item)}
                                      className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-medium"
                                    >
                                      ปฏิเสธคำขอ
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={isBusy || !isPartialValid || activeRefundAmount <= 0}
                                      onClick={() => setApproveModalItem(item)}
                                      className="text-xs font-semibold px-4 shadow-xs"
                                    >
                                      อนุมัติคืนเงิน {formatBahtShort(activeRefundAmount)}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Case 2: IN_TRANSIT */}
                          {item.status === "IN_TRANSIT" && (
                            <div className="space-y-4">
                              {/* Tracking Box */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card border border-border text-foreground shadow-2xs">
                                    <Package className="size-5" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-xs font-semibold text-muted-foreground">
                                      เลขพัสดุส่งคืนจากผู้ซื้อ
                                    </div>
                                    <div className="text-xs sm:text-sm font-bold text-foreground">
                                      {item.returnTrackingNumber ?? "ไม่มีเลขพัสดุ"}
                                      <span className="font-normal text-muted-foreground ml-2">
                                        · ของที่ต้องได้รับ:{" "}
                                        {item.items?.map((i) => `${i.cardName} ×${i.quantityReturned}`).join(", ") ||
                                          "การ์ดที่ส่งคืน"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {item.returnTrackingNumber && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyTracking(item.returnTrackingNumber!)}
                                    className="self-start sm:self-auto text-xs"
                                  >
                                    <Copy className="size-3.5 mr-1.5" />
                                    คัดลอก
                                  </Button>
                                )}
                              </div>

                              {/* Restock Toggle & Confirm Button */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                                <div className="flex items-start gap-3">
                                  <Switch
                                    id={`restock-${item.id}`}
                                    checked={restock}
                                    onCheckedChange={(checked) =>
                                      setRestockMap((prev) => ({
                                        ...prev,
                                        [item.id]: checked,
                                      }))
                                    }
                                  />
                                  <div className="space-y-0.5">
                                    <label
                                      htmlFor={`restock-${item.id}`}
                                      className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer"
                                    >
                                      นำการ์ดกลับเข้าสต็อก
                                    </label>
                                    <p className="text-[11px] text-muted-foreground">
                                      ได้รับทุกใบในสภาพดี · ปิดไว้ถ้าการ์ดเสียหายจนขายต่อไม่ได้
                                    </p>
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => setReceiveModalItem(item)}
                                  className="text-xs font-semibold px-4 shadow-xs self-end sm:self-auto"
                                >
                                  ยืนยันได้รับสินค้าคืน
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Case 3: Other Statuses (Informative Status Callout) */}
                          {item.status !== "REQUESTED" && item.status !== "IN_TRANSIT" && (
                            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs sm:text-sm text-foreground">
                                  สถานะคำขอ: {statusConf.label}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.status === "AWAITING_RETURN_SHIPMENT" &&
                                  "คำขอได้รับการอนุมัติแล้ว และกำลังรอผู้ซื้อจัดส่งสินค้าคืนพร้อมกรอกเลขพัสดุในระบบ"}
                                {item.status === "APPROVED" &&
                                  "คำขอได้รับการอนุมัติโดยไม่ต้องส่งสินค้าคืน ระบบกำลังดำเนินการคืนเงินให้แก่ผู้ซื้อ"}
                                {item.status === "RECEIVED" &&
                                  "คุณได้ยืนยันการรับสินค้าคืนแล้ว ระบบกำลังดำเนินการโอนเงินคืนให้แก่ผู้ซื้อ"}
                                {item.status === "REFUNDED" &&
                                  "ระบบได้คืนเงินให้แก่ผู้ซื้อเรียบร้อยแล้ว กระบวนการคืนสินค้าเสร็จสมบูรณ์"}
                                {item.status === "REJECTED" &&
                                  "คำขอนี้ถูกปฏิเสธ ระบบ Escrow ได้กลับสู่ขั้นตอนการนับเวลาเพื่อจ่ายเงินให้ร้านค้าตามปกติ"}
                                {item.status === "CLOSED" &&
                                  "คำขอคืนสินค้านี้ถูกปิดการดำเนินการแล้ว"}
                              </p>
                              {item.returnTrackingNumber && (
                                <div className="text-xs text-muted-foreground pt-1">
                                  เลขพัสดุส่งคืน:{" "}
                                  <span className="font-medium text-foreground">
                                    {item.returnTrackingNumber}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            </div>

            {/* Right Column: Widgets */}
            <div className="lg:col-span-4 space-y-4">
              {/* Widget 1: Steps to Return (ขั้นตอนการคืนสินค้า) */}
              <Card className="gap-0 rounded-xl border border-border py-0 shadow-none ring-0">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-bold text-sm text-foreground">
                    ขั้นตอนการคืนสินค้า
                  </h3>

                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3 stroke-[3]" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          1. ผู้ซื้อเปิดคำขอพร้อมหลักฐาน
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          currentStep === 2
                            ? "border-2 border-primary text-primary bg-primary/10"
                            : currentStep > 2
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground bg-muted/50"
                        )}
                      >
                        {currentStep > 2 ? <Check className="size-3 stroke-[3]" /> : "2"}
                      </div>
                      <div className="space-y-0.5">
                        <div
                          className={cn(
                            "text-xs font-semibold",
                            currentStep === 2 ? "text-primary font-bold" : "text-foreground"
                          )}
                        >
                          คุณอนุมัติหรือปฏิเสธ
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight">
                          ไม่มีกำหนดเวลา แต่มีผลถูกหักเงินจนกว่าจะตัดสิน
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          currentStep === 3
                            ? "border-2 border-primary text-primary bg-primary/10"
                            : currentStep > 3
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground bg-muted/50"
                        )}
                      >
                        {currentStep > 3 ? <Check className="size-3 stroke-[3]" /> : "3"}
                      </div>
                      <div className="space-y-0.5">
                        <div
                          className={cn(
                            "text-xs font-semibold",
                            currentStep === 3 ? "text-primary font-bold" : "text-foreground"
                          )}
                        >
                          ผู้ซื้อส่งของคืน
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight">
                          เฉพาะเมื่อคุณให้ส่งคืน
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          currentStep === 4
                            ? "border-2 border-primary text-primary bg-primary/10"
                            : currentStep > 4
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground bg-muted/50"
                        )}
                      >
                        {currentStep > 4 ? <Check className="size-3 stroke-[3]" /> : "4"}
                      </div>
                      <div className="space-y-0.5">
                        <div
                          className={cn(
                            "text-xs font-semibold",
                            currentStep === 4 ? "text-primary font-bold" : "text-foreground"
                          )}
                        >
                          คุณยืนยันได้รับของ
                        </div>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          currentStep === 5
                            ? "border-2 border-primary text-primary bg-primary/10"
                            : currentStep > 5
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground bg-muted/50"
                        )}
                      >
                        {currentStep > 5 ? <Check className="size-3 stroke-[3]" /> : "5"}
                      </div>
                      <div className="space-y-0.5">
                        <div
                          className={cn(
                            "text-xs font-semibold",
                            currentStep === 5 ? "text-primary font-bold" : "text-foreground"
                          )}
                        >
                          ระบบคืนเงินให้ผู้ซื้อ
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight">
                          ถ้าผู้ซื้อโอนเงินมา แอดมินจะโอนคืนให้
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Widget 2: Pending Funds Summary (เงินที่รอผลคำขอคืน) */}
              <Card className="gap-0 rounded-xl border border-border py-0 shadow-none ring-0">
                <CardContent className="p-5 space-y-3.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        เงินที่รอผลคำขอคืน
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pendingFundsSummary.count} ออเดอร์ย่อย
                      </p>
                    </div>
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
                      {formatBahtShort(pendingFundsSummary.total)}
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 space-y-2 text-xs">
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      ผลต่อเงินของคุณเมื่อจบเรื่อง
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">คืนเต็มจำนวน</span>
                      <span className="font-medium text-destructive">ไม่ได้รับเงินออเดอร์นี้</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">คืนบางส่วน</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">ได้ส่วนที่เหลือ หลังหักค่าคอม</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">ปฏิเสธ</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">ได้เต็มจำนวนตามกำหนดเดิม</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Widget 3: Warning Box (ตรวจหลักฐานก่อนปฏิเสธ) */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>ตรวจหลักฐานก่อนปฏิเสธ</span>
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300 leading-relaxed">
                  กดปฏิเสธแล้วแก้ไขไม่ได้ และผู้ซื้อจะเปิดคำขอของออเดอร์นี้ซ้ำไม่ได้อีก
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation & Preview Modals */}
      <ApproveReturnModal
        open={!!approveModalItem}
        onOpenChange={(open) => !open && setApproveModalItem(null)}
        item={approveModalItem}
        amount={
          approveModalItem
            ? resolutions[approveModalItem.id] === "PARTIAL_REFUND"
              ? parseFloat(partialAmounts[approveModalItem.id] || "0")
              : approveModalItem.sellerOrderGrandTotal
            : 0
        }
        resolution={
          approveModalItem ? resolutions[approveModalItem.id] ?? "FULL_REFUND" : "FULL_REFUND"
        }
        requireShipBack={
          approveModalItem ? shipBackMap[approveModalItem.id] ?? true : true
        }
        onConfirm={handleApproveConfirm}
        loading={busyId !== null}
      />

      <RejectReturnModal
        open={!!rejectModalItem}
        onOpenChange={(open) => !open && setRejectModalItem(null)}
        item={rejectModalItem}
        onConfirm={handleRejectConfirm}
        loading={busyId !== null}
      />

      <ConfirmReceiptModal
        open={!!receiveModalItem}
        onOpenChange={(open) => !open && setReceiveModalItem(null)}
        item={receiveModalItem}
        restock={receiveModalItem ? restockMap[receiveModalItem.id] ?? true : true}
        onConfirm={handleReceiveConfirm}
        loading={busyId !== null}
      />

      <EvidencePreviewModal
        open={!!evidencePreview.link}
        onOpenChange={(open) => !open && setEvidencePreview({ link: null, list: [] })}
        activeLink={evidencePreview.link}
        allLinks={evidencePreview.list}
        onSelectLink={(link) => setEvidencePreview((prev) => ({ ...prev, link }))}
      />

      <ReturnPolicyModal
        open={policyModalOpen}
        onOpenChange={setPolicyModalOpen}
      />
    </div>
  );
}
