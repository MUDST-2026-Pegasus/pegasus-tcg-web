import type { PageResponse } from "@/lib/api/types";
import type { CardCondition } from "@/features/catalog/catalog.types";
import type { ListingCard } from "@/features/seller/products/products.types";

// ---------- API contract ของระบบประมูล [TCG-613 · C-2] ----------
// ลอกมาจาก `dto/AuctionViews.java`, `dto/AuctionRequests.java`,
// `dto/SellerAuctionViews.java`, `dto/AdminAuctionViews.java` และ enum ใน `model/Auction*.java`
// ถ้าฝั่งนั้นแก้ ส่วนนี้ต้องแก้ตาม — ห้ามเปลี่ยนฝั่งเดียว
// ค่าดิบทั้งหมด (เงินเป็นบาท, เวลาเป็น ISO-8601 พร้อม timezone) ข้อความไปจัดใน auction.format.ts
// หน้าที่มีตัวนับถอยหลังได้ `serverTime` มาด้วย ใช้ชดเชยนาฬิกาเครื่องก่อนนับไปหา `endsAt`
//
// endpoint ทั้งหมด (ขึ้นต้น /api/v1 ทุกตัวห่อด้วย ApiResult):
//   GET    /auctions                         ?filter&gameId&q&sort&page&size → AuctionPage        (guest ได้)
//   GET    /auctions/:id                                                   → AuctionDetail      (guest ได้)
//   GET    /auctions/:id/bids                ?page&size                    → BidHistory         (guest ได้)
//   POST   /auctions/:id/bids                PlaceBidRequest               → BidPlaced (201)
//   POST   /auctions/:id/buy-now                                           → AuctionWin
//   POST   /auctions/:id/checkout            AuctionCheckoutRequest        → CheckoutResponse   (header Idempotency-Key)
//   POST   /auctions/:id/second-chance/accept                              → AuctionWin
//   POST   /auctions/:id/second-chance/decline                             → null
//   GET    /me/auctions                      ?tab&page&size                → MyAuctionPage
//   GET    /sellers/me/auctions              ?status&q&page&size           → SellerAuctionPage
//   GET    /sellers/me/auctions/eligible-units ?q&gameId&condition&page&size → EligibleUnitPage
//   POST   /sellers/me/auctions              CreateAuctionRequest          → SellerAuctionDetail (201)
//   GET    /sellers/me/auctions/:id                                        → SellerAuctionDetail
//   PATCH  /sellers/me/auctions/:id          UpdateAuctionRequest          → SellerAuctionDetail
//   POST   /sellers/me/auctions/:id/cancel                                 → SellerAuctionDetail
//   POST   /sellers/me/auctions/:id/decision SellerDecisionRequest         → SellerAuctionDetail
//   GET    /admin/auctions                   ?tab&q&page&size              → AdminAuctionPage
//   GET    /admin/auctions/:id                                             → AdminAuctionDetail
//   POST   /admin/auctions/:id/suspend       SuspendAuctionRequest         → AdminAuctionDetail
//   GET    /admin/auctions/banned-bidders    ?tab&q&page&size              → BannedBidderPage
//   POST   /admin/auctions/banned-bidders/:userId/lift LiftBiddingBanRequest → BannedBidder

// ---------- สถานะ ----------

/** `model/AuctionStatus.java` */
export type AuctionStatus =
  | "LIVE"
  | "AWAITING_PAYMENT"
  | "AWAITING_SELLER_DECISION"
  | "OFFERED_TO_SECOND"
  | "SOLD"
  | "UNSOLD"
  | "CANCELLED"
  | "SUSPENDED";

/** `model/BidStatus.java` — บิดถอนไม่ได้ ถูกยกเลิกได้อย่างเดียวตอนแอดมินระงับ */
export type BidStatus = "ACTIVE" | "CANCELLED";

/** `model/AuctionOfferStatus.java` — ข้อเสนอให้ผู้บิดอันดับ 2 */
export type AuctionOfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

/** `model/AuctionViewerState.java` — สถานะของผู้ใช้คนนี้ในประมูล (คำนวณทุกครั้ง ไม่ได้เก็บ) */
export type AuctionViewerState =
  | "LEADING"
  | "OUTBID"
  | "WON_AWAITING_PAYMENT"
  | "SECOND_CHANCE"
  | "WON"
  | "LOST";

