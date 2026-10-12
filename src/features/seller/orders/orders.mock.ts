import type { OrderStatus } from "@/features/seller/shared/seller.types";

import type { PaymentStatus, SelectOption } from "./orders.types";

/**
 * ข้อมูลคำสั่งซื้อจำลองที่หน้า "จัดการคำสั่งซื้อ" และหน้า "รายละเอียดคำสั่งซื้อ"
 * ใช้ร่วมกัน — การ์ดในหน้ารายการกับหน้ารายละเอียดจึงตรงกันเสมอ
 *
 * รูปร่างตั้งใจให้ใกล้ DTO ฝั่ง backend (ราคาเป็นตัวเลข ยังไม่จัดรูปแบบ)
 * วันที่ต่อ API จริง ไฟล์นี้ลบทิ้งได้ทั้งไฟล์ แล้วให้ orders.api.ts /
 * order-detail.api.ts แปลงข้อมูลจาก API แทน
 *
 * "เวลาปัจจุบัน" ของข้อมูลชุดนี้คือเช้าวันที่ 14 ส.ค. 2569 ตรงกับหน้าแดชบอร์ด
 * ORD-10241 ลอกจาก Figma node 432:7629 (รายการ) และหน้ารายละเอียดคำสั่งซื้อ
 */

export type OrderLineSeed = {
  id: string;
  name: string;
  /** สภาพสินค้า เช่น "Near Mint", "ซีลปิด" */
  condition: string;
  /** ตำแหน่งเก็บในคลังของร้าน */
  location: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

export type OrderSeed = {
  id: string;
  status: OrderStatus;
  buyer: {
    username: string;
    /** จำนวนครั้งที่ซื้อจากร้านนี้ (รวมออเดอร์นี้) */
    purchaseCount: number;
  };
  /** ต่อท้าย "สั่ง" / "สั่งซื้อ" เช่น "เมื่อ 2 ชม. ที่แล้ว", "เมื่อวานนี้" */
  orderedAgo: string;
  /** กำหนดส่งเพื่อรักษาคะแนนร้าน — มีเฉพาะออเดอร์ที่ยังไม่ได้ส่ง */
  shipBy?: string;
  nearDeadline?: boolean;
  lines: OrderLineSeed[];
  shipping: {
    /** ขนส่งที่ผู้ซื้อเลือกตอนสั่ง ใช้เป็นชื่อบรรทัดค่าจัดส่ง */
    method: string;
    /** ค่าจัดส่งที่ผู้ซื้อจ่าย (รวมอยู่ในยอดขาย) */
    fee: number;
    /** ค่าส่งส่วนที่ร้านต้องออกเองเพิ่ม — 0 เมื่อผู้ซื้อจ่ายครบ */
    sellerCost: number;
  };
  recipient: {
    name: string;
    addressLines: string[];
    phone: string;
  };
  payment: {
    status: PaymentStatus;
    /** บัญชีร้านที่รับโอน */
    account: string;
    /** เวลาที่ผู้ซื้อโอน — ยังไม่โอนไม่มีค่า */
    transferredAt?: string;
  };
  shipment?: {
    carrier: string;
    trackingNumber: string;
  };
  /** เวลาที่แต่ละขั้นเกิดขึ้น ขั้นไหนยังไม่เกิดไม่ต้องใส่ */
  timeline: {
    orderedAt: string;
    slipAt?: string;
    confirmedAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    cancelledAt?: string;
  };
};

export const COMMISSION_RATE = 0.05;

export const CARRIER_OPTIONS: SelectOption[] = [
  { value: "kerry", label: "Kerry Express" },
  { value: "flash", label: "Flash Express" },
  { value: "jt", label: "J&T Express" },
  { value: "thaipost-ems", label: "ไปรษณีย์ไทย EMS" },
];

const SHOP_ACCOUNT = "กสิกรไทย xxx-x-x1234-5";

const CHARIZARD = {
  id: "charizard-ex",
  name: "Charizard ex — Obsidian Flames",
  condition: "Near Mint",
  location: "กล่อง A-12",
  unitPrice: 1290,
  unitCost: 980,
};

const SV_PACK = {
  id: "sv-pack",
  name: "Scarlet & Violet Pack",
  condition: "ซีลปิด",
  location: "กล่อง B-03",
  unitPrice: 180,
  unitCost: 135,
};

const LUFFY = {
  id: "luffy-gear-5",
  name: "Luffy Gear 5 — Leader Parallel",
  condition: "Near Mint",
  location: "กล่อง C-07",
  unitPrice: 1650,
  unitCost: 1180,
};

const NATTAPONG = {
  name: "นายณัฐพงษ์ พงษ์สุวรรณ",
  addressLines: [
    "88/12 ซ.ลาดพร้าว 15 แขวงจอมพล เขตจตุจักร",
    "กรุงเทพมหานคร 10900",
  ],
  phone: "08x-xxx-1147",
};

const KITTIPAT = {
  name: "นายกิตติพัฒน์ มณีรัตน์",
  addressLines: ["12 ม.3 ต.บ้านสวน อ.เมืองชลบุรี", "ชลบุรี 20000"],
  phone: "08x-xxx-5510",
};

export const ORDER_SEEDS: OrderSeed[] = [
  // ---------- รอแพ็ค ----------
  {
    id: "ORD-10241",
    status: "awaiting_pack",
    buyer: { username: "nattapong_p", purchaseCount: 4 },
    orderedAgo: "เมื่อ 2 ชม. ที่แล้ว",
    shipBy: "14 ส.ค. 2569",
    nearDeadline: true,
    lines: [
      { ...CHARIZARD, quantity: 1 },
      { ...SV_PACK, quantity: 2 },
    ],
    shipping: { method: "EMS", fee: 200, sellerCost: 0 },
    recipient: NATTAPONG,
    payment: {
      status: "paid",
      account: SHOP_ACCOUNT,
      transferredAt: "14 ส.ค. 07:46 น.",
    },
    timeline: {
      orderedAt: "14 ส.ค. 2569 · 07:12",
      slipAt: "14 ส.ค. 2569 · 07:48",
      confirmedAt: "14 ส.ค. 2569 · 09:02",
    },
  },
  {
    id: "ORD-10239",
    status: "awaiting_pack",
    buyer: { username: "rare.gems", purchaseCount: 1 },
    orderedAgo: "เมื่อ 5 ชม. ที่แล้ว",
    shipBy: "16 ส.ค. 2569",
    lines: [{ ...SV_PACK, quantity: 4 }],
    shipping: { method: "EMS", fee: 200, sellerCost: 0 },
    recipient: {
      name: "น.ส.พิมพ์ชนก รัตนวงศ์",
      addressLines: [
        "45 ถ.นิมมานเหมินท์ ต.สุเทพ อ.เมืองเชียงใหม่",
        "เชียงใหม่ 50200",
      ],
      phone: "09x-xxx-3382",
    },
    payment: {
      status: "paid",
      account: SHOP_ACCOUNT,
      transferredAt: "14 ส.ค. 04:20 น.",
    },
    timeline: {
      orderedAt: "14 ส.ค. 2569 · 04:15",
      slipAt: "14 ส.ค. 2569 · 04:22",
      confirmedAt: "14 ส.ค. 2569 · 08:30",
    },
  },
  {
    id: "ORD-10236",
    status: "awaiting_pack",
    buyer: { username: "cardsdeal.th", purchaseCount: 7 },
    orderedAgo: "เมื่อ 8 ชม. ที่แล้ว",
    shipBy: "16 ส.ค. 2569",
    lines: [
      { ...CHARIZARD, quantity: 1 },
      { ...LUFFY, quantity: 1 },
      { ...SV_PACK, quantity: 2 },
    ],
    shipping: { method: "Kerry Express", fee: 110, sellerCost: 0 },
    recipient: {
      name: "คุณธนากร ศรีสุข",
      addressLines: [
        "199/7 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง",
        "กรุงเทพมหานคร 10310",
      ],
      phone: "06x-xxx-9021",
    },
    payment: {
      status: "paid",
      account: SHOP_ACCOUNT,
      transferredAt: "14 ส.ค. 01:29 น.",
    },
    timeline: {
      orderedAt: "14 ส.ค. 2569 · 01:15",
      slipAt: "14 ส.ค. 2569 · 01:31",
      confirmedAt: "14 ส.ค. 2569 · 08:05",
    },
  },
  {
    id: "ORD-10234",
    status: "awaiting_pack",
    buyer: { username: "pika.hunter", purchaseCount: 3 },
    orderedAgo: "เมื่อวานนี้",
    shipBy: "15 ส.ค. 2569",
    lines: [
      {
        id: "gengar-vmax",
        name: "Gengar VMAX — Full Art",
        condition: "Lightly Played",
        location: "กล่อง A-04",
        quantity: 1,
        unitPrice: 1120,
        unitCost: 860,
      },
    ],
    shipping: { method: "Flash Express", fee: 120, sellerCost: 0 },
    recipient: KITTIPAT,
    payment: {
      status: "paid",
      account: SHOP_ACCOUNT,
      transferredAt: "13 ส.ค. 15:50 น.",
    },
    timeline: {
      orderedAt: "13 ส.ค. 2569 · 15:40",
      slipAt: "13 ส.ค. 2569 · 15:52",
      confirmedAt: "13 ส.ค. 2569 · 18:10",
    },
  },

  // ---------- รอชำระ ----------
  {
    id: "ORD-10244",
    status: "awaiting_payment",
    buyer: { username: "tcg.bkk", purchaseCount: 2 },
    orderedAgo: "เมื่อ 20 นาทีที่แล้ว",
    lines: [{ ...CHARIZARD, quantity: 1 }],
    shipping: { method: "EMS", fee: 200, sellerCost: 0 },
    recipient: {
      name: "คุณวรเมธ ตั้งตระกูล",
      addressLines: [
        "7/3 ซ.อารีย์ 2 แขวงพญาไท เขตพญาไท",
        "กรุงเทพมหานคร 10400",
      ],
      phone: "08x-xxx-7734",
    },
    payment: { status: "pending", account: SHOP_ACCOUNT },
    timeline: { orderedAt: "14 ส.ค. 2569 · 08:55" },
  },
  {
    id: "ORD-10233",
    status: "awaiting_payment",
    buyer: { username: "sora.trades", purchaseCount: 1 },
    orderedAgo: "เมื่อวานนี้",
    lines: [
      {
        id: "pikachu-vmax-lp",
        name: "Pikachu VMAX — Rainbow Rare",
        condition: "Lightly Played",
        location: "กล่อง A-02",
        quantity: 1,
        unitPrice: 540,
        unitCost: 400,
      },
    ],
    shipping: { method: "ไปรษณีย์ไทย", fee: 100, sellerCost: 0 },
    recipient: {
      name: "น.ส.โสรยา กาญจนา",
      addressLines: ["301 ถ.มิตรภาพ ต.ในเมือง อ.เมืองขอนแก่น", "ขอนแก่น 40000"],
      phone: "09x-xxx-6645",
    },
    payment: { status: "pending", account: SHOP_ACCOUNT },
    timeline: { orderedAt: "13 ส.ค. 2569 · 11:20" },
  },

  // ---------- กำลังจัดส่ง ----------
  {
    id: "ORD-10238",
    status: "shipped",
    buyer: { username: "kandypop", purchaseCount: 5 },
    orderedAgo: "เมื่อ 6 ชม. ที่แล้ว",
    lines: [{ ...LUFFY, quantity: 2 }],
    shipping: { method: "Kerry Express", fee: 120, sellerCost: 0 },
    recipient: {
      name: "คุณแคนดี้ ประเสริฐ",
      addressLines: ["56/88 ถ.แจ้งวัฒนะ ต.ปากเกร็ด อ.ปากเกร็ด", "นนทบุรี 11120"],
      phone: "08x-xxx-2290",
    },
    payment: {
      status: "paid",
      account: SHOP_ACCOUNT,
      transferredAt: "14 ส.ค. 03:23 น.",
    },
    shipment: { carrier: "Kerry Express", trackingNumber: "KEX0012845731" },
    timeline: {
      orderedAt: "14 ส.ค. 2569 · 03:10",
      slipAt: "14 ส.ค. 2569 · 03:25",
      confirmedAt: "14 ส.ค. 2569 · 07:40",
      shippedAt: "14 ส.ค. 2569 · 08:50",
    },
  },
  {
    id: "ORD-10231",
    status: "shipped",
    buyer: { username: "luna.cards", purchaseCount: 2 },
    orderedAgo: "เมื่อ 2 วันที่แล้ว",
    lines: [
      {
        id: "pikachu-vmax",
        name: "Pikachu VMAX — Rainbow Rare",
        condition: "Near Mint",
        location: "กล่อง A-01",
        quantity: 1,
        unitPrice: 2450,
        unitCost: 1890,
      },
    ],
    shipping: { method: "EMS", fee: 200, sellerCost: 0 },
    recipient: {
      name: "น.ส.ลลิตา สมบูรณ์",
      addressLines: [
        "9 ถ.ราชดำเนิน ต.ในเมือง อ.เมืองนครศรีธรรมราช",
        "นครศรีธรรมราช 80000",
      ],
      phone: "06x-xxx-4418",
    },
    payment: {
      status: "paid",
      account: SHOP_ACCOUNT,
      transferredAt: "12 ส.ค. 10:18 น.",
    },
    shipment: { carrier: "ไปรษณีย์ไทย EMS", trackingNumber: "EF582913406TH" },
    timeline: {
      orderedAt: "12 ส.ค. 2569 · 10:05",
      slipAt: "12 ส.ค. 2569 · 10:20",
      confirmedAt: "12 ส.ค. 2569 · 13:30",
      shippedAt: "13 ส.ค. 2569 · 09:15",
    },
  },

  // ---------- สำเร็จ ----------
  {
    id: "ORD-10229",
    status: "completed",
    buyer: { username: "pika.hunter", purchaseCount: 3 },
    orderedAgo: "เมื่อ 3 วันที่แล้ว",
    lines: [
      {
        id: "mewtwo-v-alt-art",
        name: "Mewtwo V — Alt Art",
        condition: "Lightly Played",
        location: "กล่อง A-09",
        quantity: 1,
        unitPrice: 890,
        unitCost: 720,
      },
    ],
    shipping: { method: "Flash Express", fee: 100, sellerCost: 0 },
    recipient: KITTIPAT,
    payment: {
      status: "paid",
      account: SHOP_ACCOUNT,
      transferredAt: "11 ส.ค. 19:39 น.",
    },
    shipment: { carrier: "Flash Express", trackingNumber: "TH0147852369" },
    timeline: {
      orderedAt: "11 ส.ค. 2569 · 19:30",
      slipAt: "11 ส.ค. 2569 · 19:41",
      confirmedAt: "11 ส.ค. 2569 · 21:00",
      shippedAt: "12 ส.ค. 2569 · 10:20",
      deliveredAt: "13 ส.ค. 2569 · 14:05",
    },
  },

  // ---------- ยกเลิก ----------
  {
    id: "ORD-10227",
    status: "cancelled",
    buyer: { username: "jirayu.k", purchaseCount: 1 },
    orderedAgo: "เมื่อ 4 วันที่แล้ว",
    lines: [
      {
        id: "paldea-box",
        name: "Paldea Evolved Booster Box",
        condition: "ซีลปิด",
        location: "กล่อง D-01",
        quantity: 1,
        unitPrice: 4690,
        unitCost: 4150,
      },
    ],
    shipping: { method: "Kerry Express", fee: 200, sellerCost: 0 },
    recipient: {
      name: "นายจิรายุ คงเจริญ",
      addressLines: [
        "22 ถ.สุขุมวิท 101 แขวงบางจาก เขตพระโขนง",
        "กรุงเทพมหานคร 10260",
      ],
      phone: "08x-xxx-8803",
    },
    payment: {
      status: "refunded",
      account: SHOP_ACCOUNT,
      transferredAt: "10 ส.ค. 12:12 น.",
    },
    timeline: {
      orderedAt: "10 ส.ค. 2569 · 12:00",
      slipAt: "10 ส.ค. 2569 · 12:14",
      cancelledAt: "10 ส.ค. 2569 · 16:45",
    },
  },
];

/** ยอดที่ผู้ซื้อจ่ายทั้งหมด = ราคาสินค้าทุกบรรทัด + ค่าจัดส่ง */
export function orderTotal(order: OrderSeed): number {
  return (
    order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) +
    order.shipping.fee
  );
}
