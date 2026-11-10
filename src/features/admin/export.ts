import { useCallback, useRef, useState } from "react";

import { toast } from "@/components/ui/toast";
import { hasErrorCode } from "@/lib/api";
import { errorMessage, translate, translateError } from "@/lib/i18n";

// @tolgee-key {"key":"EXPORT_TOO_LARGE","ns":"errors","defaultValue":"ข้อมูลมากเกินไป กรุณาลดช่วงหรือเพิ่มตัวกรอง"}
// @tolgee-key {"key":"export.success","ns":"admin","defaultValue":"ดาวน์โหลดไฟล์สำเร็จ"}
// @tolgee-key {"key":"export.failed","ns":"admin","defaultValue":"ส่งออกไฟล์ไม่สำเร็จ"}
// @tolgee-key {"key":"export.retry","ns":"admin","defaultValue":"กรุณาลองใหม่อีกครั้ง"}

/** ข้อความใต้ toast เมื่อส่งออกไม่สำเร็จ — `EXPORT_TOO_LARGE` บอกให้ลดช่วง ที่เหลือแปลตาม error code */
export function exportErrorMessage(error: unknown): string {
  if (hasErrorCode(error, "EXPORT_TOO_LARGE")) {
    return errorMessage("EXPORT_TOO_LARGE", "ข้อมูลมากเกินไป กรุณาลดช่วงหรือเพิ่มตัวกรอง");
  }
  return translateError(error, translate("admin", "export.retry", "กรุณาลองใหม่อีกครั้ง"));
}

/**
 * สถานะของปุ่มส่งออกไฟล์ [TCG-749] — ระหว่างสร้างไฟล์ `pending` เป็น true และกดซ้ำไม่มีผล
 * `task` ต้องดาวน์โหลดไฟล์เองตอนท้ายสุด: ถ้า throw ก่อนถึงตรงนั้นจะไม่มีไฟล์ครึ่ง ๆ ออกไป
 */
export function useFileExport() {
  const [pending, setPending] = useState(false);
  // `pending` อัปเดตหลังเรนเดอร์รอบถัดไป คลิกซ้อนในจังหวะนั้นต้องกันด้วย ref
  const inFlight = useRef(false);

  const run = useCallback(async (task: () => Promise<void>): Promise<boolean> => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setPending(true);
    try {
      await task();
      toast.add({ type: "success", title: translate("admin", "export.success", "ดาวน์โหลดไฟล์สำเร็จ") });
      return true;
    } catch (error) {
      toast.add({
        type: "error",
        title: translate("admin", "export.failed", "ส่งออกไฟล์ไม่สำเร็จ"),
        description: exportErrorMessage(error),
      });
      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, []);

  return { pending, run };
}
