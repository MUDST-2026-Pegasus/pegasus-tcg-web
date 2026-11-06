import type {
  AdminAuctionDetail,
  AdminAuctionPage,
  AuctionBid,
  AuctionDetail,
  AuctionItem,
  AuctionPage,
  AuctionSeller,
  AuctionStatus,
  AuctionSummary,
  BannedBidder,
  BannedBidderPage,
  BidHistory,
  EligibleUnitPage,
  MyAuction,
  MyAuctionPage,
  SellerAuctionDetail,
  SellerAuctionPage,
  SellerAuctionRow,
} from "./auction.types";

// ---------- mock ตาม contract C-2 [TCG-613] ----------
// ข้อมูลชุดเดียวกับที่ `AuctionSamples.java` คืน และตัวเลขตรงกับ Figma section AUC
// ใช้ระหว่างที่ BE ยังไม่มี logic — การ์ด I-1 ถึง I-4 สลับ auction.api.ts ไปเรียก API จริง
// เวลาคิดจากตอนโหลดไฟล์ ตัวนับถอยหลังจึงเดินได้จริง
// ใบที่ตั้งใจให้เห็นแต่ละสถานะ:
//   142 LIVE มีบิด ต่อเวลาแล้ว · 150 LIVE ยังไม่มีบิด ซื้อทันทีได้ · 151 LIVE เหลือไม่ถึง 2 นาที
//   117 AWAITING_PAYMENT
//   133 SOLD · 126 UNSOLD · 140 CANCELLED · 98 SUSPENDED
//   ฝั่งผู้ขาย S4 เพิ่ม: 121 UNSOLD ผู้ชนะไม่ชำระ · 158 ขายด้วยซื้อทันที รอชำระ
// กล่องบิด B4 อื่น ๆ (guest / ร้านตัวเอง / ห้ามบิด / ไม่มีที่อยู่) ดูด้วย `withViewer` ด้านล่าง

const NOW = Date.now();
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();
const serverTime = () => new Date().toISOString();

const SHIPPING = 50;
const COMMISSION_PERCENT = 5;
const STRIKE_LIMIT = 3;
const CHARIZARD_NOTE =
  "เก็บใน top loader ตั้งแต่แกะซอง ไม่เคยเล่น มีรูปมุมทั้ง 4 ด้านให้ดูในแกลเลอรี · ส่งแบบกล่องแข็ง";

function item(
  variantId: number,
  productName: string,
  productSlug: string,
  condition: AuctionItem["condition"],
  setName: string,
  cardNumber: string,
  rarity: string | null,
): AuctionItem {
  return {
    card: {
      variantId,
      sku: `PKM-${variantId}`,
      variantLabel: condition,
      variantActive: true,
      productId: variantId,
      productName,
      productSlug,
      gameId: 1,
      officialImageUrl: null,
    },
    condition,
    gameName: "Pokémon TCG",
    setName,
    cardNumber,
    rarity,
  };
}

export const AUCTION_ITEMS = {
  charizard: item(1020, "Charizard VMAX #020", "charizard-vmax-020", "NM", "Sword & Shield — Darkness Ablaze", "020/189", "Ultra Rare"),
  pikachu: item(1188, "Pikachu VMAX — Rainbow", "pikachu-vmax-rainbow", "NM", "Vivid Voltage", "188/185", "Rainbow Rare"),
  umbreon: item(1215, "Umbreon VMAX Alt Art", "umbreon-vmax-alt-art", "LP", "Evolving Skies", "215/203", "Secret Rare"),
  rayquaza: item(1218, "Rayquaza VMAX Alt Art", "rayquaza-vmax-alt-art", "NM", "Evolving Skies", "218/203", "Secret Rare"),
  lugia: item(1186, "Lugia V Alt Art #186", "lugia-v-alt-art-186", "NM", "Silver Tempest", "186/195", "Ultra Rare"),
  espeon: item(1270, "Espeon VMAX Alt Art", "espeon-vmax-alt-art", "NM", "Evolving Skies", "270/203", "Secret Rare"),
  mew: item(1232, "Mew ex SIR #232", "mew-ex-sir-232", "NM", "Paldean Fates", "232/091", "Special Illustration Rare"),
  mewtwo: item(1072, "Mewtwo GX Rainbow", "mewtwo-gx-rainbow", "MP", "Shining Legends", "076/073", "Rainbow Rare"),
  blastoise: item(1200, "Blastoise ex SIR", "blastoise-ex-sir", "NM", "Scarlet & Violet 151", "200/165", "Special Illustration Rare"),
  gengar: item(1271, "Gengar VMAX Alt Art", "gengar-vmax-alt-art", "NM", "Fusion Strike", "271/264", "Secret Rare"),
  charizardEx: item(1125, "Charizard ex — Obsidian Flames", "charizard-ex-obsidian-flames", "NM", "Obsidian Flames", "125/197", "Double Rare"),
} satisfies Record<string, AuctionItem>;

const I = AUCTION_ITEMS;

