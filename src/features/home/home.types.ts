import type {
  ProductSummaryDto,
} from "@/features/catalog/catalog.types";
export type { PublicListingDto } from "@/features/catalog/catalog.types";

export type PublicProfileDto = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

// ---------- สิ่งที่ UI หน้าแรกใช้วาด ----------

export type HeroAction = {
  label: string;
  href: string;
};

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  theme: "campaign" | "release" | "collector";
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
};

export type GameCategory = {
  id: string;
  name: string;
  image?: string;
  imageAlt: string;
  href: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
  href: string;
};

export type HomeProduct = {
  id: string;
  name: string;
  type: string;
  /** null = ตอนนี้ไม่มีใครขาย */
  price: number | null;
  image?: string;
  imageAlt: string;
  href: string;
};

export type TrendingProduct = HomeProduct & {
  rank: number;
};

// ---------- สิ่งที่ backend ส่งมา (ลอกจาก dto/*.java ถ้าฝั่งนั้นแก้ ต้องแก้ตาม) ----------

/** `HomeBannerResponse` — `GET /home/banners` */
export type HomeBannerDto = {
  id: number;
  eyebrow: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  theme: "CAMPAIGN" | "RELEASE" | "COLLECTOR";
  primaryLabel: string | null;
  primaryHref: string | null;
  secondaryLabel: string | null;
  secondaryHref: string | null;
};

/** `TrendingProductResponse` — `GET /catalog/trending` */
export type TrendingProductDto = {
  rank: number;
  unitsSold: number;
  product: ProductSummaryDto;
};
