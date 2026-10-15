import { format } from "date-fns";
import { th } from "date-fns/locale";

/**
 * คำนวณเปอร์เซ็นต์รีวิวเชิงบวก (4–5 ดาว)
 * ป้องกันการหารด้วยศูนย์ หากยังไม่มีรีวิว ให้คืนค่าเป็น null
 */
export function calculatePositivePercent(
  count4 = 0,
  count5 = 0,
  ratingCount = 0,
): number | null {
  if (!ratingCount || ratingCount <= 0) {
    return null;
  }
  return Math.round(((count4 + count5) / ratingCount) * 100);
}

/**
 * รูปแบบวันที่ในรีวิวตามดีไซน์ เช่น "12 ต.ค. 2026"
 */
export function formatReviewDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${format(date, "d MMM", { locale: th })} ${date.getFullYear()}`;
  } catch {
    return dateString;
  }
}

/**
 * อักษรย่อสำหรับ Avatar Fallback เช่น "CardVault BKK" -> "CV", "pokepanda" -> "PO"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "";
  const clean = name.trim();
  if (!clean) return "";

  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    const uppers = clean.replace(/[^A-Z]/g, "");
    if (uppers.length >= 2) return uppers.slice(0, 2);
    return clean.slice(0, 2).toUpperCase();
  }

  // If first word has multiple capitals (like "CardVault BKK"), prefer "CV"
  const firstWordUppers = parts[0].replace(/[^A-Z]/g, "");
  if (firstWordUppers.length >= 2) {
    return firstWordUppers.slice(0, 2);
  }

  return parts
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
