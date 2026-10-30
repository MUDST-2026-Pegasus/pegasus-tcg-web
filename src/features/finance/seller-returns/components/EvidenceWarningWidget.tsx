import { AlertTriangle } from "lucide-react";

/**
 * Warning Box (ตรวจหลักฐานก่อนปฏิเสธ)
 */
export function EvidenceWarningWidget() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs space-y-1">
      <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
        <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>ตรวจหลักฐานก่อนปฏิเสธ</span>
      </div>
      <p className="text-[11px] text-amber-800/90 dark:text-amber-300 leading-relaxed">
        กดปฏิเสธแล้วแก้ไขไม่ได้ และผู้ซื้อจะเปิดคำขอของออเดอร์นี้ซ้ำไม่ได้อีก
      </p>
    </div>
  );
}
