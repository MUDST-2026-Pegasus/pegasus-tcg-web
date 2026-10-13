import {
  SELLER_ORDER_STATUS_LABEL,
  TO_PACK_STATUSES,
} from "@/features/seller/shared/order-status";
import { formatBaht } from "@/features/seller/shared/seller.format";
import type { SellerOrderStatus } from "@/features/seller/shared/seller.types";

import type {
  DashboardData,
  Delta,
  LowStock,
  RecentOrders,
  SalesSummary,
  SellerDashboard,
  StatCardData,
  TodoItem,
  TodoList,
} from "./dashboard.types";

/**
 * แปลงค่าดิบจาก `/sellers/me/dashboard` → ข้อความบนการ์ดแต่ละใบ
 * ไม่มี React — ทดสอบได้ตรง ๆ
 */

const THAI_MONTH_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const THAI_MONTH_LONG = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const count = new Intl.NumberFormat("en-US");

const todayFormat = new Intl.DateTimeFormat("th-TH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

function parseMonth(value: string): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

/** "2026-10" → "ต.ค. 69" (ปี พ.ศ. สองหลัก) */
export function thaiMonthShortYear(value: string): string {
  const { year, month } = parseMonth(value);
  return `${THAI_MONTH_SHORT[month - 1]} ${String(year + 543).slice(-2)}`;
}

/** "2026-10" → "ตุลาคม" */
export function thaiMonthLong(value: string): string {
  return THAI_MONTH_LONG[parseMonth(value).month - 1];
}

/**
 * % เทียบเดือนก่อน — `null` เมื่อไม่มีอะไรให้เทียบ (ทั้งสองเดือนเป็น 0)
 * เดือนก่อนเป็น 0 แต่เดือนนี้มี ใช้คำว่า "ใหม่" แทนการหารด้วยศูนย์
 */
export function formatDelta(value: number, previous: number): Delta | null {
  if (previous === 0) {
    return value === 0 ? null : { label: "ใหม่", trend: "new" };
  }
  const rounded = Math.round(((value - previous) / previous) * 1000) / 10;
  if (rounded === 0) {
    return { label: "0.0%", trend: "flat" };
  }
  const sign = rounded > 0 ? "+" : "−";
  return {
    label: `${sign}${Math.abs(rounded).toFixed(1)}%`,
    trend: rounded > 0 ? "up" : "down",
  };
}

/** จำนวนออเดอร์ของหลายสถานะรวมกัน — สถานะที่ไม่มีออเดอร์ backend ไม่ส่งมา นับเป็น 0 */
export function countOrders(
  orders: SellerDashboard["orders"],
  statuses: SellerOrderStatus[],
): number {
  return statuses.reduce((sum, status) => sum + (orders[status] ?? 0), 0);
}

export function salesSummary(dashboard: SellerDashboard): SalesSummary {
  const { sales, period } = dashboard;
  const average = sales.orderCount > 0 ? sales.value / sales.orderCount : 0;
  const first = sales.monthly[0]?.month ?? period.month;
  const last = sales.monthly.at(-1)?.month ?? period.month;

  return {
    // ยอดนี้คือ `items_subtotal` — หน้าจัดการคำสั่งซื้อมีอีกยอดที่รวมค่าส่ง จึงต้องบอกให้ชัด
    label: `ยอดขายเดือน${thaiMonthLong(period.month)} (ไม่รวมค่าส่ง)`,
    amount: formatBaht(sales.value),
    delta: formatDelta(sales.value, sales.previous),
    description:
      sales.orderCount === 0
        ? "ยังไม่มีคำสั่งซื้อที่ชำระแล้วในเดือนนี้"
        : `จาก ${count.format(sales.orderCount)} คำสั่งซื้อ · เฉลี่ย ${formatBaht(Math.round(average))} ต่อออเดอร์`,
    bars: sales.monthly.map((point) => ({
      month: point.month,
      amount: point.amount,
      label: `${thaiMonthShortYear(point.month)} ${formatBaht(point.amount)}`,
      highlighted: point.month === period.month,
    })),
    rangeStart: thaiMonthShortYear(first),
    rangeEnd: thaiMonthShortYear(last),
  };
}

/**
 * งานที่ร้านต้องทำ เรียงจากด่วนสุด — รายการที่เป็น 0 ไม่ขึ้น
 * ลิงก์ไปหน้าที่จัดการได้ทันที (`?status=` ตรงกับแท็บของหน้าจัดการคำสั่งซื้อ)
 * คำขอคืนสินค้าตอบได้ที่ `/seller/returns` เท่านั้น แท็บคืนสินค้าของหน้าคำสั่งซื้อมีไว้ดูอย่างเดียว
 */
export function todoList(dashboard: SellerDashboard): TodoList {
  const { orders, listings, reviews } = dashboard;
  const toPack = countOrders(orders, TO_PACK_STATUSES);
  const returns = countOrders(orders, ["RETURN_REQUESTED"]);
  const unpaid = countOrders(orders, ["PENDING_PAYMENT"]);

  const candidates: { count: number; item: TodoItem }[] = [
    {
      count: toPack,
      item: {
        id: "pack",
        accent: "red",
        title: "แพ็คและจัดส่งคำสั่งซื้อ",
        description: `${count.format(toPack)} ออเดอร์รอจัดส่ง`,
        to: "/seller/orders?status=awaiting_pack",
      },
    },
    {
      count: returns,
      item: {
        id: "returns",
        accent: "red",
        title: "ตอบคำขอคืนสินค้า",
        description: `${count.format(returns)} คำขอรอการตัดสินใจ`,
        to: "/seller/returns",
      },
    },
    {
      count: listings.lowStockCount,
      item: {
        id: "restock",
        accent: "amber",
        title: "เติมสต็อกสินค้าที่ใกล้หมด",
        description: `${count.format(listings.lowStockCount)} รายการเหลือไม่เกิน ${listings.lowStockThreshold} ใบ`,
        // ใกล้หมดนับเฉพาะ ACTIVE — เรียงคงเหลือน้อยก่อน ใบที่ต้องเติมจะอยู่บนสุด
        to: "/seller/products?status=ACTIVE&sort=stock_asc",
      },
    },
    {
      count: unpaid,
      item: {
        id: "payment",
        accent: "primary",
        title: "ออเดอร์รอผู้ซื้อชำระเงิน",
        description: `${count.format(unpaid)} ออเดอร์ · ยกเลิกอัตโนมัติถ้าไม่จ่ายตามกำหนด`,
        to: "/seller/orders?status=awaiting_payment",
      },
    },
    {
      count: reviews.unreplied,
      item: {
        id: "reviews",
        accent: "gray",
        title: "ตอบกลับรีวิว",
        description: `${count.format(reviews.unreplied)} รีวิวยังไม่ได้ตอบ`,
        to: "/seller/reviews",
      },
    },
  ];

  const items = candidates
    .filter((candidate) => candidate.count > 0)
    .map((candidate) => candidate.item);

  return {
    title: "สิ่งที่ต้องทำวันนี้",
    description:
      items.length === 0 ? "ไม่มีงานค้าง" : `${items.length} รายการรอดำเนินการ`,
    count: items.length,
    items,
    emptyLabel: "ไม่มีอะไรค้าง ร้านของคุณเรียบร้อยดี",
  };
}

export function statCards(dashboard: SellerDashboard): StatCardData[] {
  const { listings, reviews, wallet } = dashboard;
  return [
    {
      id: "listings",
      accent: "primary",
      label: "สินค้าที่ลงขาย",
      value: count.format(listings.active),
      footnote:
        listings.publishedThisMonth > 0
          ? `+${count.format(listings.publishedThisMonth)} เดือนนี้`
          : "ยังไม่มีประกาศใหม่เดือนนี้",
    },
    {
      id: "escrow",
      accent: "violet",
      label: "เงินรอปล่อย",
      value: formatBaht(wallet.pending),
      footnote: "ปล่อยเมื่อผู้ซื้อยืนยันรับสินค้า",
    },
    {
      id: "rating",
      accent: "amber",
      label: "คะแนนร้านค้า",
      value: reviews.average === null ? "—" : `${reviews.average.toFixed(1)} / 5.0`,
      footnote:
        reviews.count === 0 ? "ยังไม่มีรีวิว" : `จาก ${count.format(reviews.count)} รีวิว`,
    },
    {
      id: "withdrawable",
      accent: "green",
      label: "ยอดเงินพร้อมถอน",
      value: formatBaht(wallet.withdrawable),
      footnote: "หักยอดที่กำลังถอนแล้ว",
    },
  ];
}

export function recentOrders(dashboard: SellerDashboard): RecentOrders {
  return {
    title: "คำสั่งซื้อล่าสุด",
    actionLabel: "ดูทั้งหมด",
    emptyLabel: "ยังไม่มีคำสั่งซื้อ",
    items: dashboard.recentOrders.map((order) => ({
      id: order.sellerOrderId,
      number: order.sellerOrderNumber,
      buyer: order.buyerUsername,
      item: `${order.firstItemName ?? "สินค้า"} · ${count.format(order.itemCount)} ชิ้น`,
      price: formatBaht(order.grandTotal),
      status: order.status,
      statusLabel: SELLER_ORDER_STATUS_LABEL[order.status],
    })),
  };
}

/** แถบยาวตามสัดส่วนที่เหลือ แต่ไม่สั้นจนมองไม่เห็น — เหลือใบเดียวคือวิกฤต */
export function lowStock(dashboard: SellerDashboard): LowStock {
  const { listings } = dashboard;
  return {
    title: "สต็อกใกล้หมด",
    count: listings.lowStockCount,
    items: listings.lowStock.map((listing) => ({
      listingId: listing.listingId,
      name: listing.lotLabel
        ? `${listing.productName} — ${listing.lotLabel}`
        : listing.productName,
      remainingLabel: `เหลือ ${count.format(listing.quantityAvailable)}`,
      percent:
        listing.quantityTotal > 0
          ? Math.max(8, Math.round((listing.quantityAvailable / listing.quantityTotal) * 100))
          : 8,
      severity: listing.quantityAvailable <= 1 ? "critical" : "warning",
    })),
    actionLabel: "ไปหน้าจัดการสินค้า",
    emptyLabel: "สต็อกยังพอทุกรายการ",
  };
}

/**
 * ทั้งหน้าในครั้งเดียว — ชื่อกับ username มาจาก `useAuth()` ไม่ใช่จาก API
 * เพราะโปรไฟล์ผู้ใช้คือหน้าร้าน [RQ-2]
 *
 * @param now ใส่ได้ตอนทดสอบ ปกติคือเวลาปัจจุบัน
 */
export function toDashboardData(
  dashboard: SellerDashboard,
  seller: { displayName: string; username: string },
  now: Date = new Date(),
): DashboardData {
  return {
    greeting: `สวัสดี, ${seller.displayName} 👋`,
    subtitle: `สรุปภาพรวมร้านของคุณ · ${todayFormat.format(now)}`,
    actions: {
      viewShopLabel: "ดูหน้าร้าน",
      viewShopTo: seller.username ? `/u/${seller.username}` : null,
      createListingLabel: "+ ลงขายสินค้า",
    },
    sales: salesSummary(dashboard),
    todo: todoList(dashboard),
    stats: statCards(dashboard),
    recentOrders: recentOrders(dashboard),
    lowStock: lowStock(dashboard),
  };
}
