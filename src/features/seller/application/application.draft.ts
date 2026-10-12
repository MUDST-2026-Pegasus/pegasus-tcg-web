import { z } from "zod";

/**
 * ฉบับร่างของฟอร์มสมัครผู้ขาย เก็บใน localStorage แยกตามผู้ใช้
 *
 * เก็บแค่ชื่อกับธนาคาร — เลขบัญชีกับรูปสมุดบัญชีไม่ค้างไว้ในเครื่อง
 * เผื่อเป็นเครื่องที่ใช้ร่วมกับคนอื่น
 */
const draftSchema = z
  .object({
    legalFirstName: z.string(),
    legalLastName: z.string(),
    bankCode: z.string(),
  })
  .partial();

export type SellerApplicationDraft = z.infer<typeof draftSchema>;

const draftKey = (userId: number) =>
  `pegasus:seller-application-draft:${userId}`;

export function readDraft(userId: number): SellerApplicationDraft {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    const parsed = draftSchema.safeParse(raw ? JSON.parse(raw) : {});
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function saveDraft(userId: number, draft: SellerApplicationDraft) {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify(draft));
  } catch {
    // storage เต็มหรือถูกบล็อก — ไม่มีฉบับร่างก็ยังกรอกต่อได้
  }
}

export function clearDraft(userId: number) {
  try {
    localStorage.removeItem(draftKey(userId));
  } catch {
    // เหมือน saveDraft
  }
}