export const AUCTION_SELLERS = {
  cardVault: { sellerProfileId: 11, shopName: "CardVault BKK", username: "cardvault_bkk", rating: 4.9, soldCount: 1200 },
  rareCard: { sellerProfileId: 12, shopName: "RareCard Station", username: "rarecard_station", rating: 4.8, soldCount: 860 },
} satisfies Record<string, AuctionSeller>;

const CHARIZARD_BIDS: AuctionBid[] = [
  { bidderAlias: "n***t", bidderInitials: "NS", mine: true, amount: 8450, placedAt: at(-2 * MINUTE) },
  { bidderAlias: "m***a", bidderInitials: "MK", mine: false, amount: 8300, placedAt: at(-4 * MINUTE) },
  { bidderAlias: "t***n", bidderInitials: "TP", mine: false, amount: 8000, placedAt: at(-9 * MINUTE) },
  { bidderAlias: "n***t", bidderInitials: "NS", mine: true, amount: 7500, placedAt: at(-1 * HOUR) },
  { bidderAlias: "p***m", bidderInitials: "PP", mine: false, amount: 6800, placedAt: at(-3 * HOUR) },
  { bidderAlias: "m***a", bidderInitials: "MK", mine: false, amount: 5000, placedAt: at(-1 * DAY) },
];

// ---------- public / ผู้ซื้อ ----------

const SUMMARIES: AuctionSummary[] = [
  { id: 151, auctionNumber: "AUC-2026-0151", item: I.umbreon, shopName: "RareCard Station", startingPrice: 5000, currentPrice: 15200, bidCount: 27, buyNowPrice: null, endsAt: at(102 * SECOND) },
  { id: 142, auctionNumber: "AUC-2026-0142", item: I.charizard, shopName: "CardVault BKK", startingPrice: 2000, currentPrice: 8450, bidCount: 12, buyNowPrice: null, endsAt: at(1 * DAY + 4 * HOUR) },
  { id: 150, auctionNumber: "AUC-2026-0150", item: I.pikachu, shopName: "CardVault BKK", startingPrice: 2400, currentPrice: 2400, bidCount: 0, buyNowPrice: 3500, endsAt: at(3 * DAY + 4 * HOUR) },
  { id: 139, auctionNumber: "AUC-2026-0139", item: I.rayquaza, shopName: "RareCard Station", startingPrice: 5000, currentPrice: 21500, bidCount: 41, buyNowPrice: null, endsAt: at(2 * MINUTE) },
  { id: 155, auctionNumber: "AUC-2026-0155", item: I.gengar, shopName: "PokeHub Thailand", startingPrice: 6000, currentPrice: 8200, bidCount: 5, buyNowPrice: null, endsAt: at(6 * HOUR) },
];

export const AUCTION_PAGE_FIXTURE: AuctionPage = {
  page: { items: SUMMARIES, page: 0, size: 20, totalItems: 128, totalPages: 7 },
  filterCounts: { ENDING_SOON: 14, BUY_NOW: 32, NO_BIDS: 41, NEW: 9 },
  totalLive: 128,
  serverTime: serverTime(),
};

/** B1 ว่าง (AUC-E1) */
export const AUCTION_PAGE_EMPTY_FIXTURE: AuctionPage = {
  page: { items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 },
  filterCounts: { ENDING_SOON: 0, BUY_NOW: 0, NO_BIDS: 0, NEW: 0 },
  totalLive: 0,
  serverTime: serverTime(),
};

const CHARIZARD_DETAIL: AuctionDetail = {
  id: 142,
  auctionNumber: "AUC-2026-0142",
  status: "LIVE",
  item: I.charizard,
  photoUrls: [],
  seller: AUCTION_SELLERS.cardVault,
  sellerNote: CHARIZARD_NOTE,
  startingPrice: 2000,
  bidIncrement: 100,
  currentPrice: 8450,
  minNextBid: 8550,
  bidCount: 12,
  bidderCount: 7,
  buyNowPrice: 12000,
  buyNowAvailable: false,
  startedAt: at(-3 * DAY),
  originalEndsAt: at(1 * DAY),
  endsAt: at(1 * DAY + 4 * HOUR),
  extensionCount: 3,
  shippingFee: SHIPPING,
  recentBids: CHARIZARD_BIDS.slice(0, 5),
  viewer: { state: "LEADING", myHighestBid: 8450, ownAuction: false, blockers: [], bannedUntil: null, paymentDueAt: null },
  serverTime: serverTime(),
};

/**
 * หน้ารายละเอียดประมูลแยกตาม id — ครอบคลุมสถานะใน B2/B3
 * อยากดูมุมอื่นให้แก้ `viewer` ด้วย `withViewer` ด้านล่าง
 */
