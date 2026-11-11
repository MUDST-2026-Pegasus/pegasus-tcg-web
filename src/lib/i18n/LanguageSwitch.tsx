import { useLanguage } from "@/lib/i18n/use-language";
import { useTranslate } from "@/lib/i18n/use-translate";
import { cn } from "@/lib/utils";

/** สลับ TH ⇄ EN — on = EN; จำค่าไว้ด้วย LanguageStorage และ <html lang> เปลี่ยนตาม [TCG-562] */
export function LanguageSwitch({ className }: { className?: string }) {
  const { t } = useTranslate();
  const { language, setLanguage } = useLanguage();
  const en = language === "en";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={en}
      aria-label={t("nav.languageSwitch", "ภาษาอังกฤษ / English")}
      onClick={() => setLanguage(en ? "th" : "en")}
      className={cn(
        "flex items-center gap-2 rounded-full px-1 text-xs font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span aria-hidden className={cn(!en && "text-primary")}>TH</span>
      <span aria-hidden className="flex h-[22px] w-10 items-center rounded-full bg-primary p-[3px]">
        <span className={cn("size-4 rounded-full bg-background transition-transform", en && "translate-x-[18px]")} />
      </span>
      <span aria-hidden className={cn(en && "text-primary")}>EN</span>
    </button>
  );
}
