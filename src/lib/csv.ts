/**
 * ดาวน์โหลดตารางเป็นไฟล์ CSV ฝั่งเบราว์เซอร์ — ใส่ BOM ไว้ให้ Excel อ่านภาษาไทยถูก
 * ทุกช่องครอบด้วย "" เสมอ ข้อความที่มีจุลภาคหรือขึ้นบรรทัดใหม่จึงไม่แตกคอลัมน์
 */
export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const csv =
    "﻿" +
    rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