export const AUCTION_DETAIL_FIXTURES: Record<number, AuctionDetail> = {
  142: CHARIZARD_DETAIL,
  150: {
    ...CHARIZARD_DETAIL,
    id: 150,
    auctionNumber: "AUC-2026-0150",
    item: I.pikachu,
    sellerNote: null,
    startingPrice: 2400,
    bidIncrement: 100,
    currentPrice: 2400,
    minNextBid: 2400,
    bidCount: 0,
    bidderCount: 0,
    buyNowPrice: 3500,
    buyNowAvailable: true,
    originalEndsAt: at(3 * DAY + 4 * HOUR),
    endsAt: at(3 * DAY + 4 * HOUR),
    extensionCount: 0,
    recentBids: [],
    viewer: { state: null, myHighestBid: null, ownAuction: false, blockers: [], bannedUntil: null, paymentDueAt: null },
  },
  151: {
    ...CHARIZARD_DETAIL,
    id: 151,
    auctionNumber: "AUC-2026-0151",
    item: I.umbreon,
    seller: AUCTION_SELLERS.rareCard,
    startingPrice: 5000,
    currentPrice: 15200,
    minNextBid: 15300,
    bidCount: 27,
    bidderCount: 11,
    buyNowPrice: null,
    endsAt: at(102 * SECOND),
    originalEndsAt: at(-6 * MINUTE),
    extensionCount: 4,
    viewer: { state: "OUTBID", myHighestBid: 15000, ownAuction: false, blockers: [], bannedUntil: null, paymentDueAt: null },
  },
  117: {
    ...CHARIZARD_DETAIL,
    id: 117,
    auctionNumber: "AUC-2026-0117",
    status: "AWAITING_PAYMENT",
    item: I.lugia,
    currentPrice: 6100,
    minNextBid: 6100,
    bidCount: 9,
    bidderCount: 4,
    buyNowPrice: null,
    endsAt: at(-6 * HOUR),
    originalEndsAt: at(-6 * HOUR),
    extensionCount: 0,
    viewer: { state: "WON_AWAITING_PAYMENT", myHighestBid: 6100, ownAuction: false, blockers: [], bannedUntil: null, paymentDueAt: at(18 * HOUR) },
    winnerAlias: "n***t",
  },
  133: {
    ...CHARIZARD_DETAIL,
    id: 133,
    auctionNumber: "AUC-2026-0133",
    status: "SOLD",
    item: I.mewtwo,
    currentPrice: 4200,
    minNextBid: 4200,
    bidCount: 18,
    bidderCount: 8,
    buyNowPrice: null,
    endsAt: at(-4 * DAY),
    originalEndsAt: at(-4 * DAY),
    extensionCount: 0,
    viewer: { state: "LOST", myHighestBid: 3900, ownAuction: false, blockers: [], bannedUntil: null, paymentDueAt: null },
  },
  // B4-F ไม่มีผู้บิด
  126: {
    ...CHARIZARD_DETAIL,
    id: 126,
    auctionNumber: "AUC-2026-0126",
    status: "UNSOLD",
    item: I.blastoise,
    sellerNote: null,
    startingPrice: 4500,
    currentPrice: 4500,
    minNextBid: 4500,
    bidCount: 0,
    bidderCount: 0,
    buyNowPrice: null,
    endsAt: at(-5 * DAY),
    originalEndsAt: at(-5 * DAY),
    extensionCount: 0,
    recentBids: [],
    viewer: { state: null, myHighestBid: null, ownAuction: false, blockers: [], bannedUntil: null, paymentDueAt: null },
  },
  // B4-G ถูกระงับ
  98: {
    ...CHARIZARD_DETAIL,
    id: 98,
    auctionNumber: "AUC-2026-0098",
    status: "SUSPENDED",
    item: I.rayquaza,
    seller: AUCTION_SELLERS.rareCard,
    currentPrice: 21500,
    minNextBid: 21500,
    bidCount: 41,
    bidderCount: 9,
    buyNowPrice: null,
    endsAt: at(-6 * DAY),
    originalEndsAt: at(-6 * DAY),
    extensionCount: 0,
    viewer: null,
    suspendReason: "พบรูปแบบบิดผิดปกติ",
  },
};

/** ใส่มุมมองของผู้ใช้ทับ — เช่นดู B3-E: `withViewer(142, { blockers: ["NO_SHIPPING_ADDRESS"] })` */
export function withViewer(id: number, viewer: Partial<NonNullable<AuctionDetail["viewer"]>> | null): AuctionDetail {
  const base = AUCTION_DETAIL_FIXTURES[id] ?? CHARIZARD_DETAIL;
  if (viewer === null) return { ...base, viewer: null };
  const current = base.viewer ?? { state: null, myHighestBid: null, ownAuction: false, blockers: [], bannedUntil: null, paymentDueAt: null };
  return { ...base, viewer: { ...current, ...viewer } };
}

export const BID_HISTORY_FIXTURE: BidHistory = {
  page: { items: CHARIZARD_BIDS, page: 0, size: 20, totalItems: 12, totalPages: 1 },
  serverTime: serverTime(),
};

