import type {
  AdminCatalogData,
  AdminOverviewData,
} from "@/features/admin/admin.types";

const SPARK_BARS = [9, 14, 11, 18, 13, 22, 17, 26];

export const ADMIN_OVERVIEW_FIXTURE: AdminOverviewData = {
  title: "ภาพรวมแพลตฟอร์ม",
  subtitle:
    "สรุปผลประกอบการและกิจกรรมทั้งหมดบน Pegasus TCG · อัปเดตล่าสุด 5 นาทีที่แล้ว",

  stats: [
    {
      id: "gmv",
      label: "ยอดขายรวมเดือนนี้",
      value: "฿428,500",
      delta: "+18.2%",
      footnote: "เทียบกับ ฿362,400 เดือนก่อน",
      bars: SPARK_BARS,
      accent: "primary",
    },
    {
      id: "new-sellers",
      label: "ผู้ขายรายใหม่",
      value: "32",
      delta: "+9.4%",
      footnote: "ผ่านการยืนยัน KYC แล้ว",
      bars: SPARK_BARS,
      accent: "teal",
    },
    {
      id: "active-listings",
      label: "ประกาศขายที่ใช้งานอยู่",
      value: "6,184",
      delta: "+3.1%",
      footnote: "จาก 442 ร้านค้าทั่วแพลตฟอร์ม",
      bars: SPARK_BARS,
      accent: "primary",
    },
    {
      id: "commission",
      label: "ค่าคอมมิชชั่นที่เก็บได้",
      value: "฿12,850",
      delta: "+18.2%",
      footnote: "เฉลี่ย 3.0% ของยอดขายรวม",
      bars: SPARK_BARS,
      accent: "green",
    },
  ],

  monthlySales: {
    title: "ยอดขายรายเดือน",
    description: "แสดงยอดขายรวม 6 เดือนล่าสุด (บาท)",
    points: [
      { month: "ม.ค.", singles: 182000, sealed: 96000 },
      { month: "ก.พ.", singles: 168000, sealed: 104000 },
      { month: "มี.ค.", singles: 214000, sealed: 118000 },
      { month: "เม.ย.", singles: 236000, sealed: 132000 },
      { month: "พ.ค.", singles: 258000, sealed: 148000 },
      { month: "มิ.ย.", singles: 284000, sealed: 164000 },
    ],
  },

  activity: {
    title: "กิจกรรมล่าสุด",
    description: "เหตุการณ์สำคัญที่ต้องรับทราบ",
    actionLabel: "ดูกิจกรรมทั้งหมด",
    items: [
      {
        id: "act-1",
        initials: "MT",
        avatarAccent: "teal",
        name: "minmin_tcg",
        time: "· 5 นาที",
        message: "ส่งเอกสาร KYC เพื่อขอเปิดร้าน",
        status: "pending",
        statusLabel: "รอตรวจสอบ",
      },
      {
        id: "act-2",
        initials: "SY",
        avatarAccent: "red",
        name: "ระบบ",
        time: "· 22 นาที",
        message: "ตรวจพบประกาศขายราคาผิดปกติ 3 รายการ",
        status: "attention",
        statusLabel: "ต้องตรวจสอบ",
      },
      {
        id: "act-3",
        initials: "KP",
        avatarAccent: "primary",
        name: "kandypop",
        time: "· 1 ชม.",
        message: "ขอเพิ่มการ์ดใหม่เข้าแคตตาล็อก",
        status: "pending",
        statusLabel: "รออนุมัติ",
      },
      {
        id: "act-4",
        initials: "ST",
        avatarAccent: "primary",
        name: "sora.trades",
        time: "· 2 ชม.",
        message: "ร้องเรียนคำสั่งซื้อ ORD-10201",
        status: "attention",
        statusLabel: "เปิดเคสแล้ว",
      },
      {
        id: "act-5",
        initials: "PH",
        avatarAccent: "green",
        name: "pika.hunter",
        time: "· 4 ชม.",
        message: "ยืนยันตัวตนผ่านเรียบร้อย",
        status: "success",
        statusLabel: "สำเร็จ",
      },
    ],
  },

  topSellers: {
    title: "ร้านค้าที่ทำยอดขายสูงสุด",
    description: "จัดอันดับตามยอดขายเดือนสิงหาคม 2569",
    items: [
      { id: "s1", name: "minmin_tcg", amount: "฿86,400", percent: 100 },
      { id: "s2", name: "kandypop", amount: "฿62,180", percent: 72 },
      { id: "s3", name: "sora.trades", amount: "฿48,900", percent: 57 },
      { id: "s4", name: "pika.hunter", amount: "฿31,250", percent: 36 },
      { id: "s5", name: "tcg.bkk", amount: "฿24,700", percent: 29 },
    ],
  },

  gameShare: {
    title: "สัดส่วนยอดขายตามเกม",
    description: "ม.ค. - มิ.ย. 2569",
    slices: [
      { id: "pokemon", name: "Pokémon", value: 46 },
      { id: "one-piece", name: "One Piece", value: 22 },
      { id: "union-arena", name: "Union Arena", value: 14 },
      { id: "yugioh", name: "Yu-Gi-Oh!", value: 11 },
      { id: "others", name: "อื่น ๆ", value: 7 },
    ],
    footnoteTitle: "Pokémon ครองส่วนแบ่ง 46%",
    footnoteDescription: "ข้อมูลจากคำสั่งซื้อที่สำเร็จแล้ว",
  },
};

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
