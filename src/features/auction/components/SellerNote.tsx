import { MessageSquare } from "lucide-react";
import { useTranslate } from "@/lib/i18n";

/** "หมายเหตุจากผู้ขาย" — ไม่มีข้อความก็ไม่แสดงกล่อง */
export function SellerNote({ note }: { note: string | null }) {
  const { t } = useTranslate("auction");
  if (!note?.trim()) return null;
  return (
    <section className="rounded-2xl border bg-slate-50 px-4 py-3">
      <h2 className="flex items-center gap-1.5 text-sm font-bold">
        <MessageSquare aria-hidden className="size-4" />
        {t("buyer.sellerNote.text", "หมายเหตุจากผู้ขาย")}
      </h2>
      <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{note}</p>
    </section>
  );
}