const MY_AUCTIONS: MyAuction[] = [
  { id: 142, auctionNumber: "AUC-2026-0142", item: I.charizard, shopName: "CardVault BKK", bidCount: 12, state: "WON_AWAITING_PAYMENT", currentPrice: 8450, myHighestBid: 8450, shippingFee: SHIPPING, totalDue: 8500, minNextBid: null, extended: false, endsAt: at(-20 * MINUTE), deadline: at(23 * HOUR + 40 * MINUTE), orderId: null },
  { id: 151, auctionNumber: "AUC-2026-0151", item: I.umbreon, shopName: "RareCard Station", bidCount: 27, state: "LEADING", currentPrice: 15200, myHighestBid: 15200, shippingFee: SHIPPING, totalDue: null, minNextBid: 15300, extended: false, endsAt: at(1 * DAY), deadline: null, orderId: null },
  { id: 139, auctionNumber: "AUC-2026-0139", item: I.rayquaza, shopName: "RareCard Station", bidCount: 41, state: "OUTBID", currentPrice: 21500, myHighestBid: 21000, shippingFee: SHIPPING, totalDue: null, minNextBid: 21600, extended: true, endsAt: at(2 * MINUTE), deadline: null, orderId: null },
  { id: 133, auctionNumber: "AUC-2026-0133", item: I.mewtwo, shopName: "CardVault BKK", bidCount: 18, state: "WON", currentPrice: 4200, myHighestBid: 4200, shippingFee: SHIPPING, totalDue: null, minNextBid: null, extended: false, endsAt: at(-4 * DAY), deadline: null, orderId: 10388 },
  { id: 117, auctionNumber: "AUC-2026-0117", item: I.lugia, shopName: "CardVault BKK", bidCount: 9, state: "LOST", currentPrice: 6100, myHighestBid: 5800, shippingFee: SHIPPING, totalDue: null, minNextBid: null, extended: false, endsAt: at(-4 * DAY), deadline: null, orderId: null },
];

export const MY_AUCTION_PAGE_FIXTURE: MyAuctionPage = {
  page: { items: MY_AUCTIONS, page: 0, size: 20, totalItems: 14, totalPages: 1 },
  tabCounts: { ALL: 14, BIDDING: 3, TO_PAY: 1, WON: 4, LOST: 6 },
  unpaidStrikes: 0,
  strikeLimit: STRIKE_LIMIT,
  bannedUntil: null,
  lastStrikeCardName: null,
  serverTime: serverTime(),
};

/** W1 + B3-H: ไม่ชำระมาแล้ว 1 ครั้ง */
export const MY_AUCTION_PAGE_STRIKE_FIXTURE: MyAuctionPage = {
  ...MY_AUCTION_PAGE_FIXTURE,
  unpaidStrikes: 1,
  lastStrikeCardName: I.charizard.card.productName,
};

/** W1 + B3-H: ครบ 3 ครั้ง ถูกห้ามบิด 30 วัน */
export const MY_AUCTION_PAGE_BANNED_FIXTURE: MyAuctionPage = {
  ...MY_AUCTION_PAGE_FIXTURE,
  unpaidStrikes: 3,
  bannedUntil: at(24 * DAY),
  lastStrikeCardName: I.charizard.card.productName,
};

/** W1 ว่าง (AUC-E1) */
export const MY_AUCTION_PAGE_EMPTY_FIXTURE: MyAuctionPage = {
  ...MY_AUCTION_PAGE_FIXTURE,
  page: { items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 },
  tabCounts: { ALL: 0, BIDDING: 0, TO_PAY: 0, WON: 0, LOST: 0 },
};

// ---------- ผู้ขาย ----------

const SELLER_ROWS: SellerAuctionRow[] = [
  { id: 142, auctionNumber: "AUC-2026-0142", item: I.charizard, unitLabel: "U-0771", startingPrice: 2000, currentPrice: 8450, bidCount: 12, buyNowPrice: 12000, buyNowAvailable: false, status: "LIVE", endsAt: at(102 * SECOND), deadline: null, orderId: null },
  { id: 150, auctionNumber: "AUC-2026-0150", item: I.pikachu, unitLabel: "U-0988", startingPrice: 2400, currentPrice: 2400, bidCount: 0, buyNowPrice: 3500, buyNowAvailable: true, status: "LIVE", endsAt: at(3 * DAY), deadline: null, orderId: null },
  { id: 151, auctionNumber: "AUC-2026-0151", item: I.umbreon, unitLabel: "U-0870", startingPrice: 5000, currentPrice: 15200, bidCount: 27, buyNowPrice: null, buyNowAvailable: false, status: "LIVE", endsAt: at(1 * DAY), deadline: null, orderId: null },
  { id: 155, auctionNumber: "AUC-2026-0155", item: I.gengar, unitLabel: "U-0641", startingPrice: 6000, currentPrice: 8200, bidCount: 5, buyNowPrice: null, buyNowAvailable: false, status: "LIVE", endsAt: at(6 * HOUR), deadline: null, orderId: null },
  { id: 117, auctionNumber: "AUC-2026-0117", item: I.lugia, unitLabel: "U-0912", startingPrice: 3000, currentPrice: 6100, bidCount: 9, buyNowPrice: null, buyNowAvailable: false, status: "AWAITING_PAYMENT", endsAt: at(-6 * HOUR), deadline: at(18 * HOUR + 22 * MINUTE), orderId: 10377 },
  { id: 133, auctionNumber: "AUC-2026-0133", item: I.mewtwo, unitLabel: "U-0533", startingPrice: 500, currentPrice: 4200, bidCount: 18, buyNowPrice: null, buyNowAvailable: false, status: "SOLD", endsAt: at(-4 * DAY), deadline: null, orderId: 10388 },
  { id: 126, auctionNumber: "AUC-2026-0126", item: I.blastoise, unitLabel: "U-0590", startingPrice: 4500, currentPrice: 4500, bidCount: 0, buyNowPrice: null, buyNowAvailable: false, status: "UNSOLD", endsAt: at(-5 * DAY), deadline: null, orderId: null },
  // ผู้ชนะไม่ชำระ → UNSOLD ที่มีบิด ("ไม่มีผู้ชำระ") [TCG-632]
  { id: 121, auctionNumber: "AUC-2026-0121", item: I.espeon, unitLabel: "U-0702", startingPrice: 3000, currentPrice: 5200, bidCount: 6, buyNowPrice: null, buyNowAvailable: false, status: "UNSOLD", endsAt: at(-3 * DAY), deadline: null, orderId: null },
  { id: 140, auctionNumber: "AUC-2026-0140", item: I.charizardEx, unitLabel: "U-1041", startingPrice: 900, currentPrice: 900, bidCount: 0, buyNowPrice: 1500, buyNowAvailable: false, status: "CANCELLED", endsAt: at(-1 * DAY), deadline: null, orderId: null },
];

