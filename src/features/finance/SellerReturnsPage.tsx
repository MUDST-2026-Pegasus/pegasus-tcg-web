import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { afterSalesApi } from "./after-sales.api";
import { formatBaht, mapReturnErrorMessage } from "./after-sales.format";
import {
  calculateTabCounts,
  categorizeReturns,
  sortReturns,
  type TabCategory,
} from "./after-sales.helpers";
import type { ReturnEvidenceLink, SellerReturnRequest } from "./after-sales.types";
import { EvidenceWarningWidget } from "./seller-returns/components/EvidenceWarningWidget";
import { PendingFundsWidget } from "./seller-returns/components/PendingFundsWidget";
import { ReturnRequestCard } from "./seller-returns/components/ReturnRequestCard";
import { ReturnStepsWidget } from "./seller-returns/components/ReturnStepsWidget";
import { DEFAULT_RETURN_DRAFT, getRefundAmount, type ReturnDraft } from "./seller-returns/return-draft";
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
  const [drafts, setDrafts] = useState<Record<number, Partial<ReturnDraft>>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const getDraft = (id: number): ReturnDraft => ({ ...DEFAULT_RETURN_DRAFT, ...drafts[id] });
  const updateDraft = (id: number, patch: Partial<ReturnDraft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

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
    const draft = getDraft(id);
    const resolution = draft.resolution;
    const amount = getRefundAmount(approveModalItem, draft);
    const requireShipBack = draft.shipBack;

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
    const restock = getDraft(id).restock;

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

                  return (
                    <ReturnRequestCard
                      key={item.id}
                      item={item}
                      isExpanded={isExpanded}
                      isHighlighted={isHighlighted}
                      onToggle={() => setExplicitExpandedId(isExpanded ? null : item.id)}
                      draft={getDraft(item.id)}
                      isBusy={busyId === item.id}
                      onDraftChange={(patch) => updateDraft(item.id, patch)}
                      onApprove={() => setApproveModalItem(item)}
                      onReject={() => setRejectModalItem(item)}
                      onReceive={() => setReceiveModalItem(item)}
                      onEvidenceClick={(link, list) => setEvidencePreview({ link, list })}
                    />
                  );
                })
              )}
            </div>

            {/* Right Column: Widgets */}
            <div className="lg:col-span-4 space-y-4">
              <ReturnStepsWidget currentStep={currentStep} />
              <PendingFundsWidget pendingFundsSummary={pendingFundsSummary} />
              <EvidenceWarningWidget />
            </div>
          </div>
        )}
      </div>

      {/* Confirmation & Preview Modals */}
      <ApproveReturnModal
        open={!!approveModalItem}
        onOpenChange={(open) => !open && setApproveModalItem(null)}
        item={approveModalItem}
        amount={approveModalItem ? getRefundAmount(approveModalItem, getDraft(approveModalItem.id)) : 0}
        resolution={approveModalItem ? getDraft(approveModalItem.id).resolution : "FULL_REFUND"}
        requireShipBack={approveModalItem ? getDraft(approveModalItem.id).shipBack : true}
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
        restock={receiveModalItem ? getDraft(receiveModalItem.id).restock : true}
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
