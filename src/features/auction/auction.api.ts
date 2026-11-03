import type { CheckoutResponse } from "@/features/cart/checkout.types";
import { api } from "@/lib/api";

import {
  ADMIN_AUCTION_DETAIL_FIXTURE,
  ADMIN_AUCTION_PAGE_FIXTURE,
  AUCTION_DETAIL_FIXTURES,
  AUCTION_PAGE_FIXTURE,
  BANNED_BIDDER_PAGE_FIXTURE,
  BID_HISTORY_FIXTURE,
  ELIGIBLE_UNIT_PAGE_FIXTURE,
  MY_AUCTION_PAGE_FIXTURE,
  SELLER_AUCTION_DETAIL_FIXTURES,
  SELLER_AUCTION_PAGE_FIXTURE,
} from "./auction.fixture";
import type {
  AdminAuctionDetail,
  AdminAuctionPage,
  AdminAuctionTab,
  AuctionCheckoutRequest,
  AuctionDetail,
  AuctionListParams,
  AuctionPage,
  AuctionStatus,
  AuctionWin,
  BannedBidder,
  BannedBidderPage,
  BanTab,
  BidHistory,
  BidPlaced,
  CreateAuctionRequest,
  EligibleUnitPage,
  LiftBiddingBanRequest,
  MyAuctionPage,
  MyAuctionTab,
  PlaceBidRequest,
  SellerAuctionDetail,
  SellerAuctionPage,
  SellerDecisionRequest,
  SuspendAuctionRequest,
  UpdateAuctionRequest,
} from "./auction.types";
import type { CardCondition } from "@/features/catalog/catalog.types";

// ---------- API ของระบบประมูล [TCG-627 · FE-1] ----------
// endpoint ครบทั้ง 21 ตัวตาม contract C-2 (`AuctionController`, `SellerAuctionController`,
// `AdminAuctionController`) — component ไม่เรียกตรง ๆ ให้ผ่าน hook ใน `auction.queries.ts`
//
// ระหว่างที่ BE ยังไม่มี logic ทุกฟังก์ชันคืนข้อมูลจาก `auction.fixture.ts`
// การ์ดเชื่อมระบบสลับทีละกลุ่มด้วย `AUCTION_MOCK` ข้างล่าง (true → false) ไม่ต้องแก้ส่วนอื่น:
//   I-1 → public + seller · I-2 → buyer · I-3 → buyer + seller · I-4 → admin

export const AUCTION_MOCK = {
  /** รายการ / รายละเอียด / ประวัติบิด */
  public: true,
  /** บิด / ซื้อทันที / checkout / ข้อเสนออันดับ 2 / การประมูลของฉัน */
  buyer: true,
  /** หน้าผู้ขายทั้งหมด */
  seller: true,
  /** หน้าแอดมินทั้งหมด */
  admin: true,
};

const MOCK_DELAY_MS = 300;

/** คืนสำเนาของ fixture หลังหน่วงนิดหน่อย ให้เห็น loading state เหมือนเรียกจริง */
function mock<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), MOCK_DELAY_MS));
}

function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `idemp-${Date.now()}`;
}

const inHours = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();
const nowIso = () => new Date().toISOString();

// ---------- public (guest เรียกได้) ----------

export function getAuctions(params: AuctionListParams = {}): Promise<AuctionPage> {
  if (AUCTION_MOCK.public) return mock(AUCTION_PAGE_FIXTURE);
  return api.get<AuctionPage>("/auctions", { query: params, auth: false });
}

export function getAuction(id: number): Promise<AuctionDetail> {
  if (AUCTION_MOCK.public) return mock(AUCTION_DETAIL_FIXTURES[id] ?? AUCTION_DETAIL_FIXTURES[142]);
  return api.get<AuctionDetail>(`/auctions/${id}`);
}