const STATUS_COUNTS: Record<AuctionStatus, number> = {
  LIVE: 4,
  AWAITING_PAYMENT: 1,
  SOLD: 1,
  UNSOLD: 2,
  CANCELLED: 1,
  SUSPENDED: 0,
};

export const SELLER_AUCTION_PAGE_FIXTURE: SellerAuctionPage = {
  page: { items: SELLER_ROWS, page: 0, size: 20, totalItems: 9, totalPages: 1 },
  statusCounts: STATUS_COUNTS,
  kpis: {
    liveCount: 4,
    liveWithBids: 2,
    awaitingPaymentCount: 1,
    nextPaymentDueAt: at(18 * HOUR),
    soldLast30Days: 24600,
    closedLast30Days: 6,
    closeVsMarketPercent: 12,
  },
  serverTime: serverTime(),
};

export const ELIGIBLE_UNIT_PAGE_FIXTURE: EligibleUnitPage = {
  page: {
    items: [
      { unitUid: "0f9e1c2a-6b1d-4e8a-9a51-2c7d5b3e1042", unitLabel: "U-1042", item: I.charizardEx, unitCost: 720, marketGuide: { listingCount: 12, min: 890, median: 1180, max: 1650 }, availability: "AVAILABLE", heldBy: null },
      { unitUid: "1a7b3c4d-5e6f-4a8b-9c0d-1e2f3a4b1043", unitLabel: "U-1043", item: { ...I.charizardEx, condition: "LP" }, unitCost: 650, marketGuide: { listingCount: 6, min: 820, median: 980, max: 1200 }, availability: "AVAILABLE", heldBy: null },
      { unitUid: "5a0c7e11-2d4f-4b8e-8f36-91c2d7a40988", unitLabel: "U-0988", item: I.pikachu, unitCost: 1690, marketGuide: { listingCount: 8, min: 2100, median: 2450, max: 2900 }, availability: "LISTED", heldBy: null },
      { unitUid: "9b3d2f70-1c6a-4e2b-a7d8-3f5e6c180870", unitLabel: "U-0870", item: I.umbreon, unitCost: null, marketGuide: null, availability: "IN_AUCTION", heldBy: "#AUC-2026-0151" },
      { unitUid: "c41e8a2b-7f90-4d3c-b615-0a9e2d7c0912", unitLabel: "U-0912", item: I.lugia, unitCost: null, marketGuide: null, availability: "RESERVED", heldBy: "#ORD-10377" },
    ],
    page: 0,
    size: 20,
    totalItems: 5,
    totalPages: 1,
  },
  totalInStock: 37,
};

const SELLER_CHARIZARD: SellerAuctionDetail = {
  id: 142,
  auctionNumber: "AUC-2026-0142",
  status: "LIVE",
  item: I.charizard,
  unitLabel: "U-0771",
  startingPrice: 2000,
  bidIncrement: 100,
  currentPrice: 8450,
  bidCount: 12,
  bidderCount: 7,
  watcherCount: 34,
  estimatedPayout: 8027,
  commissionPercent: COMMISSION_PERCENT,
  buyNowPrice: 12000,
  buyNowAvailable: false,
  sellerNote: CHARIZARD_NOTE,
  editable: false,
  cancellable: false,
  startedAt: at(-3 * DAY),
  originalEndsAt: at(1 * DAY),
  endsAt: at(1 * DAY + 4 * HOUR),
  extensionCount: 3,
  firstBidAt: at(-3 * DAY + 40 * MINUTE),
  winnerAlias: null,
  paymentDueAt: null,
  orderId: null,
  // ผู้ขายเห็นบิดแรกสุดด้วย (แถวท้าย "· บิดแรก" ใน S4)
  bids: [
    ...CHARIZARD_BIDS.map((b) => ({ ...b, mine: false })),
    { bidderAlias: "k***e", bidderInitials: "KE", mine: false, amount: 2000, placedAt: at(-3 * DAY + 40 * MINUTE) },
  ],
  serverTime: serverTime(),
};

