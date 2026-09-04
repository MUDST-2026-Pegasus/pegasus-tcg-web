import { getSellerProfile } from "../shared/seller.api";

import type { ShopData } from "./shop.types";

const profile = getSellerProfile();

/**
 * ข้อมูลตัวอย่างของหน้า "จัดการร้านค้า" — ลอกข้อความและตัวเลขจาก
 * Figma node 432:7057 เพื่อให้เทียบหน้าจอกับดีไซน์ได้ตรง ๆ
 */
const SHOP_MOCK: ShopData = {
  title: "จัดการร้านค้า",
  subtitle: "ข้อมูลร้าน นโยบายการขาย และบัญชีรับเงิน",

  actions: {
    cancelLabel: "ยกเลิก",
    saveLabel: "บันทึกการเปลี่ยนแปลง",
  },

  completeness: {
    percent: 85,
    title: "โปรไฟล์ร้านค้าสมบูรณ์ 85%",
    remainingLabel: "เหลืออีก 2 ขั้นตอน",
    description: "ร้านที่มีข้อมูลครบถ้วนมีโอกาสถูกค้นพบมากกว่า 40%",
  },

  info: {
    title: "ข้อมูลร้านค้า",
    description: "ข้อมูลนี้จะแสดงบนหน้าร้านของคุณ",
    fields: [
      {
        id: "shop-name",
        label: "ชื่อร้านค้า",
        value: `${profile.username} Cards`,
        helper: "ชื่อที่ผู้ซื้อเห็น เปลี่ยนได้ 1 ครั้งต่อ 30 วัน",
      },
      {
        id: "shop-description",
        label: "คำอธิบายร้าน",
        value: "ร้านการ์ด Pokémon และ One Piece ของแท้ 100% ส่งไว",
        helper: "สูงสุด 200 ตัวอักษร",
      },
      {
        id: "shipping-time",
        label: "เวลาจัดส่งโดยประมาณ",
        value: "1–2 วันทำการ",
        helper: "แสดงบนหน้าสินค้าทุกชิ้น",
      },
    ],
  },

  policies: {
    title: "นโยบายร้านค้า",
    description: "ผู้ซื้อต้องยอมรับก่อนสั่งซื้อ",
    items: [
      {
        id: "returns",
        title: "รับคืนสินค้าภายใน 7 วัน",
        description: "เฉพาะกรณีสินค้าไม่ตรงตามที่ระบุ",
        enabled: true,
      },
      {
        id: "authenticity",
        title: "รับประกันความแท้ของการ์ด",
        description: "คืนเงินเต็มจำนวนหากพิสูจน์ได้ว่าปลอม",
        enabled: true,
      },
      {
        id: "free-shipping",
        title: "ส่งฟรีเมื่อซื้อครบ ฿1,000",
        description: "คิดค่าส่ง ฿50 หากไม่ถึงยอด",
        enabled: true,
      },
      {
        id: "pre-order",
        title: "รับจองสินค้าล่วงหน้า (Pre-order)",
        description: "ยังไม่เปิดใช้งาน",
        enabled: false,
      },
    ],
  },

  preview: {
    label: "ตัวอย่างหน้าร้านที่ผู้ซื้อเห็น",
    shopName: `${profile.username} Cards`,
    description: "ร้านการ์ด Pokémon และ One Piece ของแท้ 100% ส่งไว",
    initials: profile.initials,
    stats: [
      { id: "rating", value: "4.8 ★", label: "คะแนน" },
      { id: "reviews", value: "312", label: "รีวิว" },
      { id: "products", value: "142", label: "สินค้า" },
      { id: "followers", value: "1.2k", label: "ผู้ติดตาม" },
    ],
    tags: [
      { id: "fast-shipping", label: "ส่งไว 1–2 วัน" },
      { id: "returns", label: "รับคืน 7 วัน" },
      { id: "authenticity", label: "รับประกันของแท้" },
    ],
  },

  verification: {
    title: "การยืนยันตัวตน",
    statusLabel: "ยืนยันแล้ว",
    items: [
      { id: "id-card", label: "บัตรประชาชน", verified: true },
      {
        id: "bank-account",
        label: "บัญชีธนาคาร · กสิกรไทย xxx-x-x1234-5",
        verified: true,
      },
      { id: "return-address", label: "ที่อยู่จัดส่งคืน", verified: true },
      {
        id: "business-registration",
        label: "ทะเบียนพาณิชย์ (ถ้ามี)",
        verified: false,
      },
    ],
  },
};

/**
 * จุดต่อข้อมูลของหน้าจัดการร้านค้า — ตอนนี้คืนข้อมูลจำลอง
 * วันที่ต่อ API จริงให้แก้เฉพาะข้างในฟังก์ชันนี้ component ทุกตัวไม่ต้องแตะ
 */
export function getShopData(): ShopData {
  return SHOP_MOCK;
}
