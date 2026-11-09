import type { Message } from "@/lib/i18n/message";
import { useEffect, useId, useSyncExternalStore } from "react";

/** ใส่ใน `handle` ของ route: `{ path: "cart", handle: { title: "ตะกร้าสินค้า" } }` */
export interface RouteHandle {
  /** msg("routes.title.<page>", "ชื่อไทย") ให้เปลี่ยนตามภาษา — string ธรรมดาก็ได้ (ไม่แปล) */
  title?: Message | string;
}

export const SITE_NAME = "Pegasus TCG";

/** จุดเดียวที่จัดรูปชื่อแท็บ — การ์ด i18n (TCG-543) ต่อยอดตรงนี้ */
export function formatPageTitle(title?: string): string {
  return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}

// override จากข้อมูล API — เก็บเจ้าของไว้ เพื่อให้หน้าที่ unmount แล้วล้างได้เฉพาะของตัวเอง
let override: { owner: string; title: string } | null = null;
const listeners = new Set<() => void>();

function setOverride(next: typeof override) {
  override = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getOverride = () => override?.title;

/** ตั้งชื่อแท็บจากข้อมูล (undefined ระหว่างโหลด = ใช้ handle.title ของ route) */
export function usePageTitle(title: string | undefined) {
  const owner = useId();
  useEffect(() => {
    if (!title) return;
    setOverride({ owner, title });
    return () => {
      if (override?.owner === owner) setOverride(null);
    };
  }, [owner, title]);
}

/** override ปัจจุบัน — ให้ PageTitleSync อ่าน */
export function usePageTitleOverride() {
  return useSyncExternalStore(subscribe, getOverride);
}
