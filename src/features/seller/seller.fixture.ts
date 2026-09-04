import {
  Eye,
  MessageSquare,
  ShoppingBag,
  Star,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import type {
  SellerDashboardData,
  SellerProfile,
  SellerShopData,
} from "@/features/seller/seller.types";

/**
 * ข้อมูลผู้ขายตัวอย่าง ใช้ทั้งใน sidebar footer และหัวหน้าแดชบอร์ด
 * เมื่อต่อ API auth จริงแล้วให้แทนที่ก้อนนี้ด้วยข้อมูล session ของผู้ใช้
 */
export const SELLER_PROFILE_FIXTURE: SellerProfile = {
  username: "minmin_tcg",
  initials: "MM",
  verifiedLabel: "ผู้ขายที่ยืนยันแล้ว",
};

/**
 * ข้อมูลตัวอย่างของหน้า "แดชบอร์ดผู้ขาย" — ลอกข้อความและตัวเลขจาก
 * Figma node 432:6773 เพื่อให้เทียบหน้าจอกับดีไซน์ได้ตรง ๆ
 * เมื่อต่อ API จริงแล้วให้แทนที่ทั้งก้อนนี้
 */
export const SELLER_DASHBOARD_FIXTURE: SellerDashboardData = {
  greeting: `สวัสดี, ${SELLER_PROFILE_FIXTURE.username} 👋`,
  subtitle: "สรุปภาพรวมร้านของคุณ · วันพฤหัสบดีที่ 14 สิงหาคม 2569",

  actions: {
    viewShopLabel: "ดูหน้าร้าน",
    createListingLabel: "+ ลงขายสินค้า",
  },

  sales: {
    label: "ยอดขายเดือนสิงหาคม",
    amount: "฿24,850",
    delta: "+12.0%",
    description: "จาก 56 คำสั่งซื้อ · เฉลี่ย ฿443 ต่อออเดอร์",
    bars: [
      { height: 28, highlighted: false },
      { height: 36, highlighted: false },
      { height: 28, highlighted: false },
      { height: 44, highlighted: false },
      { height: 36, highlighted: false },
      { height: 48, highlighted: false },
      { height: 44, highlighted: false },
      { height: 56, highlighted: false },
      { height: 48, highlighted: false },
      { height: 64, highlighted: true },
      { height: 56, highlighted: true },
      { height: 64, highlighted: true },
    ],
    rangeStart: "ก.ย. 68",
    rangeEnd: "ส.ค. 69",
  },

  todo: {
    title: "สิ่งที่ต้องทำวันนี้",
    description: "4 รายการรอดำเนินการ",
    count: 4,
    items: [
      {
        id: "pack-orders",
        icon: ShoppingBag,
        accent: "red",
        title: "แพ็คและจัดส่งคำสั่งซื้อ",
        description: "8 ออเดอร์รอจัดส่ง",
      },
      {
        id: "restock",
        icon: TriangleAlert,
        accent: "amber",
        title: "เติมสต็อกสินค้าที่ใกล้หมด",
        description: "6 รายการเหลือน้อยกว่า 3 ใบ",
      },
      {
        id: "buyer-questions",
        icon: MessageSquare,
        accent: "primary",
        title: "ตอบคำถามจากผู้ซื้อ",
        description: "3 ข้อความยังไม่ได้อ่าน",
      },
      {
        id: "reviews",
        icon: Star,
        accent: "gray",
        title: "ตอบกลับรีวิวใหม่",
        description: "2 รีวิวเดือนนี้",
      },
    ],
  },

  stats: [
    {
      id: "listings",
      icon: ShoppingBag,
      accent: "primary",
      label: "สินค้าที่ลงขาย",
      value: "142",
      footnote: "+5 เดือนนี้",
    },
    {
      id: "views",
      icon: Eye,
      accent: "violet",
      label: "ยอดเข้าชมสินค้า",
      value: "8,420",
      footnote: "+320 สัปดาห์นี้",
    },
    {
      id: "rating",
      icon: Star,
      accent: "amber",
      label: "คะแนนร้านค้า",
      value: "4.8 / 5.0",
      footnote: "จาก 312 รีวิว",
    },
    {
      id: "withdrawable",
      icon: Wallet,
      accent: "green",
      label: "ยอดเงินพร้อมถอน",
      value: "฿3,420",
      footnote: "อัปเดตทุกวัน",
    },
  ],

  recentOrders: {
    title: "คำสั่งซื้อล่าสุด",
    actionLabel: "ดูทั้งหมด",
    items: [
      {
        id: "ORD-10241",
        buyer: "nattapong_p",
        item: "Charizard ex ×1",
        price: "฿1,850",
        status: "awaiting_pack",
        statusLabel: "รอแพ็ค",
      },
      {
        id: "ORD-10238",
        buyer: "kandypop",
        item: "Luffy Gear 5 ×2",
        price: "฿3,420",
        status: "shipped",
        statusLabel: "จัดส่งแล้ว",
      },
      {
        id: "ORD-10233",
        buyer: "sora.trades",
        item: "Pikachu VMAX ×1",
        price: "฿640",
        status: "awaiting_payment",
        statusLabel: "รอชำระ",
      },
      {
        id: "ORD-10229",
        buyer: "pika.hunter",
        item: "Mewtwo V ×1",
        price: "฿990",
        status: "completed",
        statusLabel: "สำเร็จ",
      },
    ],
  },

  lowStock: {
    title: "สต็อกใกล้หมด",
    count: 6,
    items: [
      {
        id: "luffy-gear-5-parallel",
        name: "Luffy Gear 5 — Parallel",
        remainingLabel: "เหลือ 3",
        percent: 34,
        severity: "warning",
      },
      {
        id: "rookie-serial-99",
        name: "2024 Rookie Serial /99",
        remainingLabel: "เหลือ 1",
        percent: 10,
        severity: "critical",
      },
      {
        id: "gengar-vmax-full-art",
        name: "Gengar VMAX — Full Art",
        remainingLabel: "เหลือ 2",
        percent: 20,
        severity: "warning",
      },
      {
        id: "mewtwo-v-alt-art",
        name: "Mewtwo V — Alt Art",
        remainingLabel: "เหลือ 2",
        percent: 20,
        severity: "warning",
      },
      {
        id: "scarlet-violet-pack",
        name: "Scarlet & Violet Pack",
        remainingLabel: "เหลือ 3",
        percent: 34,
        severity: "warning",
      },
    ],
    actionLabel: "เติมสต็อกทั้งหมด",
  },
};

/**
 * ข้อมูลตัวอย่างของหน้า "จัดการร้านค้า" — ลอกข้อความและตัวเลขจาก
 * Figma node 432:7057 เพื่อให้เทียบหน้าจอกับดีไซน์ได้ตรง ๆ
 * เมื่อต่อ API จริงแล้วให้แทนที่ทั้งก้อนนี้
 */
export const SELLER_SHOP_FIXTURE: SellerShopData = {
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
        value: "minmin_tcg Cards",
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
    shopName: SELLER_PROFILE_FIXTURE.username + " Cards",
    description: "ร้านการ์ด Pokémon และ One Piece ของแท้ 100% ส่งไว",
    initials: SELLER_PROFILE_FIXTURE.initials,
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
