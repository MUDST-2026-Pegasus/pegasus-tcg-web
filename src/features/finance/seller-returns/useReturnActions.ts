import { useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import { toast } from "@/components/ui/toast";

import { afterSalesApi } from "../after-sales.api";
import { formatBaht, mapReturnErrorMessage } from "../after-sales.format";
import type { SellerReturnRequest } from "../after-sales.types";
import { DEFAULT_RETURN_DRAFT, getRefundAmount, type ReturnDraft } from "./return-draft";

/** Everything a return decision changes: the return list, seller to-dos and dashboard. */
function invalidateReturnQueries(cache: QueryClient) {
  return Promise.all([
    cache.invalidateQueries({ queryKey: ["finance", "seller-returns"] }),
    cache.invalidateQueries({ queryKey: ["seller", "todos"] }),
    cache.invalidateQueries({ queryKey: ["seller", "dashboard"] }),
  ]);
}

/**
 * Per-card form drafts, the approve/reject/receive confirm modals, and their API calls.
 */
export function useReturnActions() {
  const cache = useQueryClient();

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

  const runAction = async (id: number, call: () => Promise<unknown>, onSuccess: () => void) => {
    setBusyId(id);
    try {
      await call();
      await invalidateReturnQueries(cache);
      onSuccess();
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

  // Actions
  const handleApproveConfirm = async () => {
    if (!approveModalItem) return;
    const id = approveModalItem.id;
    const draft = getDraft(id);
    const amount = getRefundAmount(approveModalItem, draft);

    await runAction(
      id,
      () => afterSalesApi.approveReturn(id, draft.resolution, amount, draft.shipBack),
      () => {
        toast.add({
          type: "success",
          title: "อนุมัติคำขอคืนเงินเรียบร้อยแล้ว",
          description: `คำขอ RT-${id} จำนวนเงิน ${formatBaht(amount)}`,
        });
        setApproveModalItem(null);
      }
    );
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalItem) return;
    const id = rejectModalItem.id;

    await runAction(
      id,
      () => afterSalesApi.rejectReturn(id),
      () => {
        toast.add({
          type: "success",
          title: "ปฏิเสธคำขอคืนสินค้าแล้ว",
          description: `คำขอ RT-${id} ถูกปฏิเสธ ระบบจะโอนเงิน Escrow ตามกำหนดเดิม`,
        });
        setRejectModalItem(null);
      }
    );
  };

  const handleReceiveConfirm = async () => {
    if (!receiveModalItem) return;
    const id = receiveModalItem.id;
    const restock = getDraft(id).restock;

    await runAction(
      id,
      () => afterSalesApi.receiveReturn(id, restock),
      () => {
        toast.add({
          type: "success",
          title: "ยืนยันรับสินค้าคืนสำเร็จ",
          description: `ระบบปล่อยเงินคืนให้ผู้ซื้อ และ${restock ? "นำการ์ดกลับเข้าสต็อกเรียบร้อยแล้ว" : "ไม่นำกลับเข้าสต็อก"}`,
        });
        setReceiveModalItem(null);
      }
    );
  };

  return {
    busyId,
    getDraft,
    updateDraft,
    approveModalItem,
    setApproveModalItem,
    rejectModalItem,
    setRejectModalItem,
    receiveModalItem,
    setReceiveModalItem,
    handleApproveConfirm,
    handleRejectConfirm,
    handleReceiveConfirm,
  };
}
