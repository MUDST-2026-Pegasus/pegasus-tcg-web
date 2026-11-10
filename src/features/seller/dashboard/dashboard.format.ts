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
import { dateTimeFormat, formatMonth, formatYear, monthStart, numberFormat, translate } from "@/lib/i18n";

/**
 * แปลงค่าดิบจาก `/sellers/me/dashboard` → ข้อความบนการ์ดแต่ละใบ
 * ไม่มี React — ทดสอบได้ตรง ๆ
 */

const count = numberFormat();

const todayFormat = dateTimeFormat({
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

/** "2026-10" → "ต.ค. 69" (ปี พ.ศ. สองหลัก) */
export function thaiMonthShortYear(value: string): string {
  return `${formatMonth(value)} ${formatYear(monthStart(value), { digits: "2-digit" })}`;
}

/** "2026-10" → "ตุลาคม" */
export function thaiMonthLong(value: string): string {
  return formatMonth(value, "long");
}

/**
 * % เทียบเดือนก่อน — `null` เมื่อไม่มีอะไรให้เทียบ (ทั้งสองเดือนเป็น 0)
 * เดือนก่อนเป็น 0 แต่เดือนนี้มี ใช้คำว่า "ใหม่" แทนการหารด้วยศูนย์
 */
export function formatDelta(value: number, previous: number): Delta | null {
  if (previous === 0) {
    return value === 0 ? null : { label: translate("seller", "dashboard.delta.new", "ใหม่"), trend: "new" };
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
    label: translate("seller", "dashboard.sales.label", "ยอดขายเดือน{month} (ไม่รวมค่าส่ง)", { month: thaiMonthLong(period.month) }),
    amount: formatBaht(sales.value),
    delta: formatDelta(sales.value, sales.previous),
    description:
      sales.orderCount === 0
        ? translate("seller", "dashboard.sales.empty", "ยังไม่มีคำสั่งซื้อที่ชำระแล้วในเดือนนี้")
        : translate("seller", "dashboard.sales.description", "จาก {count} คำสั่งซื้อ · เฉลี่ย {average} ต่อออเดอร์", { count: count.format(sales.orderCount), average: formatBaht(Math.round(average)) }),
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
        title: translate("seller", "dashboard.todo.pack.title", "แพ็คและจัดส่งคำสั่งซื้อ"),
        description: translate("seller", "dashboard.todo.pack.description", "{count} ออเดอร์รอจัดส่ง", { count: count.format(toPack) }),
        to: "/seller/orders?status=awaiting_pack",
      },
    },
    {
      count: returns,
      item: {
        id: "returns",
        accent: "red",
        title: translate("seller", "dashboard.todo.returns.title", "ตอบคำขอคืนสินค้า"),
        description: translate("seller", "dashboard.todo.returns.description", "{count} คำขอรอการตัดสินใจ", { count: count.format(returns) }),
        to: "/seller/returns",
      },
    },
    {
      count: listings.lowStockCount,
      item: {
        id: "restock",
        accent: "amber",
        title: translate("seller", "dashboard.todo.restock.title", "เติมสต็อกสินค้าที่ใกล้หมด"),
        description: translate("seller", "dashboard.todo.restock.description", "{count} รายการเหลือไม่เกิน {threshold} ใบ", { count: count.format(listings.lowStockCount), threshold: String(listings.lowStockThreshold) }),
        // ใกล้หมดนับเฉพาะ ACTIVE — เรียงคงเหลือน้อยก่อน ใบที่ต้องเติมจะอยู่บนสุด
        to: "/seller/products?status=ACTIVE&sort=stock_asc",
      },
    },
    {
      count: unpaid,
      item: {
        id: "payment",
        accent: "primary",
        title: translate("seller", "dashboard.todo.payment.title", "ออเดอร์รอผู้ซื้อชำระเงิน"),
        description: translate("seller", "dashboard.todo.payment.description", "{count} ออเดอร์ · ยกเลิกอัตโนมัติถ้าไม่จ่ายตามกำหนด", { count: count.format(unpaid) }),
        to: "/seller/orders?status=awaiting_payment",
      },
    },
    {
      count: reviews.unreplied,
      item: {
        id: "reviews",
        accent: "gray",
        title: translate("seller", "dashboard.todo.reviews.title", "ตอบกลับรีวิว"),
        description: translate("seller", "dashboard.todo.reviews.description", "{count} รีวิวยังไม่ได้ตอบ", { count: count.format(reviews.unreplied) }),
        to: "/seller/reviews?tab=unreplied",
      },
    },
  ];

  const items = candidates
    .filter((candidate) => candidate.count > 0)
    .map((candidate) => candidate.item);

  return {
    title: translate("seller", "dashboard.todo.title", "สิ่งที่ต้องทำวันนี้"),
    description:
      items.length === 0
        ? translate("seller", "dashboard.todo.none", "ไม่มีงานค้าง")
        : translate("seller", "dashboard.todo.pending", "{count} รายการรอดำเนินการ", { count: String(items.length) }),
    count: items.length,
    items,
    emptyLabel: translate("seller", "dashboard.todo.empty", "ไม่มีอะไรค้าง ร้านของคุณเรียบร้อยดี"),
  };
}

