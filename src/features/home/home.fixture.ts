import arcaneDeckBox from "@/assets/home/arcane-deck-box.jpg";
import aurasphereMouse from "@/assets/home/aurasphere-mouse.jpg";
import celestialGuardianBox from "@/assets/home/celestial-guardian-box.jpg";
import galacticGuardiansBox from "@/assets/home/galactic-guardians-box.jpg";
import megaEvolutionPitchBlack from "@/assets/home/mega-evolution-pitch-black.jpg";
import pegasusCollectorBox from "@/assets/home/pegasus-collector-box.jpg";
import type { HomeData, HomeProduct } from "@/features/home/home.types";

const products = {
  pitchBlack: {
    id: "mega-evolution-pitch-black-booster-box",
    name: "Mega Evolution Pitch Black Booster Box [ENG]",
    type: "Sealed",
    price: 2450,
    image: megaEvolutionPitchBlack,
    imageAlt: "การ์ดสะสม Mega Evolution Pitch Black บนโต๊ะจัดแสดง",
  },
  arcane: {
    id: "charizard-ex-sar",
    name: "Charizard ex SAR [M2a 223/193]",
    type: "Single Card",
    price: 828,
    image: arcaneDeckBox,
    imageAlt: "กล่องการ์ดลาย Legends of the Arcane",
  },
  aurasphere: {
    id: "luffy-gear-5",
    name: "Luffy Gear 5",
    type: "Single Card",
    price: 3450,
    image: aurasphereMouse,
    imageAlt: "กล่อง Aurasphere สีดำลายสีน้ำเงิน",
  },
  galactic: {
    id: "pikachu-ar",
    name: "Pikachu AR",
    type: "Single Card",
    price: 2790,
    image: galacticGuardiansBox,
    imageAlt: "กล่อง Galactic Guardians",
  },
  celestial: {
    id: "blue-eyes-white-dragon",
    name: "Blue-Eyes White Dragon",
    type: "Single Card",
    price: 5990,
    image: celestialGuardianBox,
    imageAlt: "กล่อง Celestial Guardian",
  },
  pegasus: {
    id: "pokemon-151-booster",
    name: "Pokémon 151 Booster",
    type: "Booster Box",
    price: 1890,
    image: pegasusCollectorBox,
    imageAlt: "กล่องสะสม Pegasus สีดำ",
  },
} satisfies Record<string, HomeProduct>;

