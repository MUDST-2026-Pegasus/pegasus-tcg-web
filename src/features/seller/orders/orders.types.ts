import type { OrderStatus } from "@/features/seller/shared/seller.types";

export type PaymentStatus = "paid" | "pending" | "refunded";

export type OrderFilter = {
  id: OrderStatus;
  label: string;
  /** จำนวนออเดอร์ทั้งหมดของสถานะนี้ (ไม่ใช่จำนวนการ์ดที่แสดงอยู่) */
  count: number;
};

export type OrderLine = {
  id: string;
  /** "shipping" = บรรทัดค่าจัดส่ง ใช้ไอคอนถุงแทนรูปสินค้า */
  kind: "product" | "shipping";
  name: string;
  /** บรรทัดรองใต้ชื่อ เช่น "Near Mint ×1" — บรรทัดค่าจัดส่งไม่มี */
  meta?: string;
  price: string;
};

export type SellerOrder = {
  id: string;
  buyer: string;
  /** เช่น "สั่งเมื่อ 2 ชม. ที่แล้ว" */
  orderedAtLabel: string;
  total: string;
  status: OrderStatus;
  payment: {
    status: PaymentStatus;
    label: string;
  };
  /** มีค่า = ออเดอร์ใกล้เลยกำหนดส่ง โชว์เป็น badge และกรอบสีส้มรอบการ์ด */
  urgentLabel?: string;
  lines: OrderLine[];
  address: string;
  /** มีเมื่อส่งของออกไปแล้ว (กำลังจัดส่ง / สำเร็จ) */
  shipment?: {
    carrier: string;
    trackingNumber: string;
  };
};

export type SelectOption = { value: string; label: string };

export type ShippingStep = {
  id: string;
  label: string;
  done: boolean;
};

export type SummaryRow = {
  id: string;
  label: string;
  value: string;
  /** "muted" = รายการหักออก ตัวเลขสีเทา */
  tone: "default" | "muted";
};

export type OrdersData = {
  title: string;
  subtitle: string;
  actions: {
    printAllLabel: string;
    updateStatusLabel: string;
  };
  filters: OrderFilter[];
  sort: {
    placeholder: string;
    options: SelectOption[];
  };
  card: {
    selectLabel: string;
    addressTitle: string;
    trackingPlaceholder: string;
    carrierPlaceholder: string;
    carriers: SelectOption[];
    printLabel: string;
    confirmLabel: string;
    shipmentTitle: string;
  };
  orders: SellerOrder[];
  steps: {
    title: string;
    items: ShippingStep[];
  };
  summary: {
    title: string;
    rows: SummaryRow[];
    netLabel: string;
    netValue: string;
  };
  tip: {
    title: string;
    description: string;
  };
};
