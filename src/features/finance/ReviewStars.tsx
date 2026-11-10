import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslate } from '@/lib/i18n';

export function ReviewStars({
  rating,
  className,
  starClassName,
}: {
  rating: number;
  className?: string;
  starClassName?: string;
}) {
  const { t } = useTranslate("common");
  return (
    <span
      className={cn("inline-flex gap-0.5", className)}
      role="img"
      aria-label={t("reviewStars.starsOutOf", "{rating} จาก 5 ดาว", { rating })}
    >
      {[1, 2, 3, 4, 5].map((score) => (
        <Star
          key={score}
          aria-hidden
          className={cn(
            "size-4",
            score <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
            starClassName,
          )}
        />
      ))}
    </span>
  );
}

export function RatingInput({ value, onChange, disabled }: { value: number; onChange: (rating: number) => void; disabled?: boolean }) {
  const { t } = useTranslate("common");
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="mb-2 text-sm font-medium">{t("reviewStars.legend", "คะแนนรีวิว")}</legend>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <label key={score} className="relative cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:disabled]:cursor-default has-[:disabled]:opacity-50">
            <input
              type="radio"
              name="review-rating"
              className="peer sr-only"
              value={score}
              checked={value === score}
              aria-label={t("reviewStars.starScore", "{score} ดาว", { score })}
              onChange={() => onChange(score)}
            />
            <Star aria-hidden className={`size-8 ${score <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("reviewStars.scoreOutOf", "{value} / 5 ดาว", { value })}</p>
    </fieldset>
  );
}
