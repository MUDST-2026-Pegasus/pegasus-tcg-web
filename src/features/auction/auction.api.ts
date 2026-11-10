import type { CheckoutResponse } from "@/features/cart/checkout.types";
import { api, fetchAllPages } from "@/lib/api";

import {
  ADMIN_AUCTION_DETAIL_FIXTURE,
  ADMIN_AUCTION_DETAIL_FIXTURES,
  ADMIN_AUCTION_PAGE_FIXTURE,
  AUCTION_DETAIL_FIXTURES,
  AUCTION_PAGE_FIXTURE,
  AUCTION_SELLERS,
  BANNED_BIDDER_PAGE_FIXTURE,
  BID_HISTORY_FIXTURE,
  ELIGIBLE_UNIT_PAGE_FIXTURE,
  MY_AUCTION_PAGE_FIXTURE,
  SELLER_AUCTION_DETAIL_FIXTURES,
  SELLER_AUCTION_PAGE_FIXTURE,
} from "./auction.fixture";
import { banTabOf, matchesAdminAuctionTab, matchesMyAuctionTab } from "./auction.format";
import type {
  AdminAuctionDetail,
  AdminAuctionPage,
  AdminAuctionRow,
  AdminAuctionTab,
  AuctionCheckoutRequest,
  AuctionDetail,
  AuctionListParams,
  AuctionPage,
  AuctionSort,
  AuctionSummary,
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
  SuspendAuctionRequest,
  UpdateAuctionRequest,
} from "./auction.types";
import type { CardCondition } from "@/features/catalog/catalog.types";

// ---------- API ของระบบประมูล [TCG-627 · FE-1] ----------
// endpoint ครบทั้ง 18 ตัวตาม contract C-2 (`AuctionController`, `SellerAuctionController`,
// `AdminAuctionController`) — component ไม่เรียกตรง ๆ ให้ผ่าน hook ใน `auction.queries.ts`
//
// ตอนนี้ทุกกลุ่มใช้ API จริงแล้ว (I-1 ถึง I-4) — ตั้งกลุ่มไหนเป็น `true` จะกลับไปใช้ข้อมูลจาก `auction.fixture.ts`
// การ์ดเชื่อมระบบสลับทีละกลุ่มด้วย `AUCTION_MOCK` ข้างล่าง (true → false) ไม่ต้องแก้ส่วนอื่น:
//   I-1 → public + seller · I-2 → buyer · I-3 → buyer + seller · I-4 → admin

export const AUCTION_MOCK = {
  /** รายการ / รายละเอียด / ประวัติบิด — ใช้ API จริงแล้ว [TCG-637] */
  public: false,
  /** บิด / ซื้อทันที / checkout / การประมูลของฉัน — ใช้ API จริงแล้ว [TCG-638] */
  buyer: false,
  /** หน้าผู้ขายทั้งหมด — ใช้ API จริงแล้ว [TCG-637] */
  seller: false,
  /** หน้าแอดมินทั้งหมด — ใช้ API จริงแล้ว [TCG-640] */
  admin: false,
};

const MOCK_DELAY_MS = 300;

/** คืนสำเนาของ fixture หลังหน่วงนิดหน่อย ให้เห็น loading state เหมือนเรียกจริง */
function mock<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), MOCK_DELAY_MS));
}

export function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `idemp-${Date.now()}`;
}

const inHours = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();
const nowIso = () => new Date().toISOString();

// ---------- public (guest เรียกได้) ----------

/**
 * mock ของหน้า B1 — กรอง/ค้น/เรียงจาก fixture ให้แท็บและ empty state เห็นผลจริง
 * (ไม่กรองเกม เพราะ fixture ไม่มี gameId) ตัวนับในแท็บยังเป็นตัวเลขตาม Figma
 */
