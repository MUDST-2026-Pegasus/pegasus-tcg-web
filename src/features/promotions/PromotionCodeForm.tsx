import { translate, useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface PromotionCodeFormProps {
  id: string;
  label: string;
  value: string;
  onChange(value: string): void;
  onSubmit(): void | Promise<void>;
  error?: string | null;
  loading?: boolean;
  placeholder?: string;
  showLabel?: boolean;
}

export function PromotionCodeForm({
  id, label, value, onChange, onSubmit, error, loading = false,
  placeholder = translate("กรอกโค้ดส่วนลด", "Enter a discount code"), showLabel = true,
}: PromotionCodeFormProps) {
  useLanguage();
  return (
    <form onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
      <Field className="gap-1.5" data-invalid={!!error}>
        <FieldLabel htmlFor={id} className={showLabel ? "text-xs" : "sr-only"}>{label}</FieldLabel>
        <div className="flex gap-2">
          <Input id={id} value={value} onChange={(event) => onChange(event.target.value)}
            maxLength={20} placeholder={placeholder} disabled={loading}
            aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
            className="h-10 rounded-sm uppercase text-[13px]" />
          <Button type="submit" disabled={!value.trim() || loading}
            className="h-10 shrink-0 rounded-sm text-[13px] font-semibold">
            {loading ? <Spinner /> : translate("ใช้โค้ด", "Apply code")}
          </Button>
        </div>
        {error && <FieldError id={`${id}-error`} role="alert" className="text-xs">{error}</FieldError>}
      </Field>
    </form>
  );
}
