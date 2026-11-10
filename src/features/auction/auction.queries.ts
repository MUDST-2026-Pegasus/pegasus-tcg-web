import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import * as auctionApi from "./auction.api";
import type {
  AdminAuctionListParams,
  BannedBidderParams,
  EligibleUnitParams,
  SellerAuctionListParams,
} from "./auction.api";
import type {
  AuctionCheckoutRequest,
  AuctionListParams,
  CreateAuctionRequest,
  LiftBiddingBanRequest,
  MyAuctionTab,
  PlaceBidRequest,
  SellerAuctionDetail,
  SuspendAuctionRequest,
  UpdateAuctionRequest,
} from "./auction.types";

// ---------- hook ของระบบประมูล [TCG-627 · FE-1] ----------
// ทุกหน้าในระบบประมูลเรียกข้อมูลผ่าน hook ในไฟล์นี้ ไม่ต้องสร้าง query เอง
// key ทั้งหมดอยู่ใต้ `auctionKeys.all` — mutation ล้าง key ที่เกี่ยวให้เองแล้ว

export const auctionKeys = {
  all: ["auctions"] as const,
  // public / ผู้ซื้อ
  lists: () => [...auctionKeys.all, "list"] as const,
  list: (params: AuctionListParams) =>
    [...auctionKeys.lists(), params.filter ?? "ALL", params.gameId ?? 0, params.variantId ?? 0, params.sellerUsername ?? "", params.q ?? "", params.sort ?? "ENDING_SOON", params.page ?? 0, params.size ?? 20] as const,
  details: () => [...auctionKeys.all, "detail"] as const,
  detail: (id: number) => [...auctionKeys.details(), id] as const,
  bids: (id: number, page: number) => [...auctionKeys.detail(id), "bids", page] as const,
  mine: () => [...auctionKeys.all, "mine"] as const,
  mineTab: (tab: MyAuctionTab, page: number) => [...auctionKeys.mine(), tab, page] as const,
  // ผู้ขาย
  seller: () => [...auctionKeys.all, "seller"] as const,
  sellerList: (params: SellerAuctionListParams) =>
    [...auctionKeys.seller(), "list", params.status ?? "ALL", params.q ?? "", params.page ?? 0] as const,
  sellerDetail: (id: number) => [...auctionKeys.seller(), "detail", id] as const,
  eligibleUnits: (params: EligibleUnitParams) =>
    [...auctionKeys.seller(), "eligible", params.q ?? "", params.gameId ?? 0, params.condition ?? "ALL", params.page ?? 0] as const,
  // แอดมิน
  admin: () => [...auctionKeys.all, "admin"] as const,
  adminList: (params: AdminAuctionListParams) =>
    [...auctionKeys.admin(), "list", params.tab ?? "ALL", params.q ?? "", params.page ?? 0] as const,
  adminDetail: (id: number) => [...auctionKeys.admin(), "detail", id] as const,
  bannedBidders: (params: BannedBidderParams) =>
    [...auctionKeys.admin(), "banned", params.tab ?? "BANNED", params.q ?? "", params.page ?? 0] as const,
};

/**
 * ราคาและเวลาเปลี่ยนจากคนอื่นตลอด — หน้าประมูลที่เปิดอยู่ดึงใหม่ทุกช่วงนี้
 * (realtime เป็นเฟสหน้า) ตัวนับเดินเองทุกวินาทีจาก `endsAt` ไม่ต้องรอ refetch
 */
export const AUCTION_POLL_MS = 5_000;

// ---------- public / ผู้ซื้อ ----------

/** @param options.enabled `false` = ยังไม่พร้อมยิง เช่น รอรายชื่อเกมไปแปลง slug */
export function useAuctions(params: AuctionListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: auctionKeys.list(params),
    enabled: options.enabled ?? true,
    queryFn: () => auctionApi.getAuctions(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

/** @param id `null` = เลขใน URL ไม่ใช่ตัวเลข ไม่ต้องยิง */
export function useAuction(id: number | null, options: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: auctionKeys.detail(id ?? 0),
    queryFn: () => auctionApi.getAuction(id ?? 0),
    enabled: id !== null,
    // ดึงใหม่ตอนยังเปิด และตอนรอชำระ (ผู้ชนะจ่าย → SOLD / ไม่จ่าย → UNSOLD) · สถานะอื่นไม่เปลี่ยนเองแล้ว
    refetchInterval: (query) =>
      options.poll === false ||
      (query.state.data && query.state.data.status !== "LIVE" && query.state.data.status !== "AWAITING_PAYMENT")
        ? false
        : AUCTION_POLL_MS,
    // 404 คือคำตอบ ลองซ้ำก็ได้ผลเดิม
    retry: false,
  });
}

/** ประมูลที่เปิดอยู่ของการ์ดรุ่นนี้ — กล่องในหน้ารายละเอียดสินค้า (หลายรุ่น = รวมทุกรุ่น) [TCG-636] */
export function useVariantAuctions(variantIds: number[]) {
  return useQueries({
    queries: variantIds.map((variantId) => {
      const params: AuctionListParams = { variantId, sort: "ENDING_SOON" };
      return { queryKey: auctionKeys.list(params), queryFn: () => auctionApi.getAuctions(params) };
    }),
    combine: (results) => ({
      auctions: results.flatMap((result) => result.data?.page.items ?? []),
      total: results.reduce((sum, result) => sum + (result.data?.page.totalItems ?? 0), 0),
      serverTime: results.find((result) => result.data)?.data?.serverTime,
    }),
  });
}

