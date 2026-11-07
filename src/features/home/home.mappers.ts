import { translate } from "@/lib/language";
import pegasusCampaignTable from "@/assets/home/pegasus-campaign-table.jpeg";
import {
  CONDITION_LABELS,
  PRODUCT_TYPE_LABELS,
  productHref,
} from "@/features/catalog/catalog.mappers";
import type {
  CategoryDto,
  GameDto,
  ProductSummaryDto,
} from "@/features/catalog/catalog.types";

import type {
  GameCategory,
  HeroSlide,
  HomeBannerDto,
  HomeProduct,
  ProductCategory,
  PublicListingDto,
  TrendingProduct,
  TrendingProductDto,
} from "./home.types";

/** แปลงข้อมูลจาก backend ให้เป็นรูปที่ component หน้าแรกใช้ — ไม่มี React ในไฟล์นี้ */

const THEMES = {
  CAMPAIGN: "campaign",
  RELEASE: "release",
  COLLECTOR: "collector",
} as const satisfies Record<HomeBannerDto["theme"], HeroSlide["theme"]>;

/** แสดงเมื่อยังไม่มีสไลด์ในระบบ หรือโหลดสไลด์ไม่สำเร็จ หน้าแรกจะได้ไม่เริ่มด้วยช่องว่าง */
export const FALLBACK_HERO_SLIDE: HeroSlide = {
  id: "fallback",
  get eyebrow() { return translate("ใหม่จาก PEGASUS", "NEW FROM PEGASUS"); },
  get title() { return translate("การ์ดใหม่ พร้อมเล่น", "FRESH CARDS.\nREADY TO PLAY."); },
  get description() { return translate("ค้นพบการ์ดเดี่ยวและสินค้าซีลออกใหม่จากผู้ขายที่ยืนยันแล้ว", "Discover the newest singles and sealed releases from verified sellers."); },
  image: pegasusCampaignTable,
  get imageAlt() { return translate("การ์ดสะสม Pegasus รุ่นใหม่จัดแสดงบนโต๊ะ", "New Pegasus collectible cards displayed on a table"); },
  theme: "campaign",
  get primaryAction() { return { label: translate("เลือกซื้อสินค้าใหม่", "Shop New Releases"), href: "/search?sort=newest" }; },
  get secondaryAction() { return { label: translate("สำรวจการ์ด", "Explore Cards"), href: "/search" }; },
};

/**
 * ปุ่มบนสไลด์พาไปได้แค่หน้าในเว็บนี้ — `//host` กับ `/\\host` เบราว์เซอร์อ่านเป็นเว็บอื่น
 * จึงไม่นับ (backend มี CHECK แบบเดียวกันที่ `home_banner`)
 */
export function isSitePath(href: string | null): href is string {
  return href !== null && /^\/($|[^/\\])/.test(href);
}

export function toHeroSlide(banner: HomeBannerDto): HeroSlide | null {
  // สไลด์ที่ไม่มีรูปวาดไม่ได้ — ข้ามไปดีกว่าโชว์กรอบว่าง
  if (!banner.imageUrl) {
    return null;
  }
  return {
    id: String(banner.id),
    eyebrow: banner.eyebrow ?? "",
    title: banner.title,
    description: banner.description ?? "",
    image: banner.imageUrl,
    imageAlt: banner.imageAlt ?? banner.title.replace(/\n/g, " "),
    theme: THEMES[banner.theme] ?? "campaign",
    primaryAction:
      banner.primaryLabel && isSitePath(banner.primaryHref)
        ? { label: banner.primaryLabel, href: banner.primaryHref }
        : undefined,
    secondaryAction:
      banner.secondaryLabel && isSitePath(banner.secondaryHref)
        ? { label: banner.secondaryLabel, href: banner.secondaryHref }
        : undefined,
  };
}

export function toGameCategory(game: GameDto): GameCategory {
  return {
    id: String(game.id),
    name: game.name,
    image: game.logoUrl ?? undefined,
    imageAlt: game.name,
    href: `/search?game=${encodeURIComponent(game.slug)}`,
  };
}

/** เฉพาะหมวดที่มีรูป — หมวดไม่มีรูปอย่าง "Other" ไม่ขึ้นเป็นการ์ดเด่น */
export function toFeaturedCategories(
  categories: CategoryDto[],
): ProductCategory[] {
  return categories.flatMap((category) =>
    category.imageUrl
      ? [
          {
            id: String(category.id),
            name: category.name,
            image: category.imageUrl,
            imageAlt: category.name,
            href: `/search?category=${encodeURIComponent(category.slug)}`,
          },
        ]
      : [],
  );
}

export function toHomeProduct(product: ProductSummaryDto): HomeProduct {
  return {
    id: String(product.id),
    name: product.name,
    type: PRODUCT_TYPE_LABELS[product.productType] ?? translate("อื่นๆ", "Other"),
    price: product.lowestPrice,
    pricing: product.pricing ?? null,
    image: product.primaryImageUrl ?? undefined,
    imageAlt: product.name,
    href: productHref(product.slug),
  };
}

export function toTrendingProduct(entry: TrendingProductDto): TrendingProduct {
  return { ...toHomeProduct(entry.product), rank: entry.rank };
}

/** listing หนึ่งรายการเป็นการ์ดหนึ่งใบ — รูปถ่ายของผู้ขายมาก่อน ไม่มีค่อยใช้รูปทางการ */
export function listingToHomeProduct(listing: PublicListingDto): HomeProduct {
  return {
    id: `listing-${listing.id}`,
    name: listing.card.productName,
    type: CONDITION_LABELS[listing.condition] ?? listing.condition,
    price: listing.price,
    pricing: listing.pricing ?? null,
    image: listing.primaryPhotoUrl ?? listing.card.officialImageUrl ?? undefined,
    imageAlt: listing.card.productName,
    href: productHref(listing.card.productSlug),
  };
}