export function statCards(dashboard: SellerDashboard): StatCardData[] {
  const { listings, reviews, wallet } = dashboard;
  return [
    {
      id: "listings",
      accent: "primary",
      label: translate("seller", "dashboard.stats.listings.label", "สินค้าที่ลงขาย"),
      value: count.format(listings.active),
      footnote:
        listings.publishedThisMonth > 0
          ? translate("seller", "dashboard.stats.listings.thisMonth", "+{count} เดือนนี้", { count: count.format(listings.publishedThisMonth) })
          : translate("seller", "dashboard.stats.listings.none", "ยังไม่มีประกาศใหม่เดือนนี้"),
    },
    {
      id: "escrow",
      accent: "violet",
      label: translate("seller", "dashboard.stats.escrow.label", "เงินรอปล่อย"),
      value: formatBaht(wallet.pending),
      footnote: translate("seller", "dashboard.stats.escrow.footnote", "ปล่อยเมื่อผู้ซื้อยืนยันรับสินค้า"),
    },
    {
      id: "rating",
      accent: "amber",
      label: translate("seller", "dashboard.stats.rating.label", "คะแนนร้านค้า"),
      value: reviews.average === null ? "—" : `${reviews.average.toFixed(1)} / 5.0`,
      footnote:
        reviews.count === 0
          ? translate("seller", "dashboard.stats.rating.none", "ยังไม่มีรีวิว")
          : translate("seller", "dashboard.stats.rating.count", "จาก {count} รีวิว", { count: count.format(reviews.count) }),
    },
    {
      id: "withdrawable",
      accent: "green",
      label: translate("seller", "dashboard.stats.withdrawable.label", "ยอดเงินพร้อมถอน"),
      value: formatBaht(wallet.withdrawable),
      footnote: translate("seller", "dashboard.stats.withdrawable.footnote", "หักยอดที่กำลังถอนแล้ว"),
    },
  ];
}

export function recentOrders(dashboard: SellerDashboard): RecentOrders {
  return {
    title: translate("seller", "dashboard.recentOrders.title", "คำสั่งซื้อล่าสุด"),
    actionLabel: translate("seller", "dashboard.recentOrders.viewAll", "ดูทั้งหมด"),
    emptyLabel: translate("seller", "dashboard.recentOrders.empty", "ยังไม่มีคำสั่งซื้อ"),
    items: dashboard.recentOrders.map((order) => ({
      id: order.sellerOrderId,
      productName: order.firstItemName ?? translate("seller", "dashboard.recentOrders.product", "สินค้า"),
      imageUrl: order.firstImageUrl,
      number: order.sellerOrderNumber,
      buyer: order.buyerUsername,
      item: translate("seller", "dashboard.recentOrders.item", "{name} · {count} ชิ้น", { name: order.firstItemName ?? translate("seller", "dashboard.recentOrders.product", "สินค้า"), count: count.format(order.itemCount) }),
      price: formatBaht(order.grandTotal),
      status: order.status,
      statusLabel: SELLER_ORDER_STATUS_LABEL[order.status],
    })),
  };
}