/**
 * error code ของระบบประมูล (`exception/ErrorCode.java`) พร้อมข้อความใน Figma AUC-B3-E / S3-E
 * - `AUCTION_NOT_FOUND` 404
 * - `AUCTION_CLOSED` 409 — ประมูลจบแล้ว / เลยเวลาชำระหรือเลือกแล้ว
 * - `BID_TOO_LOW` 409 — "ราคาต่ำกว่าขั้นต่ำ" หรือ "มีคนบิดก่อนคุณ" (`details.minNextBid`, `details.currentPrice`)
 * - `BIDDING_BANNED` 403 — "ถูกห้ามบิดถึง …" (`details.bannedUntil`)
 * - `OWN_AUCTION` 403 — "บิดประมูลของตัวเองไม่ได้"
 * - `NO_SHIPPING_ADDRESS` 400 — "ยังไม่มีที่อยู่จัดส่ง"
 * - `BUY_NOW_UNAVAILABLE` 409 — ปุ่มซื้อทันทีหายไปแล้ว (มีบิดแรก)
 * - `AUCTION_HAS_BIDS` 409 — "ยกเลิกไม่ได้ — มีผู้บิดแล้ว" / "แก้ไม่ได้แล้ว — มีผู้บิดคนแรก"
 * - `AUCTION_END_TOO_SOON` 400 — "เวลาปิดเร็วเกินไป"
 * - `AUCTION_END_TOO_FAR` 400 — "เวลาปิดไกลเกินไป"
 * - `BUY_NOW_BELOW_START` 400 — "ราคาซื้อทันทีต้องสูงกว่าราคาเริ่มต้น"
 * - `UNIT_NOT_AVAILABLE` 409 — "การ์ดใบนี้ไม่ว่าง"
 * - `NO_SECOND_BIDDER` 409 — ไม่มีผู้บิดอันดับ 2
 * - `OFFER_EXPIRED` 409 — ข้อเสนอหมดเวลาแล้ว
 *
 * ใช้ของเดิมด้วย: `EMAIL_NOT_VERIFIED` ("ยังไม่ได้ยืนยันอีเมล"), `SELLER_NOT_VERIFIED` ("ร้านยังไม่ผ่านการยืนยัน")
 */
export type AuctionErrorCode =
  | "AUCTION_NOT_FOUND"
  | "AUCTION_CLOSED"
  | "BID_TOO_LOW"
  | "BIDDING_BANNED"
  | "OWN_AUCTION"
  | "NO_SHIPPING_ADDRESS"
  | "BUY_NOW_UNAVAILABLE"
  | "AUCTION_HAS_BIDS"
  | "AUCTION_END_TOO_SOON"
  | "AUCTION_END_TOO_FAR"
  | "BUY_NOW_BELOW_START"
  | "UNIT_NOT_AVAILABLE"
  | "NO_SECOND_BIDDER"
  | "OFFER_EXPIRED";

/** เหตุที่บิดไม่ได้ใน `Viewer.blockers` */
export type BidBlocker = "EMAIL_NOT_VERIFIED" | "NO_SHIPPING_ADDRESS" | "BIDDING_BANNED" | "OWN_AUCTION";

// ---------- ฝั่งผู้ซื้อ / public (`AuctionViews`) ----------

/** chip กรองในหน้ารวม (B1) */
export type AuctionFilter = "ENDING_SOON" | "BUY_NOW" | "NO_BIDS" | "NEW";
export type AuctionSort = "ENDING_SOON" | "NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "MOST_BIDS";
/** แท็บในหน้า "การประมูลของฉัน" ฝั่งผู้ซื้อ (W1) */
export type MyAuctionTab = "ALL" | "BIDDING" | "TO_PAY" | "SECOND_CHANCE" | "WON" | "LOST";

export type AuctionListParams = {
  filter?: AuctionFilter;
  gameId?: number;
  q?: string;
  sort?: AuctionSort;
  page?: number;
  size?: number;
};

/** การ์ดที่ประมูล — การ์ดจริง 1 ใบจากสต็อก (คุณสมบัติ/ท่าโจมตีดึงจากแคตตาล็อกด้วย `card.productSlug`) */
export type AuctionItem = {
  card: ListingCard;
  condition: CardCondition;
  gameName: string;
  setName: string;
  cardNumber: string;
  rarity: string | null;
};

