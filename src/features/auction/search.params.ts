import type { GameDto } from "@/features/catalog/catalog.types";

import type { AuctionFilter, AuctionListParams, AuctionSort } from "./auction.types";
import { translate } from "@/lib/i18n";

/**
 * ตัวกรองของหน้ารวมประมูล (B1) อยู่ใน URL ทั้งหมด — แชร์ลิงก์ได้ กด back กลับมาที่เดิม [TCG-628]
 * ทำแบบเดียวกับ `features/catalog/search.params.ts`: เกมเก็บเป็น slug แล้วค่อยแปลงเป็น id ตอนยิง API
 * ไม่มี React ในไฟล์นี้
 */

export const AUCTION_PAGE_SIZE = 20;

/** แท็บแคปซูล — `null` = "ทั้งหมด" */
export const AUCTION_TABS: { value: AuctionFilter | null; label: string }[] = [
  { value: null, get label() {
    return translate("auction", "buyer.searchParams.label", "ทั้งหมด");
  } },
  { value: "ENDING_SOON", get label() {
    return translate("auction", "buyer.searchParams.label2", "ใกล้จบ");
  } },
  { value: "BUY_NOW", get label() {
    return translate("auction", "buyer.searchParams.label3", "ซื้อทันทีได้");
  } },
  { value: "NO_BIDS", get label() {
    return translate("auction", "buyer.searchParams.label4", "ยังไม่มีบิด");
  } },
  { value: "NEW", get label() {
    return translate("auction", "buyer.searchParams.label5", "เพิ่งเปิด");
  } },
];

export const AUCTION_SORTS: { value: AuctionSort; label: string }[] = [
  { value: "ENDING_SOON", get label() {
    return translate("auction", "buyer.searchParams.label6", "เรียง: ใกล้จบก่อน");
  } },
  { value: "NEWEST", get label() {
    return translate("auction", "buyer.searchParams.label7", "เรียง: เพิ่งเปิด");
  } },
  { value: "PRICE_ASC", get label() {
    return translate("auction", "buyer.searchParams.label8", "เรียง: ราคาต่ำ → สูง");
  } },
  { value: "PRICE_DESC", get label() {
    return translate("auction", "buyer.searchParams.label9", "เรียง: ราคาสูง → ต่ำ");
  } },
  { value: "MOST_BIDS", get label() {
    return translate("auction", "buyer.searchParams.label10", "เรียง: บิดมากสุด");
  } },
];

const DEFAULT_SORT: AuctionSort = "ENDING_SOON";

export type AuctionSearchFilters = {
  /** `null` = แท็บ "ทั้งหมด" */
  tab: AuctionFilter | null;
  q: string;
  /** slug ของเกม `null` = ทุกเกม */
  game: string | null;
  sort: AuctionSort;
  /** นับจาก 1 เหมือนที่คนเห็น — API นับจาก 0 */
  page: number;
};

function isTab(value: string | null): value is AuctionFilter {
  return AUCTION_TABS.some((tab) => tab.value !== null && tab.value === value);
}

function isSort(value: string | null): value is AuctionSort {
  return AUCTION_SORTS.some((sort) => sort.value === value);
}

export function readAuctionFilters(params: URLSearchParams): AuctionSearchFilters {
  const tab = params.get("tab");
  const sort = params.get("sort");
  const page = Number(params.get("page"));
  return {
    tab: isTab(tab) ? tab : null,
    q: params.get("q")?.trim() ?? "",
    game: params.get("game") || null,
    sort: isSort(sort) ? sort : DEFAULT_SORT,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** เขียนเฉพาะค่าที่ไม่ใช่ค่าเริ่มต้น URL จะได้สั้น */
export function writeAuctionFilters(filters: AuctionSearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.tab) params.set("tab", filters.tab);
  if (filters.q) params.set("q", filters.q);
  if (filters.game) params.set("game", filters.game);
  if (filters.sort !== DEFAULT_SORT) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

/** มีคำค้น / เกม / แท็บ ที่ไม่ใช่ค่าเริ่มต้น → empty แบบ "กรองแล้วไม่เจอ" */
export function hasActiveAuctionFilters(filters: AuctionSearchFilters): boolean {
  return filters.q !== "" || filters.game !== null || filters.tab !== null;
}

/**
 * แปลงตัวกรองใน URL เป็น query ของ `GET /auctions`
 * `ready` เป็น false ระหว่างรอรายชื่อเกมไปแปลง slug — slug ที่ไม่รู้จักถูกข้ามไป ไม่ทำให้หน้าพัง
 */
export function toAuctionQuery(
  filters: AuctionSearchFilters,
  games: GameDto[] | undefined,
): { query: AuctionListParams; ready: boolean } {
  const ready = filters.game === null || games !== undefined;
  const gameId = games?.find((game) => game.slug === filters.game)?.id;
  return {
    ready,
    query: {
      filter: filters.tab ?? undefined,
      gameId,
      q: filters.q || undefined,
      sort: filters.sort,
      page: filters.page - 1,
      size: AUCTION_PAGE_SIZE,
    },
  };
}

// @tolgee-key {"key": "buyer.searchParams.label", "ns": "auction", "defaultValue": "ทั้งหมด"}
// @tolgee-key {"key": "buyer.searchParams.label2", "ns": "auction", "defaultValue": "ใกล้จบ"}
// @tolgee-key {"key": "buyer.searchParams.label3", "ns": "auction", "defaultValue": "ซื้อทันทีได้"}
// @tolgee-key {"key": "buyer.searchParams.label4", "ns": "auction", "defaultValue": "ยังไม่มีบิด"}
// @tolgee-key {"key": "buyer.searchParams.label5", "ns": "auction", "defaultValue": "เพิ่งเปิด"}
// @tolgee-key {"key": "buyer.searchParams.label6", "ns": "auction", "defaultValue": "เรียง: ใกล้จบก่อน"}
// @tolgee-key {"key": "buyer.searchParams.label7", "ns": "auction", "defaultValue": "เรียง: เพิ่งเปิด"}
// @tolgee-key {"key": "buyer.searchParams.label8", "ns": "auction", "defaultValue": "เรียง: ราคาต่ำ → สูง"}
// @tolgee-key {"key": "buyer.searchParams.label9", "ns": "auction", "defaultValue": "เรียง: ราคาสูง → ต่ำ"}
// @tolgee-key {"key": "buyer.searchParams.label10", "ns": "auction", "defaultValue": "เรียง: บิดมากสุด"}
