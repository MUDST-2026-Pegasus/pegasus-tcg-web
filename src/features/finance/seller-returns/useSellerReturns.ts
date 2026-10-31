import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { afterSalesApi } from "../after-sales.api";
import {
  calculateTabCounts,
  categorizeReturns,
  sortReturns,
  type TabCategory,
} from "../after-sales.helpers";

export type ReturnSortOrder = "longest_first" | "newest_first";

/**
 * Seller return list: fetch, tab/sort, which card is expanded, and sidebar figures.
 */
export function useSellerReturns() {
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
  const [sortOrder, setSortOrder] = useState<ReturnSortOrder>("longest_first");
  const [explicitExpandedId, setExplicitExpandedId] = useState<number | null | undefined>(undefined);

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

  // Switching tab drops the user's expand choice so the tab's default applies again
  const selectTab = (tab: TabCategory) => {
    setActiveTab(tab);
    setExplicitExpandedId(undefined);
  };

  const toggleExpanded = (id: number) => {
    setExplicitExpandedId(effectiveExpandedId === id ? null : id);
  };

  return {
    isLoading,
    isError,
    refetch,
    tabCounts,
    activeTab,
    selectTab,
    sortOrder,
    setSortOrder,
    currentTabReturns,
    effectiveExpandedId,
    toggleExpanded,
    currentStep,
    pendingFundsSummary,
  };
}
