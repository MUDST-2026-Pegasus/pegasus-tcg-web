import { translate } from "@/lib/i18n";
/**
 * `code` เป็นตัวย่อของธนาคาร (ไม่เกิน 10 ตัวอักษรตาม `bank_code` ใน DB)
 * ส่วน `name` ส่งไปด้วยเป็น `bankName` ให้ admin อ่านได้ทันที
 */
export const THAI_BANKS = [
  { code: "BBL", get name() { return translate("seller", "application.banks.BBL", "ธนาคารกรุงเทพ"); } },
  { code: "KBANK", get name() { return translate("seller", "application.banks.KBANK", "ธนาคารกสิกรไทย"); } },
  { code: "KTB", get name() { return translate("seller", "application.banks.KTB", "ธนาคารกรุงไทย"); } },
  { code: "SCB", get name() { return translate("seller", "application.banks.SCB", "ธนาคารไทยพาณิชย์"); } },
  { code: "BAY", get name() { return translate("seller", "application.banks.BAY", "ธนาคารกรุงศรีอยุธยา"); } },
  { code: "TTB", get name() { return translate("seller", "application.banks.TTB", "ธนาคารทหารไทยธนชาต"); } },
  { code: "GSB", get name() { return translate("seller", "application.banks.GSB", "ธนาคารออมสิน"); } },
  { code: "BAAC", get name() { return translate("seller", "application.banks.BAAC", "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร"); } },
  { code: "GHB", get name() { return translate("seller", "application.banks.GHB", "ธนาคารอาคารสงเคราะห์"); } },
  { code: "KKP", get name() { return translate("seller", "application.banks.KKP", "ธนาคารเกียรตินาคินภัทร"); } },
  { code: "CIMBT", get name() { return translate("seller", "application.banks.CIMBT", "ธนาคารซีไอเอ็มบี ไทย"); } },
  { code: "TISCO", get name() { return translate("seller", "application.banks.TISCO", "ธนาคารทิสโก้"); } },
  { code: "UOBT", get name() { return translate("seller", "application.banks.UOBT", "ธนาคารยูโอบี"); } },
  { code: "LHB", get name() { return translate("seller", "application.banks.LHB", "ธนาคารแลนด์ แอนด์ เฮ้าส์"); } },
  { code: "ICBCT", get name() { return translate("seller", "application.banks.ICBCT", "ธนาคารไอซีบีซี (ไทย)"); } },
  { code: "IBANK", get name() { return translate("seller", "application.banks.IBANK", "ธนาคารอิสลามแห่งประเทศไทย"); } },
];

/** value → label ให้ `<Select items>` ไม่งั้น SelectValue จะโชว์รหัสดิบแทนชื่อธนาคาร */
// getter — แปลตอนอ่าน (ตอน render) ไม่ใช่ตอนโหลด module
export const BANK_ITEMS: Record<string, string> = Object.defineProperties(
  {},
  Object.fromEntries(THAI_BANKS.map((bank) => [bank.code, { get: () => bank.name, enumerable: true }])),
);

export function bankBookRequirements(): string[] {
  return [
    translate("seller", "application.bankBook.requirement.accountName", "ชื่อบัญชี (ตรงกับชื่อด้านบน)"),
    translate("seller", "application.bankBook.requirement.accountNumber", "เลขที่บัญชี"),
    translate("seller", "application.bankBook.requirement.bankName", "ชื่อธนาคารหรือโลโก้"),
  ];
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "application.banks.BBL", "ns": "seller", "defaultValue": "ธนาคารกรุงเทพ"}
// @tolgee-key {"key": "application.banks.KBANK", "ns": "seller", "defaultValue": "ธนาคารกสิกรไทย"}
// @tolgee-key {"key": "application.banks.KTB", "ns": "seller", "defaultValue": "ธนาคารกรุงไทย"}
// @tolgee-key {"key": "application.banks.SCB", "ns": "seller", "defaultValue": "ธนาคารไทยพาณิชย์"}
// @tolgee-key {"key": "application.banks.BAY", "ns": "seller", "defaultValue": "ธนาคารกรุงศรีอยุธยา"}
// @tolgee-key {"key": "application.banks.TTB", "ns": "seller", "defaultValue": "ธนาคารทหารไทยธนชาต"}
// @tolgee-key {"key": "application.banks.GSB", "ns": "seller", "defaultValue": "ธนาคารออมสิน"}
// @tolgee-key {"key": "application.banks.BAAC", "ns": "seller", "defaultValue": "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร"}
// @tolgee-key {"key": "application.banks.GHB", "ns": "seller", "defaultValue": "ธนาคารอาคารสงเคราะห์"}
// @tolgee-key {"key": "application.banks.KKP", "ns": "seller", "defaultValue": "ธนาคารเกียรตินาคินภัทร"}
// @tolgee-key {"key": "application.banks.CIMBT", "ns": "seller", "defaultValue": "ธนาคารซีไอเอ็มบี ไทย"}
// @tolgee-key {"key": "application.banks.TISCO", "ns": "seller", "defaultValue": "ธนาคารทิสโก้"}
// @tolgee-key {"key": "application.banks.UOBT", "ns": "seller", "defaultValue": "ธนาคารยูโอบี"}
// @tolgee-key {"key": "application.banks.LHB", "ns": "seller", "defaultValue": "ธนาคารแลนด์ แอนด์ เฮ้าส์"}
// @tolgee-key {"key": "application.banks.ICBCT", "ns": "seller", "defaultValue": "ธนาคารไอซีบีซี (ไทย)"}
// @tolgee-key {"key": "application.banks.IBANK", "ns": "seller", "defaultValue": "ธนาคารอิสลามแห่งประเทศไทย"}
// @tolgee-key {"key": "application.bankBook.requirement.accountName", "ns": "seller", "defaultValue": "ชื่อบัญชี (ตรงกับชื่อด้านบน)"}
// @tolgee-key {"key": "application.bankBook.requirement.accountNumber", "ns": "seller", "defaultValue": "เลขที่บัญชี"}
// @tolgee-key {"key": "application.bankBook.requirement.bankName", "ns": "seller", "defaultValue": "ชื่อธนาคารหรือโลโก้"}