export function getBidHistory(id: number, page = 0, size = 20): Promise<BidHistory> {
  if (AUCTION_MOCK.public) return mock(BID_HISTORY_FIXTURE);
  return api.get<BidHistory>(`/auctions/${id}/bids`, { query: { page, size }, auth: false });
}

// ---------- ผู้ซื้อ (ต้องล็อกอิน) ----------

/** บิดแล้วถอนไม่ได้ — error ที่ต้องรับ: BID_TOO_LOW, AUCTION_CLOSED, BIDDING_BANNED, OWN_AUCTION, NO_SHIPPING_ADDRESS, EMAIL_NOT_VERIFIED */
export function placeBid(id: number, payload: PlaceBidRequest): Promise<BidPlaced> {
  if (AUCTION_MOCK.buyer) {
    return mock({
      auctionId: id,
      amount: payload.amount,
      leading: true,
      extended: false,
      currentPrice: payload.amount,
      minNextBid: payload.amount + 100,
      bidCount: 13,
      endsAt: AUCTION_DETAIL_FIXTURES[id]?.endsAt ?? inHours(28),
      serverTime: nowIso(),
    });
  }
  return api.post<BidPlaced>(`/auctions/${id}/bids`, payload);
}

/** ได้เฉพาะ LIVE + ยังไม่มีบิด — error: BUY_NOW_UNAVAILABLE, AUCTION_CLOSED */
export function buyNow(id: number): Promise<AuctionWin> {
  if (AUCTION_MOCK.buyer) {
    const price = AUCTION_DETAIL_FIXTURES[id]?.buyNowPrice ?? 3500;
    return mock({ auctionId: id, auctionNumber: `AUC-2026-${String(id).padStart(4, "0")}`, price, shippingFee: 50, total: price + 50, paymentDueAt: inHours(24), serverTime: nowIso() });
  }
  return api.post<AuctionWin>(`/auctions/${id}/buy-now`);
}

