import type { OrderStatus } from "@/features/seller/shared/seller.types";

import { formatBaht, ORDER_STATUS_LABELS } from "./orders.format";
import {
  CARRIER_OPTIONS,
  ORDER_SEEDS,
  orderTotal,
  type OrderSeed,
} from "./orders.mock";
import type {
  OrderFilter,
  OrdersData,
  PaymentStatus,
  SellerOrder,
} from "./orders.types";

/**
 * ข้อความของหน้า "จัดการคำสั่งซื้อ" — ลอกจาก Figma node 432:7629
 * ตัวเลขในชิปตัวกรองเป็นยอดรวมทั้งร้าน (ไม่ใช่จำนวนการ์ดที่มีใน mock)
 */
const FILTER_COUNTS: Record<OrderStatus, number> = {
  awaiting_pack: 8,
  awaiting_payment: 5,
  shipped: 34,
  completed: 210,
  cancelled: 4,
};

const FILTER_ORDER: OrderStatus[] = [
  "awaiting_pack",
  "awaiting_payment",
  "shipped",
  "completed",
  "cancelled",
];

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: "ชำระแล้ว",
  pending: "รอชำระ",
  refunded: "คืนเงินแล้ว",
};

/** แปลงข้อมูลคำสั่งซื้อหนึ่งใบเป็นรูปที่การ์ดในหน้ารายการใช้ */
function toSellerOrder(seed: OrderSeed): SellerOrder {
  const { recipient } = seed;

  return {
    id: seed.id,
    buyer: seed.buyer.username,
    orderedAtLabel: `สั่ง${seed.orderedAgo}`,
    total: formatBaht(orderTotal(seed)),
    status: seed.status,
    payment: {
      status: seed.payment.status,
      label: PAYMENT_LABELS[seed.payment.status],
    },
    urgentLabel: seed.nearDeadline ? "ใกล้เกินกำหนด" : undefined,
    lines: [
      ...seed.lines.map((line) => ({
        id: line.id,
        kind: "product" as const,
        name: line.name,
        meta: `${line.condition} ×${line.quantity}`,
        price: formatBaht(line.quantity * line.unitPrice),
      })),
      {
        id: "shipping",
        kind: "shipping" as const,
        name: `ค่าจัดส่ง ${seed.shipping.method}`,
        price: formatBaht(seed.shipping.fee),
      },
    ],
    address: [
      recipient.name,
      recipient.addressLines.join(" "),
      recipient.phone,
    ].join(" · "),
    shipment: seed.shipment,
  };
}

/**
 * จุดต่อข้อมูลของหน้าจัดการคำสั่งซื้อ — ตอนนี้แปลงจากข้อมูลจำลองใน orders.mock.ts
 * วันที่ต่อ API จริงให้แก้เฉพาะข้างในฟังก์ชันนี้ component ทุกตัวไม่ต้องแตะ
 */
export function getOrdersData(): OrdersData {
  const filters: OrderFilter[] = FILTER_ORDER.map((status) => ({
    id: status,
    label: ORDER_STATUS_LABELS[status],
    count: FILTER_COUNTS[status],
  }));

  return {
    title: "จัดการคำสั่งซื้อ",
    subtitle:
      "8 ออเดอร์รอแพ็ค · 34 กำลังจัดส่ง · จัดส่งภายใน 2 วันเพื่อรักษาคะแนนร้าน",

    actions: {
      printAllLabel: "พิมพ์ใบปะหน้าทั้งหมด",
      updateStatusLabel: "อัปเดตสถานะ",
    },

    filters,

    sort: {
      placeholder: "เรียง: เก่าสุดก่อน",
      options: [
        { value: "oldest", label: "เรียง: เก่าสุดก่อน" },
        { value: "newest", label: "เรียง: ใหม่สุดก่อน" },
        { value: "total-desc", label: "เรียง: ยอดสูง-ต่ำ" },
      ],
    },

    card: {
      selectLabel: "เลือกคำสั่งซื้อ",
      toggleLabel: "แสดงรายการสินค้าของ",
      detailLabel: "ดูรายละเอียดคำสั่งซื้อ",
      addressTitle: "ที่อยู่จัดส่ง",
      trackingPlaceholder: "กรอกเลขพัสดุ",
      carrierPlaceholder: "เลือกขนส่ง",
      carriers: CARRIER_OPTIONS,
      printLabel: "พิมพ์ใบปะหน้า",
      confirmLabel: "ยืนยันจัดส่ง",
      shipmentTitle: "เลขพัสดุ",
    },

    orders: ORDER_SEEDS.map(toSellerOrder),

    steps: {
      title: "ขั้นตอนการจัดส่ง",
      items: [
        { id: "verify-payment", label: "ตรวจสอบการชำระเงิน", done: true },
        { id: "pack", label: "แพ็คการ์ดด้วย Top Loader", done: true },
        { id: "photo", label: "ถ่ายรูปก่อนปิดกล่อง", done: false },
        { id: "tracking", label: "กรอกเลขพัสดุในระบบ", done: false },
        { id: "confirm", label: "กดยืนยันจัดส่ง", done: false },
      ],
    },

    summary: {
      title: "ผลประกอบการเดือนนี้",
      rows: [
        { id: "sales", label: "ยอดขายรวม", value: "฿24,850", tone: "default" },
        { id: "cost", label: "ต้นทุนสินค้า", value: "− ฿16,420", tone: "muted" },
        {
          id: "commission",
          label: "ค่าคอมมิชชั่น 5%",
          value: "− ฿1,242",
          tone: "muted",
        },
      ],
      netLabel: "กำไรสุทธิ",
      netValue: "฿7,188",
    },

    tip: {
      title: "เคล็ดลับ",
      description:
        "ร้านที่จัดส่งภายใน 24 ชม. ได้คะแนนรีวิวเฉลี่ยสูงกว่า 0.4 ดาว และมีโอกาสขายซ้ำมากกว่า 2 เท่า",
    },
  };
}
