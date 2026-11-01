import { describe, expect, it } from "vitest";

import {
  budgetFormula,
  budgetLabel,
  conditionDetail,
  discountCapLabel,
  maskBuyer,
  minSpendLabel,
  scopeLabel,
} from "@/features/admin/promotions.format";
import type { AdminPromotion } from "@/features/admin/promotions.types";

const names = {
  games: new Map([[3, "One Piece"]]),
  categories: new Map([[3, "Booster Box"]]),
};

describe("promotion format", () => {
  it("budgets a free-shipping code from the same cap it shows", () => {
    const freeShip = { discountType: "FREE_SHIPPING", discountValue: 0, maxDiscount: 200, usageLimitTotal: 500 } as const;
    expect(budgetLabel(freeShip)).toBe("฿100,000");
    expect(budgetFormula(freeShip)).toBe("500 × ฿200");
    expect(budgetFormula({ ...freeShip, maxDiscount: null })).toBe("500 × ฿60");
    expect(budgetLabel({ ...freeShip, maxDiscount: null })).toBe("฿30,000");
  });

  it("calls a budget unlimited when there is no cap or no usage limit", () => {
    expect(budgetLabel({ discountType: "PERCENT", discountValue: 10, maxDiscount: null, usageLimitTotal: 500 })).toBe("ไม่จำกัด");
    expect(budgetLabel({ discountType: "FIXED", discountValue: 100, maxDiscount: null, usageLimitTotal: null })).toBe("ไม่จำกัด");
  });

  it("matches the Figma table wording", () => {
    expect(minSpendLabel(0)).toBe("ไม่มีขั้นต่ำ");
    expect(minSpendLabel(1000)).toBe("ขั้นต่ำ ฿1,000");
    expect(discountCapLabel({ discountType: "FREE_SHIPPING", discountValue: 0, maxDiscount: 60 })).toBe("สูงสุด ฿60 / ร้าน");
    expect(discountCapLabel({ discountType: "FIXED", discountValue: 150, maxDiscount: null })).toBe("—");
  });

  it("names the games or categories a code covers", () => {
    expect(scopeLabel({ scopeType: "GAME", scopeIds: [3], ownerType: "PLATFORM" }, names)).toBe("เกม One Piece");
    expect(scopeLabel({ scopeType: "CATEGORY", scopeIds: [3], ownerType: "PLATFORM" }, names)).toBe("หมวด Booster Box");
    expect(scopeLabel({ scopeType: "ALL", scopeIds: [], ownerType: "SELLER" }, names)).toBe("ทุกสินค้าในร้าน");
    expect(conditionDetail({ newBuyerOnly: true } as AdminPromotion, names)).toBe("เฉพาะผู้ซื้อใหม่");
  });

  it("masks a buyer from the API party shape", () => {
    expect(maskBuyer({ id: 1, username: "thanapat", displayName: "ธนภัทร สมใจ", avatarUrl: null })).toBe("ธนภัทร ส.");
    expect(maskBuyer({ id: 2, username: "nattawut_tcg", displayName: "", avatarUrl: null })).toBe("nattawut_tcg");
  });
});