export type AuctionSeller = {
  sellerProfileId: number;
  shopName: string;
  username: string;
  /** 0–5, `null` = ยังไม่มีรีวิว */
  rating: number | null;
  /** แสดงเป็น "1.2k ขาย" */
  soldCount: number;
};

/** บิดหนึ่งครั้งที่คนทั่วไปเห็น — ชื่อผู้บิดถูกปิดบัง ("n***t") */
export type AuctionBid = {
  bidderAlias: string;
  /** 2 ตัวอักษรในวงกลม avatar */
  bidderInitials: string;
  /** บิดของผู้ใช้ที่ล็อกอินอยู่ → แสดง "(คุณ)" */
  mine: boolean;
  amount: number;
  placedAt: string;
};

/** การ์ดประมูลหนึ่งใบในหน้ารวม (B1) */
export type AuctionSummary = {
  id: number;
  auctionNumber: string;
  item: AuctionItem;
  shopName: string;
  startingPrice: number;
  /** บิดสูงสุด หรือราคาเริ่มต้นถ้า `bidCount` = 0 (ตอนนั้นป้ายเป็น "ราคาเริ่มต้น") */
  currentPrice: number;
  bidCount: number;
  /** `null` = ซื้อทันทีไม่ได้แล้ว / ไม่ได้ตั้ง */
  buyNowPrice: number | null;
  endsAt: string;
};

export type AuctionPage = {
  page: PageResponse<AuctionSummary>;
  filterCounts: Record<AuctionFilter, number>;
  /** chip "ทั้งหมด" */
  totalLive: number;
  serverTime: string;
};

/** ข้อเสนอจากผู้ขายเมื่อผู้ใช้เป็นผู้บิดอันดับ 2 (B3-G) */
export type SecondChanceOffer = {
  amount: number;
  shippingFee: number;
  /** amount + shippingFee */
  total: number;
  status: AuctionOfferStatus;
  expiresAt: string;
};

/** ผู้ใช้ที่ล็อกอินอยู่ยืนตรงไหนในประมูลนี้ (B3-D/E/F) — `null` ถ้าเป็น guest */
export type AuctionViewer = {
  /** `null` = ยังไม่เคยบิด */
  state: AuctionViewerState | null;
  myHighestBid: number | null;
  ownAuction: boolean;
  /** ว่าง = บิดได้ */
  blockers: BidBlocker[];
  /** มากับ `BIDDING_BANNED` */
  bannedUntil: string | null;
  /** มากับ `WON_AWAITING_PAYMENT` */
  paymentDueAt: string | null;
  /** มากับ `SECOND_CHANCE` */
  offer: SecondChanceOffer | null;
};

/** หน้ารายละเอียดประมูล (B2) */
export type AuctionDetail = {
  id: number;
  auctionNumber: string;
  status: AuctionStatus;
  item: AuctionItem;
  /** รูปถ่ายจริงของผู้ขาย (presigned) — รูปทางการอยู่ที่ `item.card.officialImageUrl` */
  photoUrls: string[];
  seller: AuctionSeller;
  /** "หมายเหตุจากผู้ขาย" — `null` = ไม่ได้เขียน (ซ่อนกล่อง) */
  sellerNote: string | null;
  startingPrice: number;
  bidIncrement: number;
  currentPrice: number;
  /** บิดขั้นต่ำครั้งถัดไป — ราคาเริ่มต้นถ้ายังไม่มีบิด ไม่งั้นบิดสูงสุด + ขั้นบิด */
  minNextBid: number;
  bidCount: number;
  bidderCount: number;
  /** ราคาที่ผู้ขายตั้ง — `null` = ไม่ได้ตั้ง */
  buyNowPrice: number | null;
  /** true เฉพาะ LIVE + ยังไม่มีบิด + ตั้งราคาไว้ */
  buyNowAvailable: boolean;
  startedAt: string;
  /** เวลาปิดที่ผู้ขายตั้ง */
  originalEndsAt: string;
  /** เวลาปิดตอนนี้ หลังต่อเวลา 2 นาที */
  endsAt: string;
  extensionCount: number;
  /** ค่าส่งถ้าชนะ — ใช้ใน "ยอดที่ต้องชำระถ้าชนะ" */
  shippingFee: number;
  /** ใหม่สุดก่อน ไม่เกิน 5 รายการ — ทั้งหมดอยู่ที่ `/auctions/:id/bids` */
  recentBids: AuctionBid[];
  viewer: AuctionViewer | null;
  serverTime: string;
};

