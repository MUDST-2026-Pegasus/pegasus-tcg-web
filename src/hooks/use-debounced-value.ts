import { useEffect, useState } from "react";

/** ค่าที่ตามหลัง `value` ไป `delay` ms — เปลี่ยนก่อนครบเวลาก็นับใหม่ */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