/** ประมูลที่จบแล้ว — ใช้เป็นฐานของใบ 117 / 133 / 121 / 126 / 140 / 158 */
const SELLER_ENDED: SellerAuctionDetail = {
  ...SELLER_CHARIZARD,
  buyNowPrice: null,
  buyNowAvailable: false,
  sellerNote: null,
  extensionCount: 0,
  watcherCount: 0,
};

function endedBids(amounts: number[], lastAt: number): AuctionBid[] {
  const aliases = ["s***j", "m***a", "t***n", "p***m", "k***e"];
  return amounts.map((amount, index) => {
    const alias = aliases[index % aliases.length];
    return { bidderAlias: alias, bidderInitials: alias.slice(0, 1).toUpperCase() + alias.slice(-1).toUpperCase(), mine: false, amount, placedAt: at(lastAt - index * HOUR) };
  });
}

/** รายละเอียดฝั่งผู้ขายแยกตาม id — S4 ทุกสถานะ (id ตรงกับแถวในตาราง S1) [TCG-634] */
export const SELLER_AUCTION_DETAIL_FIXTURES: Record<number, SellerAuctionDetail> = {
  142: SELLER_CHARIZARD,
  150: {
    ...SELLER_CHARIZARD,
    id: 150,
    auctionNumber: "AUC-2026-0150",
    item: I.pikachu,
    unitLabel: "U-0988",
    startingPrice: 2400,
    currentPrice: 2400,
    bidCount: 0,
    bidderCount: 0,
    watcherCount: 5,
    estimatedPayout: 2280,
    buyNowPrice: 3500,
    buyNowAvailable: true,
    sellerNote: null,
    editable: true,
    cancellable: true,
    originalEndsAt: at(3 * DAY),
    endsAt: at(3 * DAY),
    extensionCount: 0,
    firstBidAt: null,
    bids: [],
  },
  // จบแล้ว รอผู้ชนะชำระ
  117: {
    ...SELLER_ENDED,
    id: 117,
    auctionNumber: "AUC-2026-0117",
    status: "AWAITING_PAYMENT",
    item: I.lugia,
    unitLabel: "U-0912",
    startingPrice: 3000,
    currentPrice: 6100,
    bidCount: 9,
    bidderCount: 4,
    watcherCount: 18,
    estimatedPayout: 5795,
    startedAt: at(-3 * DAY - 6 * HOUR),
    originalEndsAt: at(-6 * HOUR),
    endsAt: at(-6 * HOUR),
    firstBidAt: at(-3 * DAY),
    winnerAlias: "s***j",
    paymentDueAt: at(18 * HOUR + 22 * MINUTE),
    orderId: 10377,
    bids: endedBids([6100, 5800, 5000, 4200, 3000], -6 * HOUR - 5 * MINUTE),
  },
  // ผู้ชนะชำระแล้ว
  133: {
    ...SELLER_ENDED,
    id: 133,
    auctionNumber: "AUC-2026-0133",
    status: "SOLD",
    item: I.mewtwo,
    unitLabel: "U-0533",
    startingPrice: 500,
    currentPrice: 4200,
    bidCount: 18,
    bidderCount: 6,
    watcherCount: 22,
    estimatedPayout: 3990,
    startedAt: at(-7 * DAY),
    originalEndsAt: at(-4 * DAY),
    endsAt: at(-4 * DAY),
    firstBidAt: at(-7 * DAY + 2 * HOUR),
    winnerAlias: "m***a",
    orderId: 10388,
    bids: endedBids([4200, 4000, 3500, 2800, 2000], -4 * DAY - 10 * MINUTE),
  },
  // ผู้ชนะไม่ชำระใน 24 ชม. → UNSOLD การ์ดกลับเข้าสต็อก
  121: {
    ...SELLER_ENDED,
    id: 121,
    auctionNumber: "AUC-2026-0121",
    status: "UNSOLD",
    item: I.espeon,
    unitLabel: "U-0702",
    startingPrice: 3000,
    currentPrice: 5200,
    bidCount: 6,
    bidderCount: 3,
    watcherCount: 11,
    estimatedPayout: 4940,
    startedAt: at(-6 * DAY),
    originalEndsAt: at(-3 * DAY),
    endsAt: at(-3 * DAY),
    firstBidAt: at(-6 * DAY + 3 * HOUR),
    winnerAlias: "k***a",
    bids: endedBids([5200, 4800, 4100, 3600, 3000], -3 * DAY - 15 * MINUTE),
  },
  // หมดเวลาแบบไม่มีผู้บิด
  126: {
    ...SELLER_ENDED,
    id: 126,
    auctionNumber: "AUC-2026-0126",
    status: "UNSOLD",
    item: I.blastoise,
    unitLabel: "U-0590",
    startingPrice: 4500,
    currentPrice: 4500,
    bidCount: 0,
    bidderCount: 0,
    watcherCount: 3,
    estimatedPayout: 4275,
    startedAt: at(-8 * DAY),
    originalEndsAt: at(-5 * DAY),
    endsAt: at(-5 * DAY),
    firstBidAt: null,
    bids: [],
  },
  140: {
    ...SELLER_ENDED,
    id: 140,
    auctionNumber: "AUC-2026-0140",
    status: "CANCELLED",
    item: I.charizardEx,
    unitLabel: "U-1041",
    startingPrice: 900,
    currentPrice: 900,
    bidCount: 0,
    bidderCount: 0,
    estimatedPayout: 855,
    buyNowPrice: 1500,
    startedAt: at(-2 * DAY),
    originalEndsAt: at(-1 * DAY),
    endsAt: at(-1 * DAY),
    firstBidAt: null,
    bids: [],
  },
  // ขายด้วยซื้อทันที (ไม่มีบิด แต่มีผู้ชนะ) รอผู้ซื้อชำระ — ไม่อยู่ในตาราง S1 เปิดจาก URL ตรง ๆ
  158: {
    ...SELLER_ENDED,
    id: 158,
    auctionNumber: "AUC-2026-0158",
    status: "AWAITING_PAYMENT",
    item: I.pikachu,
    unitLabel: "U-0990",
    startingPrice: 2400,
    currentPrice: 3500,
    bidCount: 0,
    bidderCount: 0,
    watcherCount: 7,
    estimatedPayout: 3325,
    buyNowPrice: 3500,
    startedAt: at(-1 * DAY),
    originalEndsAt: at(2 * DAY),
    endsAt: at(-2 * HOUR),
    firstBidAt: null,
    winnerAlias: "p***m",
    paymentDueAt: at(22 * HOUR),
    orderId: 10391,
    bids: [],
  },
};

