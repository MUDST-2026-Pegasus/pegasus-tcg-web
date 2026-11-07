import { translate, useLanguage } from "@/lib/language";
import { MessageSquare } from "lucide-react";

/** "หมายเหตุจากผู้ขาย" — ไม่มีข้อความก็ไม่แสดงกล่อง */
export function SellerNote({ note }: { note: string | null }) {
  useLanguage();
  if (!note?.trim()) return null;
  return (
    <section className="rounded-2xl border bg-slate-50 px-4 py-3">
      <h2 className="flex items-center gap-1.5 text-sm font-bold">
        <MessageSquare aria-hidden className="size-4" />{translate("หมายเหตุจากผู้ขาย", "Seller's note")}</h2>
      <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{note}</p>
    </section>
  );
}