/**
 * @param bidCount จำนวนบิดจากรายละเอียดที่ poll อยู่ — เปลี่ยนเมื่อไรดึงประวัติใหม่
 * ให้คนที่ถูกบิดแซงเห็นบิดใหม่ในรายการด้วย ไม่ใช่แค่ราคา [TCG-638]
 */
export function useBidHistory(id: number | null, page = 0, bidCount?: number) {
  return useQuery({
    queryKey: [...auctionKeys.bids(id ?? 0, page), bidCount ?? null] as const,
    queryFn: () => auctionApi.getBidHistory(id ?? 0, page),
    enabled: id !== null,
    placeholderData: keepPreviousData,
  });
}

export function useMyAuctions(tab: MyAuctionTab = "ALL", page = 0) {
  return useQuery({
    queryKey: auctionKeys.mineTab(tab, page),
    queryFn: () => auctionApi.getMyAuctions(tab, page),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

/** หลังผู้ซื้อทำอะไรกับประมูล: ใบนั้น + รายการ + หน้าการประมูลของฉัน ดึงใหม่ */
function refreshBuyerViews(queryClient: QueryClient, auctionId: number) {
  void queryClient.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) });
  void queryClient.invalidateQueries({ queryKey: auctionKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: auctionKeys.mine() });
}

export function usePlaceBid(auctionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: { payload: PlaceBidRequest; idempotencyKey?: string }) =>
      auctionApi.placeBid(auctionId, payload, idempotencyKey),
    onSettled: () => refreshBuyerViews(queryClient, auctionId),
  });
}

export function useBuyNow(auctionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => auctionApi.buyNow(auctionId),
    onSettled: () => refreshBuyerViews(queryClient, auctionId),
  });
}

/**
 * ส่ง `idempotencyKey` เดิมเมื่อกดซ้ำในหน้าเดียวกัน (เก็บไว้ใน state ตอนเปิดหน้า)
 * จะได้คำสั่งซื้อเดิม ไม่ใช่สองใบ
 */
export function useCheckoutAuction(auctionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: { payload: AuctionCheckoutRequest; idempotencyKey?: string }) =>
      auctionApi.checkoutAuction(auctionId, payload, idempotencyKey),
    onSuccess: () => refreshBuyerViews(queryClient, auctionId),
  });
}

// ---------- ผู้ขาย ----------

export function useSellerAuctions(params: SellerAuctionListParams = {}) {
  return useQuery({
    queryKey: auctionKeys.sellerList(params),
    queryFn: () => auctionApi.getSellerAuctions(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

export function useSellerAuction(id: number | null, options: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: auctionKeys.sellerDetail(id ?? 0),
    queryFn: () => auctionApi.getSellerAuction(id ?? 0),
    enabled: id !== null,
    refetchInterval: options.poll === false ? false : AUCTION_POLL_MS,
    retry: false,
  });
}

/** @param options.enabled `false` = ยังไม่ต้องยิง เช่น รอรู้การ์ดของประมูลเดิมก่อน */
export function useEligibleUnits(params: EligibleUnitParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: auctionKeys.eligibleUnits(params),
    enabled: options.enabled ?? true,
    queryFn: () => auctionApi.getEligibleUnits(params),
    placeholderData: keepPreviousData,
  });
}

/** ผู้ขายเปลี่ยนประมูล: ใบนี้ใช้ผลที่ส่งกลับมาเลย ส่วนรายการทั้งฝั่งผู้ขายและหน้ารวมดึงใหม่ */
function settleSeller(queryClient: QueryClient, detail: SellerAuctionDetail) {
  queryClient.setQueryData(auctionKeys.sellerDetail(detail.id), detail);
  void queryClient.invalidateQueries({ queryKey: auctionKeys.seller() });
  void queryClient.invalidateQueries({ queryKey: auctionKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: auctionKeys.detail(detail.id) });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAuctionRequest) => auctionApi.createAuction(payload),
    onSuccess: (detail) => settleSeller(queryClient, detail),
  });
}

export function useUpdateAuction(auctionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAuctionRequest) => auctionApi.updateAuction(auctionId, payload),
    onSuccess: (detail) => settleSeller(queryClient, detail),
  });
}

export function useCancelAuction(auctionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => auctionApi.cancelAuction(auctionId),
    onSuccess: (detail) => settleSeller(queryClient, detail),
  });
}

// ---------- แอดมิน ----------

export function useAdminAuctions(params: AdminAuctionListParams = {}) {
  return useQuery({
    queryKey: auctionKeys.adminList(params),
    queryFn: () => auctionApi.getAdminAuctions(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

export function useAdminAuction(id: number | null) {
  return useQuery({
    queryKey: auctionKeys.adminDetail(id ?? 0),
    queryFn: () => auctionApi.getAdminAuction(id ?? 0),
    enabled: id !== null,
    retry: false,
  });
}

export function useSuspendAuction(auctionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SuspendAuctionRequest) => auctionApi.suspendAuction(auctionId, payload),
    onSuccess: (detail) => {
      queryClient.setQueryData(auctionKeys.adminDetail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: auctionKeys.all });
    },
  });
}

export function useBannedBidders(params: BannedBidderParams = {}) {
  return useQuery({
    queryKey: auctionKeys.bannedBidders(params),
    queryFn: () => auctionApi.getBannedBidders(params),
    placeholderData: keepPreviousData,
  });
}

export function useLiftBiddingBan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: LiftBiddingBanRequest }) =>
      auctionApi.liftBiddingBan(userId, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: auctionKeys.admin() }),
  });
}
