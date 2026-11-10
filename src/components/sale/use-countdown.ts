import { useEffect, useRef, useState } from "react";

/**
 * นับถอยหลังถึง `target` (ISO จาก server) ทุก 1 วินาที — คืนมิลลิวินาทีที่เหลือ
 * `onDone` ถูกเรียกครั้งเดียวตอนถึง 0 (ใช้ refetch หน้าแรก / listing)
 */
export function useCountdown(target: string | null | undefined, onDone?: () => void): number {
  const end = target ? Date.parse(target) : NaN;
  const [now, setNow] = useState(() => Date.now());
  const doneRef = useRef(onDone);
  const firedRef = useRef<number | null>(null);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!Number.isFinite(end)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [end]);

  const left = Number.isFinite(end) ? Math.max(0, end - now) : 0;

  useEffect(() => {
    if (!Number.isFinite(end) || left > 0 || firedRef.current === end) return;
    firedRef.current = end;
    doneRef.current?.();
  }, [end, left]);

  return left;
}
