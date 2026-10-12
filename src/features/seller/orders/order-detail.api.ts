import { formatBaht } from "@/features/seller/shared/seller.format";
import type { OrderStatus } from "@/features/seller/shared/seller.types";

import type { OrderDetail, TimelineEntry } from "./order-detail.types";
import { ORDER_STATUS_LABELS } from "./orders.format";
import {
  CARRIER_OPTIONS,
  COMMISSION_RATE,
  ORDER_SEEDS,
  orderTotal,
  type OrderSeed,
} from "./orders.mock";
import type { PaymentStatus } from "./orders.types";

/** ชื่อสถานะแบบเต็มที่ badge ข้างเลขออเดอร์ใช้ */
const STATUS_TITLES: Record<OrderStatus, string> = {
  awaiting_pack: "รอแพ็คสินค้า",
  awaiting_payment: "รอผู้ซื้อชำระเงิน",
  shipped: "กำลังจัดส่ง",
  completed: "จัดส่งสำเร็จ",
  cancelled: "ยกเลิกแล้ว",
};

const PAYMENT_BADGES: Record<PaymentStatus, string> = {
  paid: "ยืนยันแล้ว",
  pending: "รอชำระ",
  refunded: "คืนเงินแล้ว",
};

function buildSubtitle(seed: OrderSeed): string {
  const ordered = `สั่งซื้อ${seed.orderedAgo}`;

  switch (seed.status) {
    case "awaiting_pack":
      return `${ordered} · ต้องจัดส่งภายใน ${seed.shipBy} เพื่อรักษาคะแนนร้าน`;
    case "awaiting_payment":
      return `${ordered} · รอผู้ซื้อโอนเงินและแนบสลิป`;
    case "shipped":
      return `${ordered} · ส่งแล้วด้วย ${seed.shipment?.carrier} รอผู้ซื้อได้รับสินค้า`;
    case "completed":
      return `${ordered} · ผู้ซื้อได้รับสินค้าเรียบร้อยแล้ว`;
    case "cancelled":
      return `${ordered} · คำสั่งซื้อถูกยกเลิกและคืนเงินให้ผู้ซื้อแล้ว`;
  }
}

/**
 * ขั้นที่มีเวลาแล้วนับว่าเสร็จ ขั้นแรกที่ยังไม่มีเวลาคือขั้นที่ "กำลังดำเนินการ"
 * ออเดอร์ที่ยกเลิกจะตัดขั้นที่ไม่ได้เกิดทิ้ง แล้วปิดท้ายด้วยขั้นยกเลิก
 */
function buildTimeline(seed: OrderSeed): TimelineEntry[] {
  const { timeline } = seed;

  const steps = [
    { id: "ordered", label: "ผู้ซื้อสั่งซื้อ", at: timeline.orderedAt },
    { id: "slip", label: "ผู้ซื้อแจ้งโอนเงิน + แนบสลิป", at: timeline.slipAt },
    { id: "confirmed", label: "คุณยืนยันรับเงินแล้ว", at: timeline.confirmedAt },
    { id: "shipped", label: "แพ็คและกรอกเลขพัสดุ", at: timeline.shippedAt },
    { id: "delivered", label: "ผู้ซื้อได้รับสินค้า", at: timeline.deliveredAt },
  ];

  if (timeline.cancelledAt) {
    return [
      ...steps
        .filter((step) => step.at)
        .map((step) => ({
          id: step.id,
          label: step.label,
          detail: step.at ?? "",
          done: true,
        })),
      {
        id: "cancelled",
        label: "ยกเลิกคำสั่งซื้อ · คืนเงินให้ผู้ซื้อแล้ว",
        detail: timeline.cancelledAt,
        done: true,
      },
    ];
  }

  const currentIndex = steps.findIndex((step) => !step.at);

  return steps.map((step, index) => ({
    id: step.id,
    label: step.label,
    detail:
      step.at ?? (index === currentIndex ? "กำลังดำเนินการ" : "รอดำเนินการ"),
    done: Boolean(step.at),
  }));
}

/** "nattapong_p" → "NP", "kandypop" → "KA" */
function initialsOf(username: string): string {
  const parts = username.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const letters =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : username.slice(0, 2);
  return letters.toUpperCase();
}

