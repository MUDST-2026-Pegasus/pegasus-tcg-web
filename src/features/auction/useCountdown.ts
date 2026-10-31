import { useEffect, useMemo, useState } from "react";

import { clockOffset, remainingMs } from "./auction.format";

/**
 * ms ที่เหลือจนถึง `target` อัปเดตทุกวินาที ชดเชยนาฬิกาเครื่องด้วย `serverTime` ของ response
 * หยุดเดินเมื่อหมดเวลา (ค่าเป็น 0) — ใช้กับ AuctionCountdown หรือหน้าที่ต้องรู้ว่าหมดเวลาแล้ว
 *
 * @param target     `endsAt`, `paymentDueAt`, `decideBy` ฯลฯ — `null` = ไม่นับ (คืน null)
 * @param serverTime `serverTime` จาก response เดียวกับ target
 */
export function useCountdown(target: string | null, serverTime?: string): number | null {
  // ส่วนต่างนาฬิกาคิดครั้งเดียวต่อ response ใหม่
  const offset = useMemo(() => clockOffset(serverTime), [serverTime]);
  const [now, setNow] = useState(() => Date.now());

  const remaining = target === null ? null : Math.max(0, remainingMs(target, offset, now));
  const running = remaining !== null && remaining > 0;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  return remaining;
}