// ---------- แอดมิน ----------

export const ADMIN_AUCTION_PAGE_FIXTURE: AdminAuctionPage = {
  page: {
    items: [
      { id: 139, auctionNumber: "AUC-2026-0139", cardName: "Rayquaza VMAX Alt Art", shopName: "RareCard Station", sellerUsername: "rarecard_station", currentPrice: 21500, bidCount: 41, bidderCount: 9, status: "LIVE", endsAt: at(2 * MINUTE), deadline: null, signals: ["NEW_ACCOUNT_RAPID_BIDS", "SHARED_ADDRESS_WITH_SELLER"], reportCount: 0, suspendedAt: null },
      { id: 142, auctionNumber: "AUC-2026-0142", cardName: "Charizard VMAX #020", shopName: "CardVault BKK", sellerUsername: "cardvault_bkk", currentPrice: 8450, bidCount: 12, bidderCount: 7, status: "AWAITING_PAYMENT", endsAt: at(-20 * MINUTE), deadline: at(23 * HOUR + 41 * MINUTE), signals: [], reportCount: 0, suspendedAt: null },
      { id: 155, auctionNumber: "AUC-2026-0155", cardName: "Pikachu Illustrator", shopName: "newshop_99", sellerUsername: "newshop_99", currentPrice: 2000, bidCount: 0, bidderCount: 0, status: "LIVE", endsAt: at(2 * DAY), deadline: null, signals: ["REPORTED"], reportCount: 3, suspendedAt: null },
      { id: 151, auctionNumber: "AUC-2026-0151", cardName: "Umbreon VMAX Alt Art", shopName: "RareCard Station", sellerUsername: "rarecard_station", currentPrice: 15200, bidCount: 27, bidderCount: 11, status: "LIVE", endsAt: at(1 * DAY), deadline: null, signals: [], reportCount: 0, suspendedAt: null },
      { id: 98, auctionNumber: "AUC-2026-0098", cardName: "Gengar VMAX Alt Art", shopName: "fakecards_th", sellerUsername: "fakecards_th", currentPrice: 6000, bidCount: 3, bidderCount: 2, status: "SUSPENDED", endsAt: at(-6 * DAY), deadline: null, signals: [], reportCount: 0, suspendedAt: at(-6 * DAY) },
    ],
    page: 0,
    size: 20,
    totalItems: 1204,
    totalPages: 61,
  },
  tabCounts: { ALL: 1204, FLAGGED: 2, LIVE: 128, AWAITING_PAYMENT: 12, ENDED: 1050, SUSPENDED: 2 },
  kpis: { live: 128, endingWithinHour: 14, awaitingPayment: 9, suspendedLast30Days: 2, soldLast30Days: 486200 },
  flaggedCount: 2,
  serverTime: serverTime(),
};