function toOrderDetail(seed: OrderSeed): OrderDetail {
  const isPacking = seed.status === "awaiting_pack";
  const total = orderTotal(seed);
  const cost = seed.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitCost,
    0,
  );
  const commission = total * COMMISSION_RATE;
  const net = total - cost - commission - seed.shipping.sellerCost;
  const pieceCount = seed.lines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    id: seed.id,
    status: seed.status,
    statusLabel: STATUS_TITLES[seed.status],
    subtitle: buildSubtitle(seed),

    breadcrumb: {
      rootLabel: "จัดการคำสั่งซื้อ",
      statusLabel: ORDER_STATUS_LABELS[seed.status],
    },

    actions: isPacking
      ? { printLabel: "พิมพ์ใบปะหน้า", confirmLabel: "ยืนยันจัดส่ง" }
      : undefined,

    items: {
      title: isPacking ? "รายการที่ต้องแพ็ค" : "รายการสินค้า",
      countLabel: `${pieceCount} ใบ · ${seed.lines.length} รายการ`,
      packable: isPacking,
      packedLabel: "แพ็คแล้ว",
      rows: seed.lines.map((line) => ({
        id: line.id,
        name: line.name,
        meta: `${line.condition} · ตำแหน่งเก็บ: ${line.location}`,
        quantityLabel: `×${line.quantity}`,
        unitPrice: formatBaht(line.unitPrice),
      })),
    },

    shipping: {
      title: "ข้อมูลการจัดส่ง",
      recipientTitle: "ที่อยู่ผู้รับ",
      copyLabel: "คัดลอก",
      copiedLabel: "คัดลอกแล้ว",
      recipientLines: [
        seed.recipient.name,
        ...seed.recipient.addressLines,
        `โทร ${seed.recipient.phone}`,
      ],
      carrierLabel: "บริษัทขนส่ง",
      trackingLabel: "เลขพัสดุ (Tracking Number)",
      form: isPacking
        ? {
            carriers: CARRIER_OPTIONS,
            trackingPlaceholder: "เช่น TH2408xxxx91",
            note: 'กรอกเลขพัสดุแล้วกด "ยืนยันจัดส่ง" ระบบจะส่งเลขให้ผู้ซื้ออัตโนมัติ — ผู้ซื้อติดตามพัสดุเองผ่านเว็บขนส่ง',
          }
        : undefined,
      shipment: seed.shipment,
    },

    timeline: {
      title: "ไทม์ไลน์",
      entries: buildTimeline(seed),
    },

    buyer: {
      title: "ผู้ซื้อ",
      username: seed.buyer.username,
      initials: initialsOf(seed.buyer.username),
      purchaseLabel: `ซื้อจากร้านคุณ ${seed.buyer.purchaseCount} ครั้ง`,
      messageLabel: "ส่งข้อความหาผู้ซื้อ",
    },

    payment: {
      title: "การชำระเงิน",
      status: seed.payment.status,
      statusLabel: PAYMENT_BADGES[seed.payment.status],
      slip: seed.payment.transferredAt
        ? { label: "สลิปโอนเงิน · แตะเพื่อดู", viewable: true }
        : { label: "ผู้ซื้อยังไม่ได้แนบสลิป", viewable: false },
      rows: [
        { id: "account", label: "โอนเข้าบัญชี", value: seed.payment.account },
        {
          id: "transferred-at",
          label: "เวลาที่โอน",
          value: seed.payment.transferredAt ?? "—",
        },
      ],
    },

    profit:
      seed.status === "cancelled"
        ? undefined
        : {
            title: "กำไรจากออเดอร์นี้",
            rows: [
              { id: "sales", label: "ยอดขาย", value: formatBaht(total) },
              { id: "cost", label: "− ต้นทุนสินค้า", value: formatBaht(cost) },
              {
                id: "commission",
                label: `− ค่าคอมมิชชั่น ${COMMISSION_RATE * 100}%`,
                value: formatBaht(commission),
              },
              {
                id: "shipping",
                label: "− ค่าจัดส่ง",
                value: formatBaht(seed.shipping.sellerCost),
              },
            ],
            netLabel: "กำไรสุทธิ",
            netValue: formatBaht(net),
          },
  };
}

/**
 * จุดต่อข้อมูลของหน้ารายละเอียดคำสั่งซื้อ — ตอนนี้แปลงจากข้อมูลจำลองใน orders.mock.ts
 * คืน null เมื่อไม่พบเลขออเดอร์นี้ วันที่ต่อ API จริงให้แก้เฉพาะข้างในฟังก์ชันนี้
 */
export function getOrderDetail(orderId: string): OrderDetail | null {
  const seed = ORDER_SEEDS.find((order) => order.id === orderId);
  return seed ? toOrderDetail(seed) : null;
}
