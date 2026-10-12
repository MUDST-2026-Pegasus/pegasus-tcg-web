import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as listingFormApi from "./listing-form.api";
import { marketSnapshotFrom } from "./listing-form.format";
import type {
  CreateListingPayload,
  ListingDetailsPayload,
  NewUnitsPayload,
} from "./listing-form.types";
import * as productsApi from "./products.api";
import { listingKeys } from "./products.queries";
import type {
  CardCondition,
  ListingPricePayload,
  SellerListing,
} from "./products.types";

export const listingFormKeys = {
  all: ["listing-form"] as const,
  search: (q: string) => [...listingFormKeys.all, "search", q] as const,
  product: (productId: number) =>
    [...listingFormKeys.all, "product", productId] as const,
  code: (code: string) => [...listingFormKeys.all, "code", code] as const,
  market: (variantId: number, condition: CardCondition) =>
    [...listingFormKeys.all, "market", variantId, condition] as const,
};

/** พิมพ์อย่างน้อยเท่านี้ถึงค้น — ตัวเดียวได้ผลกว้างเกินจะช่วยอะไร */
export const MIN_SEARCH_LENGTH = 2;
const SEARCH_SIZE = 8;

/** ค้นการ์ดในแคตตาล็อก — ระหว่างพิมพ์ยังโชว์ผลเดิม ภาพไม่กระพริบ */
export function useCatalogSearch(q: string) {
  const text = q.trim();
  return useQuery({
    queryKey: listingFormKeys.search(text),
    queryFn: () => listingFormApi.searchCatalog(text, SEARCH_SIZE),
    enabled: text.length >= MIN_SEARCH_LENGTH,
    placeholderData: keepPreviousData,
  });
}

/** การ์ดหนึ่งใบพร้อมพิมพ์ทุกแบบ — เปิดเมื่อผู้ขายกดการ์ดในผลค้น */
export function useCatalogProduct(productId: number | null) {
  return useQuery({
    queryKey: listingFormKeys.product(productId ?? 0),
    queryFn: () => listingFormApi.getCatalogProduct(productId as number),
    enabled: productId !== null,
  });
}

/**
 * SKU / บาร์โค้ด → พิมพ์ที่ตรงกัน ยิงเมื่อผู้ขายกดค้น (`code` ไม่เป็น `null`)
 * ไม่เจอ = `VARIANT_NOT_FOUND` (4xx ไม่ลองซ้ำอยู่แล้ว)
 */
export function useVariantLookup(code: string | null) {
  return useQuery({
    queryKey: listingFormKeys.code(code ?? ""),
    queryFn: () => listingFormApi.findVariantByCode(code as string),
    enabled: code !== null && code.trim() !== "",
  });
}

/**
 * ช่วงราคาของประกาศที่เปิดขายอยู่ — ชุดเดียวกับที่งานราคาอัตโนมัติใช้คิดค่ากลาง
 * `data === null` = ยังไม่มีใครขายการ์ดพิมพ์นี้ในสภาพนี้
 */
export function useMarketSnapshot(
  variantId: number | null,
  condition: CardCondition | null,
) {
  return useQuery({
    queryKey: listingFormKeys.market(variantId ?? 0, condition ?? "NM"),
    queryFn: () =>
      listingFormApi.getMarketListings(
        variantId as number,
        condition as CardCondition,
      ),
    select: marketSnapshotFrom,
    enabled: variantId !== null && condition !== null,
    staleTime: 60_000,
  });
}

/** ขั้นที่พลาดหลังสร้างประกาศสำเร็จแล้ว — ประกาศมีอยู่จริงเป็นฉบับร่าง ผู้ขายแก้ต่อได้ */
export type ListingCreateStep = "units" | "publish";

/**
 * สร้างประกาศได้แล้ว แต่ใส่การ์ดหรือเปิดขายไม่ผ่าน — ไม่ลบทิ้ง (ผู้ขายกรอกมาครบแล้ว)
 * หน้าจอพาไปหน้าแก้ไขของประกาศนั้นพร้อมบอกว่าค้างตรงไหน
 */
export class ListingPartiallyCreatedError extends Error {
  readonly listing: SellerListing;
  readonly step: ListingCreateStep;
  readonly cause: unknown;

  constructor(listing: SellerListing, step: ListingCreateStep, cause: unknown) {
    super(`Listing ${listing.id} was created but the ${step} step failed`);
    this.name = "ListingPartiallyCreatedError";
    this.listing = listing;
    this.step = step;
    this.cause = cause;
  }
}

export type CreateListingInput = {
  listing: CreateListingPayload;
  units: NewUnitsPayload;
  /** false = เก็บเป็นฉบับร่าง (มีการ์ดแล้วแต่ยังไม่เปิดให้ผู้ซื้อเห็น) */
  publish: boolean;
};

/**
 * ลงขายหนึ่งประกาศ = สามคำขอต่อกัน เพราะ backend แยกไว้แบบนั้นโดยตั้งใจ
 * 1. `POST /sellers/me/listings` → DRAFT ไม่มีการ์ด
 * 2. `POST .../{id}/units` → การ์ดแต่ละใบเข้าคลังพร้อมต้นทุน
 * 3. `PATCH .../{id}/status` ACTIVE (เฉพาะตอนกดลงขาย) — การ์ดหมดพอดีจะได้ SOLD_OUT แทน
 * ขั้น 1 พลาด = ไม่มีอะไรถูกสร้าง ขั้น 2–3 พลาด = `ListingPartiallyCreatedError`
 */
export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listing,
      units,
      publish,
    }: CreateListingInput): Promise<SellerListing> => {
      const created = await listingFormApi.createListing(listing);

      try {
        await listingFormApi.addListingUnits(created.id, units);
      } catch (error) {
        throw new ListingPartiallyCreatedError(created, "units", error);
      }

      if (!publish) {
        return productsApi.getMyListing(created.id).catch(() => created);
      }
      try {
        return await productsApi.changeListingStatus(created.id, "ACTIVE");
      } catch (error) {
        throw new ListingPartiallyCreatedError(created, "publish", error);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() }),
  });
}

export type UpdateListingInput = {
  /** `null` = รายละเอียด/รูปไม่เปลี่ยน ไม่ต้องยิง PUT */
  details: ListingDetailsPayload | null;
  /** `null` = ราคาไม่เปลี่ยน ไม่ต้องยิง PATCH (ประวัติราคาจะได้ไม่มีแถวว่าง ๆ) */
  price: ListingPricePayload | null;
};

/**
 * บันทึกหน้าแก้ไข — รายละเอียดกับราคาเป็นคนละ endpoint (`ListingDetailsRequest` บอกเหตุผล:
 * เปลี่ยนราคาต้องลงประวัติ เปลี่ยนคำอธิบายไม่ต้อง) ยิงต่อกันแล้วคืนประกาศล่าสุด
 */
export function useUpdateListing(listingId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      details,
      price,
    }: UpdateListingInput): Promise<SellerListing | null> => {
      let latest: SellerListing | null = null;
      if (details) {
        latest = await listingFormApi.updateListingDetails(listingId, details);
      }
      if (price) {
        latest = await productsApi.changeListingPrice(listingId, price);
      }
      return latest;
    },
    onSuccess: (latest) => {
      if (latest) {
        queryClient.setQueryData(listingKeys.detail(listingId), latest);
      }
    },
    // ยิงไปบางส่วนแล้วพลาดก็ต้องดึงใหม่ ไม่งั้นฟอร์มเห็นของเก่าครึ่งหนึ่ง
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: listingKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: listingKeys.detail(listingId),
        }),
      ]),
  });
}
