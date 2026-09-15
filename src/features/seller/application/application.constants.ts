/**
 * `code` เป็นตัวย่อของธนาคาร (ไม่เกิน 10 ตัวอักษรตาม `bank_code` ใน DB)
 * ส่วน `name` ส่งไปด้วยเป็น `bankName` ให้ admin อ่านได้ทันที
 */
export const THAI_BANKS = [
  { code: "BBL", name: "ธนาคารกรุงเทพ" },
  { code: "KBANK", name: "ธนาคารกสิกรไทย" },
  { code: "KTB", name: "ธนาคารกรุงไทย" },
  { code: "SCB", name: "ธนาคารไทยพาณิชย์" },
  { code: "BAY", name: "ธนาคารกรุงศรีอยุธยา" },
  { code: "TTB", name: "ธนาคารทหารไทยธนชาต" },
  { code: "GSB", name: "ธนาคารออมสิน" },
  { code: "BAAC", name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร" },
  { code: "GHB", name: "ธนาคารอาคารสงเคราะห์" },
  { code: "KKP", name: "ธนาคารเกียรตินาคินภัทร" },
  { code: "CIMBT", name: "ธนาคารซีไอเอ็มบี ไทย" },
  { code: "TISCO", name: "ธนาคารทิสโก้" },
  { code: "UOBT", name: "ธนาคารยูโอบี" },
  { code: "LHB", name: "ธนาคารแลนด์ แอนด์ เฮ้าส์" },
  { code: "ICBCT", name: "ธนาคารไอซีบีซี (ไทย)" },
  { code: "IBANK", name: "ธนาคารอิสลามแห่งประเทศไทย" },
] as const;

/** value → label ให้ `<Select items>` ไม่งั้น SelectValue จะโชว์รหัสดิบแทนชื่อธนาคาร */
export const BANK_ITEMS: Record<string, string> = Object.fromEntries(
  THAI_BANKS.map((bank) => [bank.code, bank.name]),
);

export const BANK_BOOK_TYPES = ["image/jpeg", "image/png"] as const;

export const BANK_BOOK_MAX_BYTES = 5 * 1024 * 1024;

export const BANK_BOOK_REQUIREMENTS = [
  "ชื่อบัญชี (ตรงกับชื่อด้านบน)",
  "เลขที่บัญชี",
  "ชื่อธนาคารหรือโลโก้",
] as const;
