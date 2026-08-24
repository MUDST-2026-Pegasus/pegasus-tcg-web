import type { AdminOverviewData } from "@/features/admin/admin.types";

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