export type BidHistory = {
  page: PageResponse<AuctionBid>;
  serverTime: string;
};

/** body ของ `POST /auctions/:id/bids` */
export type PlaceBidRequest = { amount: number };

/** ผลหลังบิดสำเร็จ */
export type BidPlaced = {
  auctionId: number;
  amount: number;
  leading: boolean;
  /** true = บิดใน 2 นาทีสุดท้าย เวลากลับเป็น 2 นาที */
  extended: boolean;
  currentPrice: number;
  minNextBid: number;
  bidCount: number;
  endsAt: string;
  serverTime: string;
};

/** ได้สิทธิ์ซื้อแล้ว ต้องชำระใน 24 ชม. ผ่าน `POST /auctions/:id/checkout` — มาจากซื้อทันทีหรือรับข้อเสนออันดับ 2 */
export type AuctionWin = {
  auctionId: number;
  auctionNumber: string;
  price: number;
  shippingFee: number;
  total: number;
  paymentDueAt: string;
  serverTime: string;
};

/** body ของ `POST /auctions/:id/checkout` (ต้องส่ง header `Idempotency-Key`) — ตอบกลับเป็น `CheckoutResponse` เดิม */
export type AuctionCheckoutRequest = {
  shippingAddressId: number;
  /** `null` = ใช้ค่าเริ่มต้นของร้าน */
  shippingOptionId: number | null;
  buyerNote: string | null;
  /** ยอดที่ผู้ซื้อเห็นล่าสุด — ไม่ตรงได้ 409 `CART_PRICE_CHANGED` */
  expectedGrandTotal: number | null;
};

/** หนึ่งแถวใน "การประมูลของฉัน" ฝั่งผู้ซื้อ (W1) */
export type MyAuction = {
  id: number;
  auctionNumber: string;
  item: AuctionItem;
  shopName: string;
  bidCount: number;
  state: AuctionViewerState;
  /** บิดสูงสุดตอนยังเปิด / ราคาปิดเมื่อจบ */
  currentPrice: number;
  /** บิดสูงสุดของผู้ใช้ — กรณี SECOND_CHANCE คือราคาที่เสนอ */
  myHighestBid: number;
  shippingFee: number;
  /** ราคา + ค่าส่ง — มากับ WON_AWAITING_PAYMENT และ SECOND_CHANCE */
  totalDue: number | null;
  /** มาตอนยังเปิด ใช้กับปุ่ม "บิด ฿X" */
  minNextBid: number | null;
  /** ยังเปิดและเคยต่อเวลาแล้ว → "ต่อเวลาอยู่" */
  extended: boolean;
  endsAt: string;
  /** กำหนดชำระ (WON_AWAITING_PAYMENT) หรือเวลาตอบข้อเสนอ (SECOND_CHANCE) */
  deadline: string | null;
  /** มีเมื่อกด checkout แล้ว */
  orderId: number | null;
};

export type MyAuctionPage = {
  page: PageResponse<MyAuction>;
  tabCounts: Record<MyAuctionTab, number>;
  /** "ไม่ชำระหลังชนะ 0 / 3 ครั้ง" */
  unpaidStrikes: number;
  strikeLimit: number;
  bannedUntil: string | null;
  serverTime: string;
};

// ---------- ฝั่งผู้ขาย (`SellerAuctionViews`) ----------

export type SellerAuctionKpis = {
  liveCount: number;
  liveWithBids: number;
  awaitingPaymentCount: number;
  nextPaymentDueAt: string | null;
  soldLast30Days: number;
  /** "จาก 6 รายการ" */
  closedLast30Days: number;
  /** ราคาปิดเทียบราคาตลาด เป็น % มีเครื่องหมาย — `null` = ข้อมูลไม่พอ */
  closeVsMarketPercent: number | null;
};

/** หนึ่งแถวในตาราง "การประมูลของฉัน" ฝั่งผู้ขาย (S1) */
export type SellerAuctionRow = {
  id: number;
  auctionNumber: string;
  item: AuctionItem;
  /** รหัสใบสั้น ๆ เช่น "U-0771" */
  unitLabel: string;
  startingPrice: number;
  currentPrice: number;
  bidCount: number;
  buyNowPrice: number | null;
  buyNowAvailable: boolean;
  status: AuctionStatus;
  endsAt: string;
  /** กำหนดชำระ / เวลาที่ผู้ขายต้องเลือก / เวลาที่อันดับ 2 ต้องตอบ แล้วแต่สถานะ */
  deadline: string | null;
  /** มีเมื่อมีคำสั่งซื้อแล้ว → ปุ่ม "ดูคำสั่งซื้อ" */
  orderId: number | null;
};

