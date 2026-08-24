import type { AdminCatalogData } from "@/features/admin/admin.types";

/**
 * ข้อมูลตัวอย่างของหน้า "จัดการแคตตาล็อก" — ข้อความและตัวเลขลอกจาก
 * Figma node 710:3989 เพื่อให้เทียบหน้าจอกับดีไซน์ได้ตรง ๆ
 * เมื่อต่อ API จริงแล้วให้แทนที่ทั้งก้อนนี้
 */
export const ADMIN_CATALOG_FIXTURE: AdminCatalogData = {
  title: "จัดการแคตตาล็อก",
  subtitle:
    "ฐานข้อมูลการ์ดกลางของแพลตฟอร์ม · ผู้ขายเลือกการ์ดจากที่นี่เพื่อลงขาย",

  games: {
    title: "เกมทั้งหมด",
    description: "5 เกมที่เปิดใช้งาน",
    activeId: "pokemon",
    items: [
      { id: "pokemon", name: "Pokémon", count: "8,420" },
      { id: "one-piece", name: "One Piece", count: "4,190" },
      { id: "mtg", name: "Magic: The Gathering", count: "3,510" },
      { id: "yugioh", name: "Yu-Gi-Oh!", count: "2,180" },
      { id: "sports", name: "Sports Cards", count: "640" },
    ],
  },

  sets: {
    title: "กรองตามชุด (Set)",
    items: [
      { id: "obsidian-flames", name: "Obsidian Flames", defaultChecked: true },
      { id: "paldea-evolved", name: "Paldea Evolved" },
      { id: "scarlet-violet", name: "Scarlet & Violet" },
      { id: "paradox-rift", name: "Paradox Rift" },
    ],
  },

  summary: {
    label: "การ์ดในแคตตาล็อก",
    value: "18,940",
    footnote: "เพิ่มขึ้น 1,180 ใบเดือนนี้",
  },

  toolbar: {
    resultLabel: "แสดง 8 จาก 8,420 ใบ",
    searchPlaceholder: "ค้นหาชื่อการ์ด, เลขในชุด...",
    selects: [
      {
        id: "rarity",
        placeholder: "ความหายาก: ทั้งหมด",
        options: [
          { value: "all", label: "ความหายาก: ทั้งหมด" },
          { value: "common", label: "Common" },
          { value: "rare", label: "Rare" },
          { value: "secret", label: "Secret Rare" },
        ],
      },
      {
        id: "sort",
        placeholder: "เรียงตาม: ยอดนิยม",
        options: [
          { value: "popular", label: "เรียงตาม: ยอดนิยม" },
          { value: "newest", label: "เรียงตาม: ใหม่ล่าสุด" },
          { value: "price-asc", label: "เรียงตาม: ราคาต่ำ-สูง" },
          { value: "price-desc", label: "เรียงตาม: ราคาสูง-ต่ำ" },
        ],
      },
      {
        id: "product-type",
        placeholder: "ชนิดของสินค้า: ทั้งหมด",
        options: [
          { value: "all", label: "ชนิดของสินค้า: ทั้งหมด" },
          { value: "single", label: "การ์ดเดี่ยว" },
          { value: "box", label: "กล่องสุ่ม" },
          { value: "pack", label: "ซองสุ่ม" },
        ],
      },
    ],
  },

  products: [
    {
      id: "charizard-ex",
      type: "การ์ดเดี่ยว",
      title: "Charizard ex — Obsidian Flames",
      price: "฿1,290",
    },
    {
      id: "pikachu-vmax",
      type: "การ์ดเดี่ยว",
      title: "Pikachu VMAX — Rainbow Rare",
      price: "฿2,450",
    },
    {
      id: "paldea-box",
      type: "กล่องสุ่ม",
      title: "Paldea Evolved Booster Box",
      price: "฿4,890",
    },
    {
      id: "mewtwo-v",
      type: "การ์ดเดี่ยว",
      title: "Mewtwo V — Alt Art",
      price: "฿980",
    },
    {
      id: "luffy-gear-5",
      type: "การ์ดเดี่ยว",
      title: "Luffy Gear 5 — Leader Parallel",
      price: "฿1,650",
    },
    {
      id: "sv-pack",
      type: "ซองสุ่ม",
      title: "Scarlet & Violet Booster Pack",
      price: "฿180",
    },
    {
      id: "gengar-vmax",
      type: "การ์ดเดี่ยว",
      title: "Gengar VMAX — Full Art",
      price: "฿1,120",
    },
    {
      id: "rookie-serial",
      type: "การ์ดเดี่ยว",
      title: "2024 Rookie Serial /99",
      price: "฿3,200",
    },
  ],

  pagination: {
    label: "หน้า 1 จาก 1,053",
    previousLabel: "ก่อนหน้า",
    nextLabel: "ถัดไป",
  },
};
