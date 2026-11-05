import type { PublicListingDto } from "@/features/catalog/catalog.types";
import { api, type PageResponse } from "@/lib/api";

import type { FeaturedSales, PublicSale, SaleDetail, SaleListingQuery } from "./sale.types";

/** public ทั้งหมด — guest เปิดได้ ไม่แนบ token ที่หมดอายุ */
const PUBLIC = { auth: false } as const;

/** แคมเปญ ACTIVE + Flash ที่เริ่มใน 24 ชม. — แท็บหน้า SALE และเมนู SALE บน Navbar */
export function getSales(): Promise<PublicSale[]> {
  return api.get<PublicSale[]>("/sales", PUBLIC);
}

/** แถบ Flash Sale + แบนเนอร์บนหน้าแรก */
export function getFeaturedSales(): Promise<FeaturedSales> {
  return api.get<FeaturedSales>("/sales/featured", PUBLIC);
}

/** หัวแคมเปญ + listing แบ่งหน้า · แคมเปญจบแล้วคืน `status: ENDED` */
export function getSaleDetail(slug: string, query: SaleListingQuery): Promise<SaleDetail> {
  return api.get<SaleDetail>(`/sales/${encodeURIComponent(slug)}`, { ...PUBLIC, query });
}

/** `/sale` (ทุกอย่างที่ลด) — ตลาด `GET /listings?onSale=true` */
export function searchOnSale(query: SaleListingQuery): Promise<PageResponse<PublicListingDto>> {
  return api.get<PageResponse<PublicListingDto>>("/listings", { ...PUBLIC, query: { ...query, onSale: true } });
}
