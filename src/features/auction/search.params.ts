import { translate } from "@/lib/language";
import type { GameDto } from "@/features/catalog/catalog.types";

import type { AuctionFilter, AuctionListParams, AuctionSort } from "./auction.types";

/**
 * ตัวกรองของหน้ารวมประมูล (B1) อยู่ใน URL ทั้งหมด — แชร์ลิงก์ได้ กด back กลับมาที่เดิม [TCG-628]
 * ทำแบบเดียวกับ `features/catalog/search.params.ts`: เกมเก็บเป็น slug แล้วค่อยแปลงเป็น id ตอนยิง API
 * ไม่มี React ในไฟล์นี้
 */

export const AUCTION_PAGE_SIZE = 20;

/** แท็บแคปซูล — `null` = "ทั้งหมด" */
export const AUCTION_TABS: { value: AuctionFilter | null; label: string }[] = [
  { value: null, get label() { return translate("ทั้งหมด", "All"); } },
  { value: "ENDING_SOON", get label() { return translate("ใกล้จบ", "Ending soon"); } },
  { value: "BUY_NOW", get label() { return translate("ซื้อทันทีได้", "Buy now available"); } },
  { value: "NO_BIDS", get label() { return translate("ยังไม่มีบิด", "No bids yet"); } },
  { value: "NEW", get label() { return translate("เพิ่งเปิด", "Recently opened"); } },
];

export const AUCTION_SORTS: { value: AuctionSort; label: string }[] = [
  { value: "ENDING_SOON", get label() { return translate("เรียง: ใกล้จบก่อน", "Sort: Ending soon"); } },
  { value: "NEWEST", get label() { return translate("เรียง: เพิ่งเปิด", "Sort: Newest"); } },
  { value: "PRICE_ASC", get label() { return translate("เรียง: ราคาต่ำ → สูง", "Sort: Price low → high"); } },
  { value: "PRICE_DESC", get label() { return translate("เรียง: ราคาสูง → ต่ำ", "Sort: Price high → low"); } },
  { value: "MOST_BIDS", get label() { return translate("เรียง: บิดมากสุด", "Sort: Most bids"); } },
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
