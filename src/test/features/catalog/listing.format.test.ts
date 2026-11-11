import { describe, expect, it } from "vitest";

import { formatListingDelivery, formatListingPrice, formatSellerReputation } from "@/features/catalog/listing.format";
import type { PublicListingDto } from "@/features/catalog/catalog.types";

const seller: PublicListingDto["seller"] = {
  username: "shop", displayName: "Shop", avatarUrl: null,
  verified: true, ratingAvg: 4.94, ratingCount: 17, salesCount: 1200,
};

const delivery: PublicListingDto["delivery"] = {
  fastestEstDaysMin: 1, fastestEstDaysMax: 2, freeShipping: false, optionCount: 1,
};

describe("market listing formatters", () => {
  it("formats rating to one decimal and abbreviates sales", () => {
    expect(formatSellerReputation(seller)).toBe("★ 4.9 · ขายแล้ว 1.2k ชิ้น");
    expect(formatSellerReputation({ ...seller, salesCount: 50 })).toBe("★ 4.9 · ขายแล้ว 50 ชิ้น");
    expect(formatSellerReputation({ ...seller, salesCount: 0 })).toBe("★ 4.9 · ขายแล้ว 0 ชิ้น");
  });

  it("never shows a zero-star rating for a new seller", () => {
    expect(formatSellerReputation({ ...seller, ratingAvg: null, ratingCount: 0, salesCount: 0 })).toBe("ร้านใหม่");
    expect(formatSellerReputation({ ...seller, ratingAvg: null, ratingCount: 0, salesCount: 12 })).toBe("ขายแล้ว 12 ชิ้น");
  });

  it("formats delivery according to the available active options", () => {
    expect(formatListingDelivery(delivery)).toBe("ส่งภายใน 1–2 วัน");
    expect(formatListingDelivery({ ...delivery, fastestEstDaysMax: 1 })).toBe("ส่งพรุ่งนี้");
    expect(formatListingDelivery({ ...delivery, fastestEstDaysMin: 3, fastestEstDaysMax: 3 })).toBe("ส่งภายใน 3 วัน");
    expect(formatListingDelivery({ ...delivery, freeShipping: true })).toBe("ส่งฟรี");
    expect(formatListingDelivery({ ...delivery, optionCount: 0, freeShipping: true })).toBe("ยังไม่ตั้งค่าการจัดส่ง");
    expect(formatListingDelivery({ ...delivery, fastestEstDaysMin: null, fastestEstDaysMax: null })).toBe("จัดส่งตามเงื่อนไขร้าน");
  });

  it("formats row prices without a currency symbol", () => {
    expect(formatListingPrice(12900)).toBe("12,900");
  });
});