export const HOME_FIGMA_FIXTURE: HomeData = {
  heroSlides: [
    {
      id: "mega-evolution",
      eyebrow: "NEW RELEASE",
      title: "Mega Evolution is here",
      description: "ค้นหาการ์ดใหม่และสินค้ายอดนิยมจากร้านค้าที่คัดสรร",
      image: aurasphereMouse,
      imageAlt: "สินค้า Mega Evolution รุ่นใหม่",
    },
    {
      id: "singles-collection",
      eyebrow: "SPOTLIGHT",
      title: "Singles collection",
      description: "เลือกการ์ดใบที่ใช่ พร้อมข้อมูลประกอบชัดเจน",
      image: galacticGuardiansBox,
      imageAlt: "คอลเลกชันการ์ดแยกใบ",
    },
    {
      id: "sealed-accessories",
      eyebrow: "PEGASUS",
      title: "Sealed & accessories",
      description: "กล่องซีลและอุปกรณ์สำหรับนักสะสม",
      image: arcaneDeckBox,
      imageAlt: "กล่องซีลและอุปกรณ์สะสม",
    },
  ],
  games: [
    { id: "pokemon", name: "Pokémon TCG", image: arcaneDeckBox, imageAlt: "Pokémon TCG" },
    { id: "one-piece", name: "ONE PIECE", image: aurasphereMouse, imageAlt: "ONE PIECE Card Game" },
    { id: "magic", name: "Magic: The Gathering", image: galacticGuardiansBox, imageAlt: "Magic: The Gathering" },
    { id: "yugioh", name: "Yu-Gi-Oh!", image: celestialGuardianBox, imageAlt: "Yu-Gi-Oh!" },
    { id: "digimon", name: "Digimon Card Game", image: pegasusCollectorBox, imageAlt: "Digimon Card Game" },
    { id: "weiss", name: "Weiss Schwarz", image: arcaneDeckBox, imageAlt: "Weiss Schwarz" },
    { id: "union-arena", name: "Union Arena", image: aurasphereMouse, imageAlt: "Union Arena" },
    { id: "shadowverse", name: "Shadowverse Evolve", image: galacticGuardiansBox, imageAlt: "Shadowverse Evolve" },
  ],
  recentlyViewed: [
    products.pitchBlack,
    products.aurasphere,
    products.galactic,
    products.celestial,
    { ...products.celestial, id: "blue-eyes-white-dragon-2" },
  ],
  trending: [
    { ...products.pegasus, rank: 1 },
    { ...products.aurasphere, id: "one-piece-op-09", name: "ONE PIECE OP-09", type: "Booster Box", price: 1150, rank: 2 },
    { ...products.celestial, id: "mega-evolution-box", name: "MEGA Evolution Box", type: "Booster Box", price: 2590, rank: 3 },
    { ...products.galactic, id: "pikachu-promo", name: "Pikachu Promo Card", type: "Booster Box", price: 1990, rank: 4 },
    { ...products.galactic, id: "pikachu-promo-2", name: "Pikachu Promo Card", type: "Booster Box", price: 1990, rank: 5 },
  ],
  categories: [
    { id: "single-card", name: "Singles Cards", image: arcaneDeckBox, imageAlt: "การ์ดแยกใบ" },
    { id: "boosters", name: "Boosters", image: aurasphereMouse, imageAlt: "ซองบูสเตอร์" },
    { id: "booster-boxes", name: "Booster Boxes", image: celestialGuardianBox, imageAlt: "กล่องบูสเตอร์" },
    { id: "sealed", name: "Sealed Products", image: pegasusCollectorBox, imageAlt: "สินค้าซีล" },
    { id: "accessories", name: "Accessories", image: arcaneDeckBox, imageAlt: "อุปกรณ์การ์ด" },
  ],
  pegasusProducts: [
    { ...products.celestial, id: "mega-evolution-booster-box", name: "MEGA Evolution Booster Box", type: "Booster Box", price: 4290 },
    { ...products.arcane, id: "pegasus-perfect-fit-sleeves", name: "Pegasus Perfect Fit Sleeves", type: "Accessories", price: 280 },
    { ...products.aurasphere, id: "one-piece-premium-set", name: "ONE PIECE OP-09 Premium Set", type: "Sealed Product", price: 1990 },
    { ...products.pegasus, id: "pokemon-151-collector-bundle", name: "Pokémon 151 Collector Bundle", type: "Sealed Product", price: 2490 },
    { ...products.pegasus, id: "pokemon-151-collector-bundle-2", name: "Pokémon 151 Collector Bundle", type: "Sealed Product", price: 2490 },
  ],
  exploreMore: [
    { ...products.celestial, id: "explore-mega-evolution", name: "MEGA Evolution Booster Box", type: "Booster Box", price: 4290 },
    { ...products.arcane, id: "explore-charizard", name: "Charizard ex SAR", price: 4200 },
    { ...products.aurasphere, id: "explore-one-piece", name: "ONE PIECE OP-09", type: "Sealed Product", price: 1150 },
    { ...products.galactic, id: "explore-pikachu", name: "Pikachu AR", price: 2790 },
    { ...products.pegasus, id: "battle-of-talingchan", name: "Battle of Talingchan Deck", type: "Deck", price: 290 },
    { ...products.galactic, id: "mew-vmax", name: "Mew VMAX", price: 6250 },
    { ...products.arcane, id: "darkrai-ex", name: "Darkrai ex", price: 4780 },
    { ...products.aurasphere, id: "union-arena-booster", name: "UNION ARENA Booster", type: "Booster Pack", price: 980 },
    { ...products.celestial, id: "pegasus-card-sleeves", name: "Pegasus Card Sleeves", type: "Accessories", price: 280 },
    { ...products.pegasus, id: "pokemon-151-collector-box", name: "Pokémon 151 Collector Box", type: "Booster Box", price: 2490 },
  ],
};
