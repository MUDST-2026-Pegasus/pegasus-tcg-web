import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

/**
 * แยกโค้ดของหน้าออกเป็น chunk ของตัวเอง แล้วโชว์ skeleton ระหว่างโหลด
 *
 * ```tsx
 * const CartPage = lazyPage(
 *   () => import("@/features/cart/pages/CartPage").then((m) => m.CartPage),
 *   <FormPageSkeleton />,
 * );
 * ```
 *
 * ใช้ใน route ได้เหมือน component ปกติ (`<CartPage />`, ส่ง props / key ได้)
 * fallback ควรเป็นโครงเดียวกับ skeleton ข้างในหน้า ภาพจะได้ต่อกันไม่กระโดด
 */
export function lazyPage<P extends object>(
  load: () => Promise<ComponentType<P>>,
  fallback: ReactNode,
) {
  const Page = lazy(() =>
    load().then(
      (component) => ({ default: component }),
      reloadOnceOnChunkError,
    ),
  );

  function LazyPage(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Page {...props} />
      </Suspense>
    );
  }

  return LazyPage;
}

const RELOAD_KEY = "pegasus:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

/**
 * หลัง deploy ใหม่ ชื่อไฟล์ chunk เปลี่ยน แท็บที่เปิดค้างไว้จะโหลดหน้าถัดไปไม่ได้
 * — รีโหลดทั้งหน้าหนึ่งครั้งเพื่อดึง index ใหม่ ระหว่างนั้น skeleton ยังโชว์อยู่
 * ถ้าเพิ่งรีโหลดไปแล้วยังพังอีก (เน็ตหลุด / server ล่ม) ปล่อย error ให้ RouteError แสดงแทน
 */
function reloadOnceOnChunkError(error: unknown): Promise<never> {
  let lastReload: number;
  try {
    lastReload = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
  } catch {
    // storage ถูกปิด — ไม่รีโหลดอัตโนมัติ กันวนไม่รู้จบ
    throw error;
  }

  if (Date.now() - lastReload < RELOAD_COOLDOWN_MS) throw error;

  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    throw error;
  }
  window.location.reload();
  // ค้าง promise ไว้จนหน้ารีโหลด จะได้ไม่กระพริบหน้า error ก่อน
  return new Promise<never>(() => {});
}
