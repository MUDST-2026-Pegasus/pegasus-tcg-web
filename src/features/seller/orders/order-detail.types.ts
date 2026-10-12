import type { OrderStatus } from "@/features/seller/shared/seller.types";

import type { PaymentStatus, SelectOption } from "./orders.types";

export type PackingItem = {
  id: string;
  name: string;
  /** เช่น "Near Mint · ตำแหน่งเก็บ: กล่อง A-12" */
  meta: string;
  quantityLabel: string;
  /** ราคาต่อชิ้น */
  unitPrice: string;
};

export type TimelineEntry = {
  id: string;
  label: string;
  /** เวลาที่เกิด หรือ "กำลังดำเนินการ" / "รอดำเนินการ" */
  detail: string;
  done: boolean;
};

export type LabeledValue = {
  id: string;
  label: string;
  value: string;
};

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  statusLabel: string;
  subtitle: string;

  breadcrumb: {
    rootLabel: string;
    statusLabel: string;
  };

  /** ปุ่มมุมขวาบน — มีเฉพาะออเดอร์ที่ยังรอแพ็ค */
  actions?: {
    printLabel: string;
    confirmLabel: string;
  };

  items: {
    title: string;
    countLabel: string;
    /** true = โชว์ช่องติ๊กไว้เช็กว่าแพ็คชิ้นไหนแล้ว */
    packable: boolean;
    packedLabel: string;
    rows: PackingItem[];
  };

  shipping: {
    title: string;
    recipientTitle: string;
    copyLabel: string;
    copiedLabel: string;
    /** ชื่อ / ที่อยู่หลายบรรทัด / เบอร์โทร เรียงตามที่แสดง */
    recipientLines: string[];
    carrierLabel: string;
    trackingLabel: string;
    /** มีค่า = ยังไม่ได้ส่ง กรอกขนส่งกับเลขพัสดุได้ */
    form?: {
      carriers: SelectOption[];
      trackingPlaceholder: string;
      note: string;
    };
    /** มีค่า = ส่งของแล้ว โชว์ขนส่งกับเลขพัสดุแบบอ่านอย่างเดียว */
    shipment?: {
      carrier: string;
      trackingNumber: string;
    };
  };

  timeline: {
    title: string;
    entries: TimelineEntry[];
  };

  buyer: {
    title: string;
    username: string;
    initials: string;
    purchaseLabel: string;
    messageLabel: string;
  };

  payment: {
    title: string;
    status: PaymentStatus;
    statusLabel: string;
    slip: {
      label: string;
      /** false = ผู้ซื้อยังไม่แนบสลิป กล่องเป็นแค่ข้อความ กดไม่ได้ */
      viewable: boolean;
    };
    rows: LabeledValue[];
  };

  /** ออเดอร์ที่ยกเลิกไม่มีกำไรให้สรุป */
  profit?: {
    title: string;
    rows: LabeledValue[];
    netLabel: string;
    netValue: string;
  };
};