export const ADMIN_AUCTION_DETAIL_FIXTURE: AdminAuctionDetail = {
  id: 139,
  auctionNumber: "AUC-2026-0139",
  status: "LIVE",
  item: I.rayquaza,
  seller: { sellerProfileId: 12, shopName: "RareCard Station", username: "rarecard_station", verified: true, auctionCount: 23, suspensionCount: 0 },
  startingPrice: 5000,
  bidIncrement: 100,
  currentPrice: 21500,
  bidCount: 41,
  bidderCount: 9,
  buyNowPrice: null,
  originalEndsAt: at(-1 * HOUR),
  endsAt: at(2 * MINUTE),
  extensionCount: 7,
  sellerNote: "เก็บใน top loader ตั้งแต่แกะซอง ไม่เคยเล่น · ส่งแบบกล่องแข็ง",
  sellerNoteUpdatedAt: at(-3 * DAY),
  signals: [
    { signal: "NEW_ACCOUNT_RAPID_BIDS", message: "บัญชี tonx_bkk สมัครเมื่อ 2 วันก่อน และบิดในประมูลนี้ 14 ครั้ง (34% ของบิดทั้งหมด)" },
    { signal: "SHARED_ADDRESS_WITH_SELLER", message: "ผู้บิด rayy.collect ใช้ที่อยู่จัดส่งเดียวกับผู้ขาย RareCard Station" },
  ],
  reportCount: 0,
  bids: [
    { bidId: 9001, userId: 301, username: "tonx_bkk", memberSince: at(-2 * DAY), orderCount: 0, amount: 21500, placedAt: at(-19 * SECOND), status: "ACTIVE", signals: ["NEW_ACCOUNT_RAPID_BIDS"] },
    { bidId: 9000, userId: 7, username: "somchai.j", memberSince: at(-365 * DAY), orderCount: 23, amount: 21400, placedAt: at(-58 * SECOND), status: "ACTIVE", signals: [] },
    { bidId: 8999, userId: 301, username: "tonx_bkk", memberSince: at(-2 * DAY), orderCount: 0, amount: 21000, placedAt: at(-110 * SECOND), status: "ACTIVE", signals: ["NEW_ACCOUNT_RAPID_BIDS"] },
    { bidId: 8998, userId: 302, username: "rayy.collect", memberSince: at(-240 * DAY), orderCount: 4, amount: 20500, placedAt: at(-18 * MINUTE), status: "ACTIVE", signals: ["SHARED_ADDRESS_WITH_SELLER"] },
    { bidId: 8997, userId: 303, username: "mina.k", memberSince: at(-730 * DAY), orderCount: 61, amount: 20000, placedAt: at(-48 * MINUTE), status: "ACTIVE", signals: [] },
  ],
  actions: [],
  serverTime: serverTime(),
};

const KANOK: BannedBidder = {
  userId: 401,
  username: "kanok.a",
  maskedEmail: "k***a@gmail.com",
  memberSince: at(-180 * DAY),
  strikeCount: 3,
  strikeLimit: STRIKE_LIMIT,
  bannedUntil: at(29 * DAY),
  liftedAt: null,
  strikes: [
    { auctionId: 121, auctionNumber: "AUC-2026-0121", at: at(-1 * DAY) },
    { auctionId: 102, auctionNumber: "AUC-2026-0102", at: at(-18 * DAY) },
    { auctionId: 90, auctionNumber: "AUC-2026-0090", at: at(-28 * DAY) },
  ],
};

export const BANNED_BIDDER_PAGE_FIXTURE: BannedBidderPage = {
  page: {
    items: [
      KANOK,
      { ...KANOK, userId: 402, username: "bid_master99", maskedEmail: "b***9@hotmail.com", memberSince: at(-30 * DAY), bannedUntil: at(26 * DAY), strikes: [{ auctionId: 114, auctionNumber: "AUC-2026-0114", at: at(-4 * DAY) }] },
      { ...KANOK, userId: 403, username: "pon.tcg", maskedEmail: "p***g@gmail.com", memberSince: at(-730 * DAY), bannedUntil: at(20 * DAY), strikes: [{ auctionId: 103, auctionNumber: "AUC-2026-0103", at: at(-10 * DAY) }] },
      { ...KANOK, userId: 404, username: "newbie_th", maskedEmail: "n***h@yahoo.com", memberSince: at(-14 * DAY), bannedUntil: at(17 * DAY), strikes: [{ auctionId: 99, auctionNumber: "AUC-2026-0099", at: at(-13 * DAY) }] },
      { ...KANOK, userId: 405, username: "collector.b", maskedEmail: "c***b@gmail.com", memberSince: at(-365 * DAY), bannedUntil: at(9 * DAY), strikes: [{ auctionId: 88, auctionNumber: "AUC-2026-0088", at: at(-21 * DAY) }] },
    ],
    page: 0,
    size: 20,
    totalItems: 5,
    totalPages: 1,
  },
  tabCounts: { BANNED: 5, AT_RISK: 12, HISTORY: 41 },
  liftedLast30Days: 1,
  expiredLast30Days: 4,
};