export type SellerAuctionPage = {
  page: PageResponse<SellerAuctionRow>;
  statusCounts: Record<AuctionStatus, number>;
  kpis: SellerAuctionKpis;
  serverTime: string;
};

/** การ์ดในสต็อกนำมาประมูลได้ไหม (S2a) */
export type UnitAvailability = "AVAILABLE" | "LISTED" | "IN_AUCTION" | "RESERVED";

export type MarketGuide = {
  /** "เทียบกับราคาตลาด (12 ประกาศที่ขายอยู่)" */
  listingCount: number;
  min: number;
  median: number;
  max: number;
};

/** การ์ดหนึ่งใบในขั้น "เลือกการ์ดจากสต็อก" (S2a) — ใบที่เลือกไม่ได้ก็แสดงพร้อมเหตุผล */
export type EligibleUnit = {
  unitUid: string;
  unitLabel: string;
  item: AuctionItem;
  /** ทุน — `null` = ไม่ได้บันทึก */
  unitCost: number | null;
  marketGuide: MarketGuide | null;
  availability: UnitAvailability;
  /** "#AUC-2026-0151" หรือ "#ORD-10377" เมื่อ IN_AUCTION / RESERVED */
  heldBy: string | null;
};

export type EligibleUnitPage = {
  page: PageResponse<EligibleUnit>;
  /** "แสดง 5 จาก 37 ใบในสต็อก" */
  totalInStock: number;
};

/** body ของ `POST /sellers/me/auctions` */
export type CreateAuctionRequest = {
  unitUid: string;
  startingPrice: number;
  bidIncrement: number;
  /** 1 ชม.–30 วันจากตอนนี้ */
  endsAt: string;
  /** `null` = ไม่เปิดซื้อทันที */
  buyNowPrice: number | null;
  sellerNote: string | null;
};

/** body ของ `PATCH /sellers/me/auctions/:id` — ส่งทั้งสองช่อง ได้เฉพาะตอนยังไม่มีบิด */
export type UpdateAuctionRequest = {
  /** `null` = ปิดซื้อทันที */
  buyNowPrice: number | null;
  sellerNote: string | null;
};

export type DecisionChoice = "OFFER_TO_SECOND" | "RELIST";
/** body ของ `POST /sellers/me/auctions/:id/decision` */
export type SellerDecisionRequest = { choice: DecisionChoice };

export type SecondBidder = {
  bidderAlias: string;
  amount: number;
  /** รายรับถ้าขายให้อันดับ 2 หลังหักค่าคอม */
  estimatedPayout: number;
};

/** ผู้ชนะไม่จ่าย รอผู้ขายเลือก (S3-H, S4b) — ไม่เลือกภายใน `decideBy` การ์ดกลับเข้าสต็อก */
export type PendingDecision = {
  winnerAlias: string;
  winningBid: number;
  cancelledOrderNumber: string;
  decideBy: string;
  /** `null` = มีผู้บิดคนเดียว → ปุ่ม "เสนอขายให้อันดับ 2" กดไม่ได้ */
  secondBidder: SecondBidder | null;
};

export type SentOffer = {
  bidderAlias: string;
  amount: number;
  status: AuctionOfferStatus;
  expiresAt: string;
};

/** รายละเอียดประมูลฝั่งผู้ขาย (S4, S4b) */
export type SellerAuctionDetail = {
  id: number;
  auctionNumber: string;
  status: AuctionStatus;
  item: AuctionItem;
  unitLabel: string;
  startingPrice: number;
  bidIncrement: number;
  currentPrice: number;
  bidCount: number;
  bidderCount: number;
  /** ราคาปัจจุบันหลังหักค่าคอม */
  estimatedPayout: number;
  /** เท่าการขายปกติ เช่น 5 */
  commissionPercent: number;
  buyNowPrice: number | null;
  buyNowAvailable: boolean;
  sellerNote: string | null;
  /** แก้ราคาซื้อทันที/หมายเหตุได้ไหม (LIVE + ยังไม่มีบิด) */
  editable: boolean;
  /** กติกาเดียวกับ editable */
  cancellable: boolean;
  startedAt: string;
  originalEndsAt: string;
  endsAt: string;
  extensionCount: number;
  /** ตอนที่ปุ่มซื้อทันทีหายไป */
  firstBidAt: string | null;
  winnerAlias: string | null;
  paymentDueAt: string | null;
  decision: PendingDecision | null;
  offer: SentOffer | null;
  orderId: number | null;
  /** ใหม่สุดก่อน ชื่อปิดบัง */
  bids: AuctionBid[];
  serverTime: string;
};