function mockAuctionPage(params: AuctionListParams): AuctionPage {
  const now = Date.now();
  const q = params.q?.toLowerCase();
  const shopName = params.sellerUsername
    ? (Object.values(AUCTION_SELLERS).find((s) => s.username === params.sellerUsername)?.shopName ?? null)
    : undefined;
  let items = AUCTION_PAGE_FIXTURE.page.items.filter((auction) => {
    if (q && !auction.item.card.productName.toLowerCase().includes(q)) return false;
    if (params.variantId !== undefined && auction.item.card.variantId !== params.variantId) return false;
    if (shopName !== undefined && auction.shopName !== shopName) return false;
    switch (params.filter) {
      case "ENDING_SOON":
        return new Date(auction.endsAt).getTime() - now < 3_600_000;
      case "BUY_NOW":
        return auction.buyNowPrice !== null;
      case "NO_BIDS":
        return auction.bidCount === 0;
      case "NEW":
        return auction.id >= 150;
      default:
        return true;
    }
  });
  const by: Record<AuctionSort, (a: AuctionSummary, b: AuctionSummary) => number> = {
    ENDING_SOON: (a, b) => a.endsAt.localeCompare(b.endsAt),
    NEWEST: (a, b) => b.id - a.id,
    PRICE_ASC: (a, b) => a.currentPrice - b.currentPrice,
    PRICE_DESC: (a, b) => b.currentPrice - a.currentPrice,
    MOST_BIDS: (a, b) => b.bidCount - a.bidCount,
  };
  items = [...items].sort(by[params.sort ?? "ENDING_SOON"]);
  const filtered = items.length !== AUCTION_PAGE_FIXTURE.page.items.length;
  // ขอน้อยกว่าที่มี (เช่น Home ขอ 4 ใบ) — ตัดตาม size แต่นับรวมตามจริง
  const totalMatched = items.length;
  if (params.size !== undefined && items.length > params.size) items = items.slice(0, params.size);
  return {
    ...AUCTION_PAGE_FIXTURE,
    page: filtered
      ? { items, page: 0, size: params.size ?? 20, totalItems: totalMatched, totalPages: totalMatched ? Math.ceil(totalMatched / (params.size ?? 20)) : 0 }
      : { ...AUCTION_PAGE_FIXTURE.page, items, page: params.page ?? 0 },
    serverTime: nowIso(),
  };
}

export function getAuctions(params: AuctionListParams = {}): Promise<AuctionPage> {
  if (AUCTION_MOCK.public) return mock(mockAuctionPage(params));
  return api.get<AuctionPage>("/auctions", { query: params, auth: false });
}

export function getAuction(id: number): Promise<AuctionDetail> {
  if (AUCTION_MOCK.public) return mock(AUCTION_DETAIL_FIXTURES[id] ?? AUCTION_DETAIL_FIXTURES[142]);
  return api.get<AuctionDetail>(`/auctions/${id}`);
}

export function getBidHistory(id: number, page = 0, size = 20): Promise<BidHistory> {
  if (AUCTION_MOCK.public) {
    // 142 มีประวัติเต็ม ใบอื่นใช้บิดล่าสุดของใบนั้น (ใบที่ยังไม่มีบิดจะได้รายการว่าง)
    const recent = AUCTION_DETAIL_FIXTURES[id]?.recentBids;
    if (id === 142 || !recent) return mock(BID_HISTORY_FIXTURE);
    return mock({ page: { items: recent, page: 0, size, totalItems: recent.length, totalPages: recent.length ? 1 : 0 }, serverTime: nowIso() });
  }
  // ส่ง token ถ้าล็อกอินอยู่ ให้ BE ติดป้าย "(คุณ)" ที่บิดของผู้ใช้ได้
  return api.get<BidHistory>(`/auctions/${id}/bids`, { query: { page, size } });
}

// ---------- ผู้ซื้อ (ต้องล็อกอิน) ----------

/**
 * บิดแล้วถอนไม่ได้ — error ที่ต้องรับ: BID_TOO_LOW, AUCTION_CLOSED, BIDDING_BANNED, OWN_AUCTION, NO_SHIPPING_ADDRESS, EMAIL_NOT_VERIFIED
 * ส่ง `Idempotency-Key` เดิมเมื่อกดยืนยันซ้ำที่ราคาเดิม (เช่น เน็ตกระตุก) จะได้ผลบิดเดิม ไม่ใช่ error [TCG-630]
 * BE ส่งผลบิดเดิมกลับถ้า key ซ้ำ (BE-4 · TCG-617)
 */
export function placeBid(id: number, payload: PlaceBidRequest, idempotencyKey: string = newIdempotencyKey()): Promise<BidPlaced> {
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
  return api.post<BidPlaced>(`/auctions/${id}/bids`, payload, { headers: { "Idempotency-Key": idempotencyKey } });
}

/**
 * ได้เฉพาะ LIVE + ยังไม่มีบิด — error: BUY_NOW_UNAVAILABLE, AUCTION_CLOSED
 * BE ยังไม่อ่าน `Idempotency-Key` ของ endpoint นี้ — กดซ้ำครั้งที่สองได้ AUCTION_CLOSED เพราะประมูลจบไปแล้ว
 * ปุ่มใน dialog ปิดระหว่างรอผลอยู่แล้ว จึงยังส่ง header ไว้เผื่อ BE รับในอนาคต [TCG-638]
 */
