export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export type GameCategory = {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
};

export type HomeProduct = {
  id: string;
  name: string;
  type: string;
  price: number;
  image: string;
  imageAlt: string;
};

export type TrendingProduct = HomeProduct & {
  rank: number;
};

export type HomeData = {
  heroSlides: HeroSlide[];
  games: GameCategory[];
  recentlyViewed: HomeProduct[];
  trending: TrendingProduct[];
  categories: ProductCategory[];
  pegasusProducts: HomeProduct[];
  exploreMore: HomeProduct[];
};
