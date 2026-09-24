import pegasusCampaignTable from "@/assets/home/pegasus-campaign-table.jpeg";

import type {
  CardCondition,
  CategoryDto,
  GameCategory,
  GameDto,
  HeroSlide,
  HomeBannerDto,
  HomeProduct,
  ProductCategory,
  ProductSummaryDto,
  ProductType,
  PublicListingDto,
  TrendingProduct,
  TrendingProductDto,
} from "./home.types";

/** แปลงข้อมูลจาก backend ให้เป็นรูปที่ component หน้าแรกใช้ — ไม่มี React ในไฟล์นี้ */

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  SINGLE_CARD: "Single Card",
  BOOSTER_PACK: "Booster Pack",
  BOOSTER_BOX: "Booster Box",
  ELITE_TRAINER_BOX: "Elite Trainer Box",
  STARTER_DECK: "Starter Deck",
  BUNDLE: "Bundle",
  ACCESSORY: "Accessory",
  OTHER: "Other",
};

const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
  SEALED: "Sealed",
};

const THEMES = {
  CAMPAIGN: "campaign",
  RELEASE: "release",
  COLLECTOR: "collector",
} as const satisfies Record<HomeBannerDto["theme"], HeroSlide["theme"]>;

/** แสดงเมื่อยังไม่มีสไลด์ในระบบ หรือโหลดสไลด์ไม่สำเร็จ หน้าแรกจะได้ไม่เริ่มด้วยช่องว่าง */
export const FALLBACK_HERO_SLIDE: HeroSlide = {
  id: "fallback",
  eyebrow: "NEW FROM PEGASUS",
  title: "FRESH CARDS.\nREADY TO PLAY.",
  description:
    "Discover the newest singles and sealed releases from verified sellers.",
  image: pegasusCampaignTable,
  imageAlt: "การ์ดสะสม Pegasus รุ่นใหม่จัดแสดงบนโต๊ะ",
  theme: "campaign",
  primaryAction: { label: "Shop New Releases", href: "/search?sort=newest" },
  secondaryAction: { label: "Explore Cards", href: "/search" },
};

export function productHref(slug: string): string {
  return `/products/${encodeURIComponent(slug)}`;
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
      banner.primaryLabel && banner.primaryHref
        ? { label: banner.primaryLabel, href: banner.primaryHref }
        : undefined,
    secondaryAction:
      banner.secondaryLabel && banner.secondaryHref
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
    type: PRODUCT_TYPE_LABELS[product.productType] ?? "Other",
    price: product.lowestPrice,
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
    image: listing.primaryPhotoUrl ?? listing.card.officialImageUrl ?? undefined,
    imageAlt: listing.card.productName,
    href: productHref(listing.card.productSlug),
  };
}
