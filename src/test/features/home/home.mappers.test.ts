import { describe, it, expect } from "vitest";
import {
  isSitePath,
  toHeroSlide,
  toGameCategory,
  toFeaturedCategories,
  toHomeProduct,
  toTrendingProduct,
  listingToHomeProduct,
  FALLBACK_HERO_SLIDE,
} from "@/features/home/home.mappers";
import type {
  HomeBannerDto,
  TrendingProductDto,
  PublicListingDto,
} from "@/features/home/home.types";
import type {
  GameDto,
  CategoryDto,
  ProductSummaryDto,
} from "@/features/catalog/catalog.types";

describe("Home Mappers", () => {
  describe("isSitePath", () => {
    it("returns true for valid local site paths", () => {
      expect(isSitePath("/")).toBe(true);
      expect(isSitePath("/search")).toBe(true);
      expect(isSitePath("/catalog/cards")).toBe(true);
    });

    it("returns false for null, external URLs, or protocol-relative paths", () => {
      expect(isSitePath(null)).toBe(false);
      expect(isSitePath("https://external.com")).toBe(false);
      expect(isSitePath("//evil.com")).toBe(false);
      expect(isSitePath("/\\evil.com")).toBe(false);
      expect(isSitePath("javascript:alert(1)")).toBe(false);
    });
  });

  describe("toHeroSlide", () => {
    it("returns null when banner has no imageUrl", () => {
      const banner: HomeBannerDto = {
        id: 1,
        title: "No Image Banner",
        eyebrow: null,
        description: null,
        imageUrl: null,
        imageAlt: null,
        theme: "CAMPAIGN",
        primaryLabel: "Shop",
        primaryHref: "/shop",
        secondaryLabel: null,
        secondaryHref: null,
      };

      expect(toHeroSlide(banner)).toBeNull();
    });

    it("maps banner to HeroSlide with safe local action paths", () => {
      const banner: HomeBannerDto = {
        id: 10,
        title: "Special Release\nNew Cards",
        eyebrow: "Limited Time",
        description: "Get them before they are gone",
        imageUrl: "https://example.com/banner.jpg",
        imageAlt: null,
        theme: "RELEASE",
        primaryLabel: "Shop Now",
        primaryHref: "/search?sort=newest",
        secondaryLabel: "External Link",
        secondaryHref: "https://google.com",
      };

      const slide = toHeroSlide(banner);
      expect(slide).not.toBeNull();
      expect(slide?.id).toBe("10");
      expect(slide?.title).toBe("Special Release\nNew Cards");
      expect(slide?.imageAlt).toBe("Special Release New Cards");
      expect(slide?.theme).toBe("release");
      expect(slide?.primaryAction).toEqual({
        label: "Shop Now",
        href: "/search?sort=newest",
      });
      // External link is discarded
      expect(slide?.secondaryAction).toBeUndefined();
    });
  });

  describe("toGameCategory", () => {
    it("maps GameDto to GameCategory with encoded slug href", () => {
      const game: GameDto = {
        id: 1,
        code: "YGO",
        name: "Yu-Gi-Oh!",
        nameLocal: "ยูกิโอ",
        slug: "yu-gi-oh",
        logoUrl: "https://example.com/logo.png",
        displayOrder: 1,
      };

      const result = toGameCategory(game);
      expect(result).toEqual({
        id: "1",
        name: "Yu-Gi-Oh!",
        image: "https://example.com/logo.png",
        imageAlt: "Yu-Gi-Oh!",
        href: "/search?game=yu-gi-oh",
      });
    });
  });

  describe("toFeaturedCategories", () => {
    it("filters out categories without imageUrl", () => {
      const categories: CategoryDto[] = [
        {
          id: 1,
          gameId: 1,
          parentId: null,
          code: "BOOSTER",
          name: "Booster Boxes",
          slug: "booster-boxes",
          displayOrder: 1,
          imageUrl: "https://example.com/booster.png",
        },
        {
          id: 2,
          gameId: 1,
          parentId: null,
          code: "OTHER",
          name: "Other Items",
          slug: "other",
          displayOrder: 2,
          imageUrl: null,
        },
      ];

      const result = toFeaturedCategories(categories);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Booster Boxes");
      expect(result[0].href).toBe("/search?category=booster-boxes");
    });
  });

  describe("toHomeProduct and toTrendingProduct", () => {
    const product: ProductSummaryDto = {
      id: 55,
      name: "Dark Magician Girl",
      slug: "dark-magician-girl",
      nameLocal: null,
      gameId: 1,
      categoryId: 1,
      cardSetId: 1,
      productType: "SINGLE_CARD",
      cardNumber: "MFC-000",
      rarityCode: "SCR",
      primaryImageUrl: "https://example.com/dmg.jpg",
      variantCount: 1,
      lowestPrice: 2500,
      listingCount: 5,
    };

    it("maps ProductSummaryDto to HomeProduct", () => {
      const result = toHomeProduct(product);
      expect(result.id).toBe("55");
      expect(result.name).toBe("Dark Magician Girl");
      expect(result.type).toBe("Single Card");
      expect(result.price).toBe(2500);
      expect(result.href).toBe("/products/dark-magician-girl");
    });

    it("maps TrendingProductDto with rank", () => {
      const trending: TrendingProductDto = {
        rank: 1,
        unitsSold: 10,
        product,
      };

      const result = toTrendingProduct(trending);
      expect(result.rank).toBe(1);
      expect(result.name).toBe("Dark Magician Girl");
    });
  });

  describe("listingToHomeProduct", () => {
    it("prioritizes primaryPhotoUrl over officialImageUrl", () => {
      const listing: PublicListingDto = {
        id: 99,
        condition: "NM",
        price: 500,
        currency: "THB",
        quantityAvailable: 1,
        primaryPhotoUrl: "https://example.com/seller-photo.jpg",
        seller: {
          username: "kaiba",
          displayName: "Seto Kaiba",
          avatarUrl: null,
          verified: false,
          ratingAvg: null,
          ratingCount: 0,
          salesCount: 0,
        },
        delivery: { fastestEstDaysMin: null, fastestEstDaysMax: null, freeShipping: false, optionCount: 0 },
        card: {
          variantId: 1,
          sku: "LOB-001",
          variantLabel: "Ultra Rare",
          productId: 1,
          productName: "Blue-Eyes",
          productSlug: "blue-eyes",
          gameId: 1,
          officialImageUrl: "https://example.com/official.jpg",
        },
      };

      const result = listingToHomeProduct(listing);
      expect(result.id).toBe("listing-99");
      expect(result.image).toBe("https://example.com/seller-photo.jpg");
      expect(result.type).toBe("Near Mint");
    });
  });

  describe("FALLBACK_HERO_SLIDE", () => {
    it("has valid required fallback properties", () => {
      expect(FALLBACK_HERO_SLIDE.id).toBe("fallback");
      expect(FALLBACK_HERO_SLIDE.primaryAction?.href).toBe("/search?sort=newest");
    });
  });
});
