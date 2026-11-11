import { describe, expect, it } from "vitest";

import {
  actionLabel,
  actionTone,
  actorInitials,
  changeHint,
  countImportant,
  formatDayHeading,
  formatRelative,
  groupByDay,
  metadataRows,
  rangeStart,
  targetHint,
  targetHref,
  targetLabel,
} from "@/features/admin/audit.format";
import type { AuditLogEntry } from "@/features/admin/audit.types";

const admin = { userId: 7, username: "admin_kant", displayName: "Kant Somsak" };

function entry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 1,
    occurredAt: new Date(2026, 7, 14, 9, 42).toISOString(),
    actor: admin,
    action: "SELLER_VERIFICATION_APPROVED",
    targetType: "SELLER_VERIFICATION",
    targetId: "12",
    summary: "Approved seller verification #12",
    metadata: {},
    ipAddress: null,
    ...overrides,
  };
}

describe("audit.format — action", () => {
  it("labels a known action in Thai", () => {
    expect(actionLabel(entry())).toBe("อนุมัติคำขอเปิดร้าน");
  });

  it("falls back to a readable label for an action the page does not know yet", () => {
    expect(actionLabel(entry({ action: "PROMOTION_PAUSED" }))).toBe("Promotion paused");
    expect(actionTone(entry({ action: "PROMOTION_PAUSED" }))).toBe("normal");
  });

  it("names a user status change by where it went", () => {
    const suspend = entry({ action: "USER_STATUS_CHANGED", metadata: { before: "ACTIVE", after: "SUSPENDED" } });
    const restore = entry({ action: "USER_STATUS_CHANGED", metadata: { before: "SUSPENDED", after: "ACTIVE" } });
    expect(actionLabel(suspend)).toBe("ระงับบัญชีผู้ใช้");
    expect(actionLabel(restore)).toBe("คืนสถานะบัญชีผู้ใช้");
  });

  it("treats rows without an actor as automatic and money/permission changes as important", () => {
    expect(actionTone(entry({ actor: null, action: "ORDERS_AUTO_RELEASED" }))).toBe("auto");
    expect(actionTone(entry({ action: "COMMISSION_RULE_UPDATED" }))).toBe("important");
    expect(actionTone(entry({ action: "SELLER_VERIFICATION_REJECTED" }))).toBe("attention");
  });

  it("counts only important actions from the summary", () => {
    expect(countImportant({ SETTING_UPDATED: 2, USER_ROLE_GRANTED: 1, CATALOG_PRODUCT_UPDATED: 9 })).toBe(3);
    expect(countImportant({})).toBe(0);
  });
});

describe("audit.format — actor and target", () => {
  it("builds initials from the display name, and SY for the system", () => {
    expect(actorInitials(entry())).toBe("KS");
    expect(actorInitials(entry({ actor: { userId: 1, username: "admin_kant", displayName: "" } }))).toBe("AK");
    expect(actorInitials(entry({ actor: null }))).toBe("SY");
  });

  it("uses the quoted name from the summary, the setting name, or type and id", () => {
    expect(targetLabel(entry({ targetType: "CATALOG_PRODUCT", summary: 'Updated product "Pikachu ex"' }))).toBe("Pikachu ex");
    expect(targetLabel(entry({ targetType: "SETTING", targetId: "commission.default_rate" }))).toBe("ค่าคอมมิชชั่นพื้นฐาน");
    expect(targetLabel(entry({ targetType: "USER", targetId: "42", summary: "Granted SELLER to user #42" }))).toBe("ผู้ใช้ #42");
    expect(targetLabel(entry({ targetType: "NEW_THING", targetId: "5", summary: "x" }))).toBe("New thing #5");
  });

  it("links to the page that shows the target, and nowhere for a deleted product", () => {
    expect(targetHref(entry())).toBe("/admin/sellers");
    expect(targetHref(entry({ targetType: "CATALOG_PRODUCT", action: "CATALOG_PRODUCT_UPDATED", targetId: "501" }))).toBe(
      "/admin/catalog?product=501",
    );
    expect(targetHref(entry({ targetType: "CATALOG_PRODUCT", action: "CATALOG_PRODUCT_DELETED", targetId: "501" }))).toBeNull();
    expect(
      targetHref(entry({ targetType: "CATALOG_VARIANT", action: "CATALOG_VARIANT_UPDATED", metadata: { productId: 501 } })),
    ).toBe("/admin/catalog?product=501");
    expect(targetHref(entry({ targetType: "USER", targetId: "42" }))).toBe("/admin/users?user=42");
    expect(targetHref(entry({ targetType: "SETTING", targetId: "commission.default_rate" }))).toBe("/admin/commission");
    expect(targetHref(entry({ targetType: "SETTING", targetId: "order.cancel_window_hours" }))).toBeNull();
    expect(targetHref(entry({ targetType: "UNKNOWN" }))).toBeNull();
  });
});