export function lowStock(dashboard: SellerDashboard): LowStock {
  const { listings } = dashboard;
  return {
    title: translate("seller", "dashboard.lowStock.title", "สต็อกใกล้หมด"),
    subtitle: translate("seller", "dashboard.lowStock.subtitle", "ประกาศที่เหลือไม่เกิน {count} ชิ้น · น้อยสุดก่อน", { count: count.format(listings.lowStockThreshold) }),
    count: listings.lowStockCount,
    items: listings.lowStock.map((listing) => ({
      listingId: listing.listingId,
      imageUrl: listing.imageUrl,
      name: listing.productName,
      metaLabel: listing.lotLabel ? `${listing.lotLabel} · ${listing.conditionCode}` : null,
      remainingLabel: translate("seller", "dashboard.lowStock.remaining", "เหลือ {count} ชิ้น", { count: count.format(listing.quantityAvailable) }),
      severity: listing.quantityAvailable <= 1 ? "critical" : "warning",
    })),
    actionLabel: listings.lowStockCount > listings.lowStock.length
      ? translate("seller", "dashboard.lowStock.viewAll", "ดูทั้งหมด {count} รายการ", { count: count.format(listings.lowStockCount) })
      : translate("seller", "dashboard.lowStock.manage", "ไปหน้าจัดการสินค้า"),
    actionTo: "/seller/products?status=ACTIVE&sort=stock_asc",
    emptyLabel: translate("seller", "dashboard.lowStock.empty", "สต็อกยังพอทุกรายการ"),
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
    greeting: translate("seller", "dashboard.greeting", "สวัสดี, {name} 👋", { name: seller.displayName }),
    subtitle: translate("seller", "dashboard.subtitle", "สรุปภาพรวมร้านของคุณ · {date}", { date: todayFormat.format(now) }),
    actions: {
      viewShopLabel: translate("seller", "dashboard.actions.viewShop", "ดูหน้าร้าน"),
      viewShopTo: seller.username ? `/u/${seller.username}` : null,
      createListingLabel: translate("seller", "dashboard.actions.createListing", "+ ลงขายสินค้า"),
    },
    sales: salesSummary(dashboard),
    todo: todoList(dashboard),
    stats: statCards(dashboard),
    recentOrders: recentOrders(dashboard),
    lowStock: lowStock(dashboard),
  };
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "dashboard.delta.new", "ns": "seller", "defaultValue": "ใหม่"}
// @tolgee-key {"key": "dashboard.sales.label", "ns": "seller", "defaultValue": "ยอดขายเดือน{month} (ไม่รวมค่าส่ง)"}
// @tolgee-key {"key": "dashboard.sales.empty", "ns": "seller", "defaultValue": "ยังไม่มีคำสั่งซื้อที่ชำระแล้วในเดือนนี้"}
// @tolgee-key {"key": "dashboard.sales.description", "ns": "seller", "defaultValue": "จาก {count} คำสั่งซื้อ · เฉลี่ย {average} ต่อออเดอร์"}
// @tolgee-key {"key": "dashboard.todo.pack.title", "ns": "seller", "defaultValue": "แพ็คและจัดส่งคำสั่งซื้อ"}
// @tolgee-key {"key": "dashboard.todo.pack.description", "ns": "seller", "defaultValue": "{count} ออเดอร์รอจัดส่ง"}
// @tolgee-key {"key": "dashboard.todo.returns.title", "ns": "seller", "defaultValue": "ตอบคำขอคืนสินค้า"}
// @tolgee-key {"key": "dashboard.todo.returns.description", "ns": "seller", "defaultValue": "{count} คำขอรอการตัดสินใจ"}
// @tolgee-key {"key": "dashboard.todo.restock.title", "ns": "seller", "defaultValue": "เติมสต็อกสินค้าที่ใกล้หมด"}
// @tolgee-key {"key": "dashboard.todo.restock.description", "ns": "seller", "defaultValue": "{count} รายการเหลือไม่เกิน {threshold} ใบ"}
// @tolgee-key {"key": "dashboard.todo.payment.title", "ns": "seller", "defaultValue": "ออเดอร์รอผู้ซื้อชำระเงิน"}
// @tolgee-key {"key": "dashboard.todo.payment.description", "ns": "seller", "defaultValue": "{count} ออเดอร์ · ยกเลิกอัตโนมัติถ้าไม่จ่ายตามกำหนด"}
// @tolgee-key {"key": "dashboard.todo.reviews.title", "ns": "seller", "defaultValue": "ตอบกลับรีวิว"}
// @tolgee-key {"key": "dashboard.todo.reviews.description", "ns": "seller", "defaultValue": "{count} รีวิวยังไม่ได้ตอบ"}
// @tolgee-key {"key": "dashboard.todo.title", "ns": "seller", "defaultValue": "สิ่งที่ต้องทำวันนี้"}
// @tolgee-key {"key": "dashboard.todo.none", "ns": "seller", "defaultValue": "ไม่มีงานค้าง"}
// @tolgee-key {"key": "dashboard.todo.pending", "ns": "seller", "defaultValue": "{count} รายการรอดำเนินการ"}
// @tolgee-key {"key": "dashboard.todo.empty", "ns": "seller", "defaultValue": "ไม่มีอะไรค้าง ร้านของคุณเรียบร้อยดี"}
// @tolgee-key {"key": "dashboard.stats.listings.label", "ns": "seller", "defaultValue": "สินค้าที่ลงขาย"}
// @tolgee-key {"key": "dashboard.stats.listings.thisMonth", "ns": "seller", "defaultValue": "+{count} เดือนนี้"}
// @tolgee-key {"key": "dashboard.stats.listings.none", "ns": "seller", "defaultValue": "ยังไม่มีประกาศใหม่เดือนนี้"}
// @tolgee-key {"key": "dashboard.stats.escrow.label", "ns": "seller", "defaultValue": "เงินรอปล่อย"}
// @tolgee-key {"key": "dashboard.stats.escrow.footnote", "ns": "seller", "defaultValue": "ปล่อยเมื่อผู้ซื้อยืนยันรับสินค้า"}
// @tolgee-key {"key": "dashboard.stats.rating.label", "ns": "seller", "defaultValue": "คะแนนร้านค้า"}
// @tolgee-key {"key": "dashboard.stats.rating.none", "ns": "seller", "defaultValue": "ยังไม่มีรีวิว"}
// @tolgee-key {"key": "dashboard.stats.rating.count", "ns": "seller", "defaultValue": "จาก {count} รีวิว"}
// @tolgee-key {"key": "dashboard.stats.withdrawable.label", "ns": "seller", "defaultValue": "ยอดเงินพร้อมถอน"}
// @tolgee-key {"key": "dashboard.stats.withdrawable.footnote", "ns": "seller", "defaultValue": "หักยอดที่กำลังถอนแล้ว"}
// @tolgee-key {"key": "dashboard.recentOrders.title", "ns": "seller", "defaultValue": "คำสั่งซื้อล่าสุด"}
// @tolgee-key {"key": "dashboard.recentOrders.viewAll", "ns": "seller", "defaultValue": "ดูทั้งหมด"}
// @tolgee-key {"key": "dashboard.recentOrders.empty", "ns": "seller", "defaultValue": "ยังไม่มีคำสั่งซื้อ"}
// @tolgee-key {"key": "dashboard.recentOrders.product", "ns": "seller", "defaultValue": "สินค้า"}
// @tolgee-key {"key": "dashboard.recentOrders.item", "ns": "seller", "defaultValue": "{name} · {count} ชิ้น"}
// @tolgee-key {"key": "dashboard.lowStock.title", "ns": "seller", "defaultValue": "สต็อกใกล้หมด"}
// @tolgee-key {"key": "dashboard.lowStock.subtitle", "ns": "seller", "defaultValue": "ประกาศที่เหลือไม่เกิน {count} ชิ้น · น้อยสุดก่อน"}
// @tolgee-key {"key": "dashboard.lowStock.remaining", "ns": "seller", "defaultValue": "เหลือ {count} ชิ้น"}
// @tolgee-key {"key": "dashboard.lowStock.viewAll", "ns": "seller", "defaultValue": "ดูทั้งหมด {count} รายการ"}
// @tolgee-key {"key": "dashboard.lowStock.manage", "ns": "seller", "defaultValue": "ไปหน้าจัดการสินค้า"}
// @tolgee-key {"key": "dashboard.lowStock.empty", "ns": "seller", "defaultValue": "สต็อกยังพอทุกรายการ"}
// @tolgee-key {"key": "dashboard.greeting", "ns": "seller", "defaultValue": "สวัสดี, {name} 👋"}
// @tolgee-key {"key": "dashboard.subtitle", "ns": "seller", "defaultValue": "สรุปภาพรวมร้านของคุณ · {date}"}
// @tolgee-key {"key": "dashboard.actions.viewShop", "ns": "seller", "defaultValue": "ดูหน้าร้าน"}
// @tolgee-key {"key": "dashboard.actions.createListing", "ns": "seller", "defaultValue": "+ ลงขายสินค้า"}
