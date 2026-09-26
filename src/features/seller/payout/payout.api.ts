import type { PayoutData } from "./payout.types";

/** ยอดพร้อมถอน — ใช้ทั้งในการ์ดยอดเงินและใน dialog ยืนยันการถอน */
const AVAILABLE_BALANCE = "฿3,420.00";

/**
 * ข้อมูลตัวอย่างของหน้า "ถอนเงิน" — ลอกข้อความและตัวเลขจาก
 * Figma node 432:7880 เพื่อให้เทียบหน้าจอกับดีไซน์ได้ตรง ๆ
 */
const PAYOUT_MOCK: PayoutData = {
  title: "ถอนเงิน",
  subtitle: "ยอดเงินจากการขายและประวัติการโอนเข้าบัญชีธนาคาร",

  actions: {
    downloadSummaryLabel: "ดาวน์โหลดใบสรุป",
  },

  balance: {
    label: "ยอดเงินพร้อมถอน",
    amount: AVAILABLE_BALANCE,
    withdrawLabel: "ถอนเงินตอนนี้",
    stats: [
      { id: "processing", label: "กำลังดำเนินการ", value: "฿0.00" },
      { id: "pending", label: "รอครบกำหนด", value: "฿1,850.00" },
      { id: "total-withdrawn", label: "ถอนสะสมทั้งหมด", value: "฿48,200.00" },
    ],
    scheduleNote:
      "รอบจ่ายเงินอัตโนมัติถัดไป: 20 ส.ค. 2569 · ระบบจะโอนยอดคงเหลือทั้งหมดให้อัตโนมัติทุกวันอังคาร",
  },

  bankAccount: {
    title: "บัญชีรับเงิน",
    statusLabel: "ยืนยันแล้ว",
    bankName: "ธนาคารกสิกรไทย",
    accountNumber: "xxx-x-x1234-5",
    accountNameLabel: "ชื่อบัญชี",
    accountName: "น.ส. มินตรา ทองสุข",
    changeLabel: "เปลี่ยนบัญชีธนาคาร",
    changeNote:
      "การเปลี่ยนบัญชีต้องยืนยันตัวตนใหม่ และจะระงับการถอนเงิน 3 วันทำการ",
  },

  withdraw: {
    title: "ยืนยันการถอนเงิน",
    description:
      "เงินจะเข้าบัญชีภายใน 1–2 วันทำการ ตรวจสอบเลขบัญชีให้ถูกต้องก่อนยืนยัน",
    amountLabel: "ยอดที่ถอน",
    amount: AVAILABLE_BALANCE,
    feeLabel: "ค่าธรรมเนียมการโอน",
    fee: "− ฿0.00",
    netLabel: "ยอดที่จะได้รับ",
    net: AVAILABLE_BALANCE,
    otp: {
      label: "รหัส OTP ที่ส่งไปยัง 08x-xxx-4821",
      length: 6,
      resendAfterSeconds: 180,
      resendCountdownLabel: "ส่งรหัสใหม่ได้ใน",
      resendLabel: "ส่งรหัสใหม่",
    },
    limitNote: "ทำรายการได้ 3 ครั้ง/สัปดาห์",
    cancelLabel: "ยกเลิก",
    confirmLabel: "ยืนยันถอนเงิน",
  },

  history: {
    title: "ประวัติการถอนเงิน",
    subtitle: "22 รายการ · ยอดรวม ฿48,200",
    yearPlaceholder: "เลือกปี",
    yearOptions: [
      { value: "2569", label: "ปี 2569" },
      { value: "2568", label: "ปี 2568" },
    ],
    exportLabel: "ส่งออก CSV",
    columns: {
      requestedAt: "วันที่ทำรายการ",
      id: "รหัสรายการ",
      amount: "จำนวนเงิน",
      destination: "ปลายทาง",
      status: "สถานะ",
      actions: "สลิปการโอน",
    },
    viewSlipLabel: "ดูสลิป",
    rows: [
      {
        id: "WD-2569-0812",
        requestedAt: "10 ส.ค. 2569 · 14:22",
        amount: "฿5,000.00",
        destination: "กสิกรไทย xxx-x-x1234-5",
        status: "success",
        statusLabel: "โอนสำเร็จ",
      },
      {
        id: "WD-2569-0788",
        requestedAt: "28 ก.ค. 2569 · 09:15",
        amount: "฿8,200.00",
        destination: "กสิกรไทย xxx-x-x1234-5",
        status: "success",
        statusLabel: "โอนสำเร็จ",
      },
      {
        id: "WD-2569-0751",
        requestedAt: "15 ก.ค. 2569 · 11:40",
        amount: "฿3,500.00",
        destination: "กสิกรไทย xxx-x-x1234-5",
        status: "success",
        statusLabel: "โอนสำเร็จ",
      },
      {
        id: "WD-2569-0719",
        requestedAt: "02 ก.ค. 2569 · 16:08",
        amount: "฿2,100.00",
        destination: "กสิกรไทย xxx-x-x1234-5",
        status: "success",
        statusLabel: "โอนสำเร็จ",
      },
      {
        id: "WD-2569-0684",
        requestedAt: "18 มิ.ย. 2569 · 10:33",
        amount: "฿4,800.00",
        destination: "กสิกรไทย xxx-x-x1234-5",
        status: "success",
        statusLabel: "โอนสำเร็จ",
      },
      {
        id: "WD-2569-0642",
        requestedAt: "05 มิ.ย. 2569 · 13:57",
        amount: "฿1,200.00",
        destination: "กสิกรไทย xxx-x-x9876-1",
        status: "cancelled",
        statusLabel: "ยกเลิก",
      },
    ],
  },
};

/**
 * จุดต่อข้อมูลของหน้าถอนเงิน — ตอนนี้คืนข้อมูลจำลอง
 * วันที่ต่อ API จริงให้แก้เฉพาะข้างในฟังก์ชันนี้ component ทุกตัวไม่ต้องแตะ
 */
export function getPayoutData(): PayoutData {
  return PAYOUT_MOCK;
}