/** ส่ง `Idempotency-Key` ทุกครั้ง — กดซ้ำด้วย key เดิมได้คำสั่งซื้อเดิม */
export function checkoutAuction(
  id: number,
  payload: AuctionCheckoutRequest,
  idempotencyKey: string = newIdempotencyKey(),
): Promise<CheckoutResponse> {
  if (AUCTION_MOCK.buyer) {
    const detail = AUCTION_DETAIL_FIXTURES[id] ?? AUCTION_DETAIL_FIXTURES[142];
    return mock({
      orderId: 10412,
      orderNumber: "PGS-20261101-010412",
      buyerId: 7,
      status: "PENDING_PAYMENT",
      currency: "THB",
      itemsSubtotal: detail.currentPrice,
      shippingTotal: detail.shippingFee,
      discountTotal: 0,
      grandTotal: detail.currentPrice + detail.shippingFee,
      placedAt: nowIso(),
      sellerOrders: [],
      replayed: false,
    });
  }
  return api.post<CheckoutResponse>(`/auctions/${id}/checkout`, payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export function acceptSecondChance(id: number): Promise<AuctionWin> {
  if (AUCTION_MOCK.buyer) {
    const offer = AUCTION_DETAIL_FIXTURES[id]?.viewer?.offer;
    const price = offer?.amount ?? 4650;
    return mock({ auctionId: id, auctionNumber: `AUC-2026-${String(id).padStart(4, "0")}`, price, shippingFee: 50, total: price + 50, paymentDueAt: inHours(24), serverTime: nowIso() });
  }
  return api.post<AuctionWin>(`/auctions/${id}/second-chance/accept`);
}

export function declineSecondChance(id: number): Promise<null> {
  if (AUCTION_MOCK.buyer) return mock(null);
  return api.post<null>(`/auctions/${id}/second-chance/decline`);
}

export function getMyAuctions(tab: MyAuctionTab = "ALL", page = 0, size = 20): Promise<MyAuctionPage> {
  if (AUCTION_MOCK.buyer) {
    const fixture = MY_AUCTION_PAGE_FIXTURE;
    const items = fixture.page.items.filter((a) => {
      switch (tab) {
        case "ALL":
          return true;
        case "BIDDING":
          return a.state === "LEADING" || a.state === "OUTBID";
        case "TO_PAY":
          return a.state === "WON_AWAITING_PAYMENT";
        default:
          return a.state === tab;
      }
    });
    return mock({ ...fixture, page: { ...fixture.page, items } });
  }
  return api.get<MyAuctionPage>("/me/auctions", { query: { tab, page, size } });
}

// ---------- ผู้ขาย ----------

export type SellerAuctionListParams = { status?: AuctionStatus; q?: string; page?: number; size?: number };

export function getSellerAuctions(params: SellerAuctionListParams = {}): Promise<SellerAuctionPage> {
  if (AUCTION_MOCK.seller) {
    const fixture = SELLER_AUCTION_PAGE_FIXTURE;
    const items = params.status ? fixture.page.items.filter((r) => r.status === params.status) : fixture.page.items;
    return mock({ ...fixture, page: { ...fixture.page, items } });
  }
  return api.get<SellerAuctionPage>("/sellers/me/auctions", { query: params });
}

export type EligibleUnitParams = { q?: string; gameId?: number; condition?: CardCondition; page?: number; size?: number };

export function getEligibleUnits(params: EligibleUnitParams = {}): Promise<EligibleUnitPage> {
  if (AUCTION_MOCK.seller) return mock(ELIGIBLE_UNIT_PAGE_FIXTURE);
  return api.get<EligibleUnitPage>("/sellers/me/auctions/eligible-units", { query: params });
}

/** error: AUCTION_END_TOO_SOON / TOO_FAR, BUY_NOW_BELOW_START, UNIT_NOT_AVAILABLE, SELLER_NOT_VERIFIED */
export function createAuction(payload: CreateAuctionRequest): Promise<SellerAuctionDetail> {
  if (AUCTION_MOCK.seller) {
    const base = SELLER_AUCTION_DETAIL_FIXTURES[150];
    return mock({
      ...base,
      id: 160,
      auctionNumber: "AUC-2026-0160",
      startingPrice: payload.startingPrice,
      bidIncrement: payload.bidIncrement,
      currentPrice: payload.startingPrice,
      estimatedPayout: Math.round(payload.startingPrice * 0.95),
      buyNowPrice: payload.buyNowPrice,
      buyNowAvailable: payload.buyNowPrice !== null,
      sellerNote: payload.sellerNote,
      startedAt: nowIso(),
      originalEndsAt: payload.endsAt,
      endsAt: payload.endsAt,
      serverTime: nowIso(),
    });
  }
  return api.post<SellerAuctionDetail>("/sellers/me/auctions", payload);
}

export function getSellerAuction(id: number): Promise<SellerAuctionDetail> {
  if (AUCTION_MOCK.seller) return mock(SELLER_AUCTION_DETAIL_FIXTURES[id] ?? SELLER_AUCTION_DETAIL_FIXTURES[142]);
  return api.get<SellerAuctionDetail>(`/sellers/me/auctions/${id}`);
}

/** ส่งทั้งสองช่อง ได้เฉพาะตอนยังไม่มีบิด — error: AUCTION_HAS_BIDS, BUY_NOW_BELOW_START */
export function updateAuction(id: number, payload: UpdateAuctionRequest): Promise<SellerAuctionDetail> {
  if (AUCTION_MOCK.seller) {
    const base = SELLER_AUCTION_DETAIL_FIXTURES[id] ?? SELLER_AUCTION_DETAIL_FIXTURES[150];
    return mock({ ...base, buyNowPrice: payload.buyNowPrice, buyNowAvailable: payload.buyNowPrice !== null, sellerNote: payload.sellerNote, serverTime: nowIso() });
  }
  return api.patch<SellerAuctionDetail>(`/sellers/me/auctions/${id}`, payload);
}

/** ได้เฉพาะตอนยังไม่มีบิด — error: AUCTION_HAS_BIDS */
export function cancelAuction(id: number): Promise<SellerAuctionDetail> {
  if (AUCTION_MOCK.seller) {
    const base = SELLER_AUCTION_DETAIL_FIXTURES[id] ?? SELLER_AUCTION_DETAIL_FIXTURES[150];
    return mock({ ...base, status: "CANCELLED", editable: false, cancellable: false, buyNowAvailable: false, serverTime: nowIso() });
  }
  return api.post<SellerAuctionDetail>(`/sellers/me/auctions/${id}/cancel`);
}

/** ได้เฉพาะ AWAITING_SELLER_DECISION — error: NO_SECOND_BIDDER, AUCTION_CLOSED */
export function decideAuction(id: number, payload: SellerDecisionRequest): Promise<SellerAuctionDetail> {
  if (AUCTION_MOCK.seller) {
    const base = SELLER_AUCTION_DETAIL_FIXTURES[id] ?? SELLER_AUCTION_DETAIL_FIXTURES[119];
    const second = base.decision?.secondBidder;
    return mock(
      payload.choice === "OFFER_TO_SECOND" && second
        ? { ...base, status: "OFFERED_TO_SECOND", decision: null, offer: { bidderAlias: second.bidderAlias, amount: second.amount, status: "PENDING", expiresAt: inHours(24) }, serverTime: nowIso() }
        : { ...base, status: "UNSOLD", decision: null, serverTime: nowIso() },
    );
  }
  return api.post<SellerAuctionDetail>(`/sellers/me/auctions/${id}/decision`, payload);
}

// ---------- แอดมิน ----------

export type AdminAuctionListParams = { tab?: AdminAuctionTab; q?: string; page?: number; size?: number };

export function getAdminAuctions(params: AdminAuctionListParams = {}): Promise<AdminAuctionPage> {
  if (AUCTION_MOCK.admin) return mock(ADMIN_AUCTION_PAGE_FIXTURE);
  return api.get<AdminAuctionPage>("/admin/auctions", { query: params });
}

export function getAdminAuction(id: number): Promise<AdminAuctionDetail> {
  if (AUCTION_MOCK.admin) return mock({ ...ADMIN_AUCTION_DETAIL_FIXTURE, id });
  return api.get<AdminAuctionDetail>(`/admin/auctions/${id}`);
}

export function suspendAuction(id: number, payload: SuspendAuctionRequest): Promise<AdminAuctionDetail> {
  if (AUCTION_MOCK.admin) {
    return mock({
      ...ADMIN_AUCTION_DETAIL_FIXTURE,
      id,
      status: "SUSPENDED",
      actions: [{ action: "SUSPEND", adminName: "admin", reason: payload.reason, at: nowIso() }],
      serverTime: nowIso(),
    });
  }
  return api.post<AdminAuctionDetail>(`/admin/auctions/${id}/suspend`, payload);
}

export type BannedBidderParams = { tab?: BanTab; q?: string; page?: number; size?: number };

export function getBannedBidders(params: BannedBidderParams = {}): Promise<BannedBidderPage> {
  if (AUCTION_MOCK.admin) return mock(BANNED_BIDDER_PAGE_FIXTURE);
  return api.get<BannedBidderPage>("/admin/auctions/banned-bidders", { query: params });
}

export function liftBiddingBan(userId: number, payload: LiftBiddingBanRequest): Promise<BannedBidder> {
  if (AUCTION_MOCK.admin) {
    const row = BANNED_BIDDER_PAGE_FIXTURE.page.items.find((b) => b.userId === userId) ?? BANNED_BIDDER_PAGE_FIXTURE.page.items[0];
    return mock({ ...row, strikeCount: 0, bannedUntil: null, liftedAt: nowIso() });
  }
  return api.post<BannedBidder>(`/admin/auctions/banned-bidders/${userId}/lift`, payload);
}