// ---------- ฝั่งแอดมิน (`AdminAuctionViews`) ----------

export type AdminAuctionTab = "ALL" | "FLAGGED" | "LIVE" | "AWAITING_PAYMENT" | "ENDED" | "SUSPENDED";

/** สัญญาณที่ควรตรวจ (A1, A3) */
export type AuctionSignal = "NEW_ACCOUNT_RAPID_BIDS" | "SHARED_ADDRESS_WITH_SELLER" | "REPORTED";

export type AdminAuctionKpis = {
  live: number;
  endingWithinHour: number;
  awaitingPayment: number;
  offeredToSecond: number;
  suspendedLast30Days: number;
};

export type AdminAuctionRow = {
  id: number;
  auctionNumber: string;
  cardName: string;
  shopName: string;
  sellerUsername: string;
  currentPrice: number;
  bidCount: number;
  bidderCount: number;
  status: AuctionStatus;
  endsAt: string;
  deadline: string | null;
  signals: AuctionSignal[];
  /** "ถูกรายงาน 3" */
  reportCount: number;
  suspendedAt: string | null;
};

export type AdminAuctionPage = {
  page: PageResponse<AdminAuctionRow>;
  tabCounts: Record<AdminAuctionTab, number>;
  kpis: AdminAuctionKpis;
  /** แบนเนอร์เหนือตาราง */
  flaggedCount: number;
  serverTime: string;
};

export type AdminAuctionSeller = {
  sellerProfileId: number;
  shopName: string;
  username: string;
  verified: boolean;
  auctionCount: number;
  suspensionCount: number;
};

export type AuctionSignalDetail = { signal: AuctionSignal; message: string };

/** บิดพร้อมชื่อเต็ม — แอดมินเท่านั้น */
export type AdminBid = {
  bidId: number;
  userId: number;
  username: string;
  memberSince: string;
  orderCount: number;
  amount: number;
  placedAt: string;
  status: BidStatus;
  signals: AuctionSignal[];
};

export type AdminAuctionAction = {
  action: string;
  adminName: string;
  reason: string | null;
  at: string;
};

/** รายละเอียดประมูลฝั่งแอดมิน (A3) */
export type AdminAuctionDetail = {
  id: number;
  auctionNumber: string;
  status: AuctionStatus;
  item: AuctionItem;
  seller: AdminAuctionSeller;
  startingPrice: number;
  bidIncrement: number;
  currentPrice: number;
  bidCount: number;
  bidderCount: number;
  buyNowPrice: number | null;
  originalEndsAt: string;
  endsAt: string;
  extensionCount: number;
  sellerNote: string | null;
  sellerNoteUpdatedAt: string | null;
  signals: AuctionSignalDetail[];
  reportCount: number;
  bids: AdminBid[];
  actions: AdminAuctionAction[];
  serverTime: string;
};

/** body ของ `POST /admin/auctions/:id/suspend` */
export type SuspendAuctionRequest = { reason: string };

export type BanTab = "BANNED" | "AT_RISK" | "HISTORY";

export type BidStrike = { auctionId: number; auctionNumber: string; at: string };

/** ผู้ใช้ที่ติดโทษไม่ชำระ (A4) */
export type BannedBidder = {
  userId: number;
  username: string;
  maskedEmail: string;
  memberSince: string;
  strikeCount: number;
  strikeLimit: number;
  bannedUntil: string | null;
  liftedAt: string | null;
  /** ใหม่สุดก่อน */
  strikes: BidStrike[];
};

export type BannedBidderPage = {
  page: PageResponse<BannedBidder>;
  tabCounts: Record<BanTab, number>;
  liftedLast30Days: number;
  expiredLast30Days: number;
};

/** body ของ `POST /admin/auctions/banned-bidders/:userId/lift` (ไม่บังคับ) */
export type LiftBiddingBanRequest = { reason: string | null };