export function buyNow(id: number, idempotencyKey: string = newIdempotencyKey()): Promise<AuctionWin> {
  if (AUCTION_MOCK.buyer) {
    const price = AUCTION_DETAIL_FIXTURES[id]?.buyNowPrice ?? 3500;
    return mock({ auctionId: id, auctionNumber: `AUC-2026-${String(id).padStart(4, "0")}`, price, shippingFee: 50, total: price + 50, paymentDueAt: inHours(24), serverTime: nowIso() });
  }
  return api.post<AuctionWin>(`/auctions/${id}/buy-now`, undefined, { headers: { "Idempotency-Key": idempotencyKey } });
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

export function getMyAuctions(tab: MyAuctionTab = "ALL", page = 0, size = 20): Promise<MyAuctionPage> {
  if (AUCTION_MOCK.buyer) {
    const fixture = MY_AUCTION_PAGE_FIXTURE;
    const items = fixture.page.items.filter((a) => matchesMyAuctionTab(tab, a.state));
    return mock({ ...fixture, page: { ...fixture.page, items }, serverTime: nowIso() });
  }
  return api.get<MyAuctionPage>("/me/auctions", { query: { tab, page, size } });
}

// ---------- ผู้ขาย ----------

export type SellerAuctionListParams = { status?: AuctionStatus; q?: string; page?: number; size?: number };

export function getSellerAuctions(params: SellerAuctionListParams = {}): Promise<SellerAuctionPage> {
  if (AUCTION_MOCK.seller) {
    const fixture = SELLER_AUCTION_PAGE_FIXTURE;
    const q = params.q?.trim().toLowerCase();
    const items = fixture.page.items.filter(
      (r) => (!params.status || r.status === params.status) && (!q || r.item.card.productName.toLowerCase().includes(q)),
    );
    const filtered = items.length !== fixture.page.items.length;
    return mock({
      ...fixture,
      page: filtered ? { ...fixture.page, items, totalItems: items.length, totalPages: items.length ? 1 : 0 } : fixture.page,
      serverTime: nowIso(),
    });
  }
  return api.get<SellerAuctionPage>("/sellers/me/auctions", { query: params });
}

export type EligibleUnitParams = { q?: string; gameId?: number; condition?: CardCondition; page?: number; size?: number };

export function getEligibleUnits(params: EligibleUnitParams = {}): Promise<EligibleUnitPage> {
  if (AUCTION_MOCK.seller) {
    // mock กรองแค่คำค้นกับสภาพ — fixture ไม่มีรหัสเกม
    const fixture = ELIGIBLE_UNIT_PAGE_FIXTURE;
    const q = params.q?.trim().toLowerCase();
    const items = fixture.page.items.filter(
      (u) =>
        (!params.condition || u.item.condition === params.condition) &&
        (!q || [u.item.card.productName, u.item.cardNumber, u.unitLabel].some((field) => field.toLowerCase().includes(q))),
    );
    return mock({ ...fixture, page: { ...fixture.page, items, totalItems: items.length, totalPages: items.length ? 1 : 0 } });
  }
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
  if (AUCTION_MOCK.seller) {
    const detail = SELLER_AUCTION_DETAIL_FIXTURES[id];
    if (detail) return mock(detail);
    // id อื่นในตาราง S1 — ใช้ค่าของแถวนั้นทับรายละเอียดตัวอย่าง ให้ "ประมูลใหม่" เติมราคาตรงกับแถวที่กด
    const row = SELLER_AUCTION_PAGE_FIXTURE.page.items.find((r) => r.id === id);
    const base = SELLER_AUCTION_DETAIL_FIXTURES[142];
    return mock(
      row
        ? { ...base, id: row.id, auctionNumber: row.auctionNumber, item: row.item, unitLabel: row.unitLabel, status: row.status, startingPrice: row.startingPrice, currentPrice: row.currentPrice, bidCount: row.bidCount, buyNowPrice: row.buyNowPrice, buyNowAvailable: row.buyNowAvailable, endsAt: row.endsAt, sellerNote: null }
        : base,
    );
  }
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

// ---------- แอดมิน ----------

export type AdminAuctionListParams = { tab?: AdminAuctionTab; q?: string; page?: number; size?: number };

export function getAdminAuctions(params: AdminAuctionListParams = {}): Promise<AdminAuctionPage> {
  if (AUCTION_MOCK.admin) {
    // mock กรองแท็บ + ค้นชื่อการ์ด/ร้าน/รหัสประมูล ตัวนับในแท็บยังเป็นเลขตาม Figma
    const fixture = ADMIN_AUCTION_PAGE_FIXTURE;
    const q = params.q?.trim().toLowerCase();
    const items = fixture.page.items.filter(
      (row) =>
        matchesAdminAuctionTab(params.tab ?? "ALL", row) &&
        (!q || [row.cardName, row.shopName, row.sellerUsername, row.auctionNumber].some((field) => field.toLowerCase().includes(q))),
    );
    const filtered = items.length !== fixture.page.items.length;
    return mock({
      ...fixture,
      page: filtered ? { ...fixture.page, items, totalItems: items.length, totalPages: items.length ? 1 : 0 } : fixture.page,
      serverTime: nowIso(),
    });
  }
  return api.get<AdminAuctionPage>("/admin/auctions", { query: params });
}

export function getAdminAuction(id: number): Promise<AdminAuctionDetail> {
  if (AUCTION_MOCK.admin) return mock(ADMIN_AUCTION_DETAIL_FIXTURES[id] ?? { ...ADMIN_AUCTION_DETAIL_FIXTURE, id });
  return api.get<AdminAuctionDetail>(`/admin/auctions/${id}`);
}

export function suspendAuction(id: number, payload: SuspendAuctionRequest): Promise<AdminAuctionDetail> {
  if (AUCTION_MOCK.admin) {
    const base = ADMIN_AUCTION_DETAIL_FIXTURES[id] ?? { ...ADMIN_AUCTION_DETAIL_FIXTURE, id };
    return mock({
      ...base,
      status: "SUSPENDED",
      // ระงับแล้วบิดทั้งหมดถูกยกเลิก
      bids: base.bids.map((bid) => ({ ...bid, status: "CANCELLED" as const })),
      actions: [{ action: "SUSPEND", adminName: "admin", reason: payload.reason, at: nowIso() }],
      serverTime: nowIso(),
    });
  }
  return api.post<AdminAuctionDetail>(`/admin/auctions/${id}/suspend`, payload);
}

export type BannedBidderParams = { tab?: BanTab; q?: string; page?: number; size?: number };

export function getBannedBidders(params: BannedBidderParams = {}): Promise<BannedBidderPage> {
  if (AUCTION_MOCK.admin) {
    const fixture = BANNED_BIDDER_PAGE_FIXTURE;
    const q = params.q?.trim().toLowerCase();
    const items = fixture.page.items.filter(
      (b) =>
        banTabOf(b) === (params.tab ?? "BANNED") &&
        (!q || b.username.toLowerCase().includes(q) || b.maskedEmail.toLowerCase().includes(q)),
    );
    return mock({ ...fixture, page: { ...fixture.page, items, totalItems: items.length, totalPages: items.length ? 1 : 0 } });
  }
  return api.get<BannedBidderPage>("/admin/auctions/banned-bidders", { query: params });
}

/** ทุกแถวของแท็บและคำค้นนี้ ไม่ใช่แค่หน้าที่เปิดอยู่ — สำหรับส่งออก [TCG-749] */
export function getAllAdminAuctions(params: Omit<AdminAuctionListParams, "page" | "size">): Promise<AdminAuctionRow[]> {
  return fetchAllPages(async (page, size) => (await getAdminAuctions({ ...params, page, size })).page);
}

/** ทุกแถวของแท็บและคำค้นนี้ ไม่ใช่แค่หน้าที่เปิดอยู่ — สำหรับส่งออก [TCG-749] */
export function getAllBannedBidders(params: Omit<BannedBidderParams, "page" | "size">): Promise<BannedBidder[]> {
  return fetchAllPages(async (page, size) => (await getBannedBidders({ ...params, page, size })).page);
}

export function liftBiddingBan(userId: number, payload: LiftBiddingBanRequest): Promise<BannedBidder> {
  if (AUCTION_MOCK.admin) {
    const row = BANNED_BIDDER_PAGE_FIXTURE.page.items.find((b) => b.userId === userId) ?? BANNED_BIDDER_PAGE_FIXTURE.page.items[0];
    return mock({ ...row, strikeCount: 0, bannedUntil: null, liftedAt: nowIso() });
  }
  return api.post<BannedBidder>(`/admin/auctions/banned-bidders/${userId}/lift`, payload);
}