describe("audit.format — metadata", () => {
  it("shows a whole before/after as one row", () => {
    expect(metadataRows({ before: 5, after: 7 })).toEqual([
      { kind: "change", key: "value", label: "ค่า", before: "5", after: "7" },
    ]);
  });

  it("shows a record diff field by field, and plain values as values", () => {
    const rows = metadataRows({ ratePercent: { before: 5, after: 7 }, active: { before: true, after: false }, productId: 3 });
    expect(rows).toEqual([
      { kind: "change", key: "ratePercent", label: "อัตรา (%)", before: "5", after: "7" },
      { kind: "change", key: "active", label: "เปิดใช้งาน", before: "ใช่", after: "ไม่ใช่" },
      { kind: "value", key: "productId", label: "productId", value: "3" },
    ]);
  });

  it("hints a single short change next to the target", () => {
    expect(changeHint({ before: 5, after: 7 })).toBe("5 → 7");
    expect(changeHint({ name: { before: "a", after: "b" }, code: { before: "x", after: "y" } })).toBeNull();
    expect(changeHint({ sellerProfileId: 4 })).toBeNull();
  });
});

describe("audit.format — time", () => {
  const now = new Date(2026, 7, 14, 10, 0);

  it("says how long ago, in Thai", () => {
    expect(formatRelative(new Date(2026, 7, 14, 9, 59, 30).toISOString(), now)).toBe("เมื่อสักครู่");
    expect(formatRelative(new Date(2026, 7, 14, 9, 55).toISOString(), now)).toBe("5 นาทีที่ผ่านมา");
  });

  it("heads day groups with today and yesterday in Buddhist years", () => {
    expect(formatDayHeading(new Date(2026, 7, 14, 9).toISOString(), now)).toBe("วันนี้ · 14 สิงหาคม 2569");
    expect(formatDayHeading(new Date(2026, 7, 13, 9).toISOString(), now)).toBe("เมื่อวาน · 13 สิงหาคม 2569");
    expect(formatDayHeading(new Date(2026, 7, 10, 9).toISOString(), now)).toBe("10 สิงหาคม 2569");
  });

  it("groups rows by local day and keeps their order", () => {
    const rows = [
      entry({ id: 3, occurredAt: new Date(2026, 7, 14, 9).toISOString() }),
      entry({ id: 2, occurredAt: new Date(2026, 7, 14, 8).toISOString() }),
      entry({ id: 1, occurredAt: new Date(2026, 7, 13, 16).toISOString() }),
    ];
    const groups = groupByDay(rows, now);
    expect(groups.map((group) => group.entries.map((row) => row.id))).toEqual([[3, 2], [1]]);
    expect(groups[1].heading).toMatch(/^เมื่อวาน/);
  });

  it("starts ranges at local midnight", () => {
    expect(rangeStart("today", now)).toBe(new Date(2026, 7, 14).toISOString());
    expect(rangeStart("7d", now)).toBe(new Date(2026, 7, 8).toISOString());
    expect(rangeStart("all", now)).toBeUndefined();
  });
});

describe("audit.format — target hint", () => {
  it("names the role on a role change, and the single change otherwise", () => {
    expect(targetHint({ metadata: { role: "SUPPORT" } })).toBe("บทบาท SUPPORT");
    expect(targetHint({ metadata: { before: 5, after: 7 } })).toBe("5 → 7");
    expect(targetHint({ metadata: {} })).toBeNull();
  });
});
