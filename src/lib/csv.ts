/**
 * ดาวน์โหลดตารางเป็นไฟล์ CSV ฝั่งเบราว์เซอร์ — ใส่ BOM ไว้ให้ Excel อ่านภาษาไทยถูก
 * ทุกช่องครอบด้วย "" เสมอ ข้อความที่มีจุลภาคหรือขึ้นบรรทัดใหม่จึงไม่แตกคอลัมน์
 */
export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** เนื้อไฟล์ที่ `downloadCsv` เขียน (BOM + CRLF) แยกออกมาให้เทสต์อ่านได้ */
export function toCsv(rows: (string | number | null)[][]): string {
  return (
    "﻿" +
    rows
      .map((row) => row.map((cell) => `"${csvCell(cell).replaceAll('"', '""')}"`).join(","))
      .join("\r\n")
  );
}

/**
 * กัน CSV formula injection (CWE-1236): ข้อความที่ขึ้นต้นด้วย = + - @ tab หรือ CR
 * Excel จะรันเป็นสูตร จึงเติม ' นำหน้า · ช่องตัวเลขไม่แตะ ยอดติดลบยังเป็นตัวเลข
 */
function csvCell(cell: string | number | null): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number") return String(cell);
  return /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
}
