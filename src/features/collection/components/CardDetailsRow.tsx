import { useRef } from "react";
import { ImageOff, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { CONDITION_LABELS } from "@/features/catalog/catalog.mappers";
import type { CardCondition } from "@/features/catalog/catalog.types";
import type { UploadItem } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

import { MAX_QUANTITY, metaOf, variantLabelOf, type CardDraft, type PickedCard } from "../collection.picker";
import type { CollectionVariant } from "../collection.types";

const CONDITION_OPTIONS = (Object.keys(CONDITION_LABELS) as CardCondition[]).map((condition) => ({
  value: condition,
  label: CONDITION_LABELS[condition],
}));

export function CardThumb({ src, className }: { src: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground",
        className,
      )}
    >
      {src ? <img src={src} alt="" className="size-full object-contain" /> : <ImageOff aria-hidden className="size-4" />}
    </span>
  );
}

/**
 * The project's styled dropdown over a plain option list. `null` is "nothing chosen":
 * it shows `placeholder`, and with `clearable` the placeholder is also a row that goes back to it.
 */
export function OptionSelect<T extends string | number>({
  label,
  value,
  options,
  placeholder,
  clearable = false,
  disabled,
  invalid,
  onChange,
}: {
  /** Read by screen readers; the dropdown has no visible label of its own. */
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  placeholder: string;
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (value: T | null) => void;
}) {
  return (
    <Select
      items={[{ value: null, label: placeholder }, ...options]}
      value={value}
      disabled={disabled}
      onValueChange={(next) => onChange(next as T | null)}
    >
      <SelectTrigger aria-label={label} aria-invalid={invalid || undefined} className="w-full min-w-0">
        <SelectValue />
      </SelectTrigger>
      {/* At least as wide as the trigger, wider when a label needs it — long names are not cut off. */}
      <SelectContent className="w-auto min-w-(--anchor-width)">
        <SelectGroup>
          {clearable && <SelectItem value={null}>{placeholder}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/**
 * One card's details: printing, condition and quantity on a line, the owner's photo on the
 * line below. Shared by the add and edit dialogs, which hold the state.
 */
export function CardDetailsRow({
  card,
  draft,
  variantId,
  variants,
  variantsPending,
  variantsFailed,
  onRetryVariants,
  photo,
  currentPhotoUrl = null,
  accept,
  failure,
  disabled,
  onChange,
  onPhoto,
  onDropPhoto,
  onRemove,
}: {
  card: PickedCard;
  draft: CardDraft;
  /** The printing that would be saved now — `null` while the owner still has to choose. */
  variantId: number | null;
  /** Only the printings on offer for this card. */
  variants: CollectionVariant[];
  variantsPending: boolean;
  variantsFailed: boolean;
  onRetryVariants: () => void;
  /** A photo picked in this dialog, in whatever state its upload is. */
  photo: UploadItem | undefined;
  /** The photo already saved on the card, shown until it is replaced or removed. */
  currentPhotoUrl?: string | null;
  accept: string;
  failure?: string;
  disabled: boolean;
  onChange: (changes: Partial<CardDraft>) => void;
  onPhoto: (file: File) => void;
  onDropPhoto: () => void;
  /** Left out where the row cannot be taken away, as when editing one card. */
  onRemove?: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const meta = metaOf(card);
  const pickPhoto = () => fileInput.current?.click();
  const previewUrl = photo ? photo.previewUrl : currentPhotoUrl;

  return (
    <li className="flex flex-col gap-3 py-4">
      <div
        className={cn(
          "grid items-center gap-3",
          onRemove
            ? "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_4.5rem_auto]"
            : "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_4.5rem]",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <CardThumb src={card.imageUrl} className="h-14 w-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{card.name}</p>
            {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
          </div>
        </div>

        {variantsPending ? (
          <p role="status" className="text-xs text-muted-foreground">
            Loading printings...
          </p>
        ) : variantsFailed ? (
          <Button variant="outline" size="sm" onClick={onRetryVariants}>
            Retry printings
          </Button>
        ) : variants.length === 0 ? (
          <p className="text-xs text-destructive">No printing available for this card.</p>
        ) : (
          <OptionSelect
            label={`Printing of ${card.name}`}
            value={variantId}
            options={variants.map((variant) => ({ value: variant.id, label: variantLabelOf(variant) }))}
            placeholder="Choose printing"
            disabled={disabled}
            invalid={variantId === null}
            onChange={(next) => onChange({ variantId: next })}
          />
        )}

        <OptionSelect
          label={`Condition of ${card.name}`}
          value={draft.condition}
          options={CONDITION_OPTIONS}
          placeholder="Condition"
          disabled={disabled}
          onChange={(next) => onChange({ condition: next ?? draft.condition })}
        />

        <Input
          type="number"
          aria-label={`Quantity of ${card.name}`}
          min={1}
          max={MAX_QUANTITY}
          step={1}
          disabled={disabled}
          value={Number.isFinite(draft.quantity) ? draft.quantity : ""}
          onChange={(event) => onChange({ quantity: event.target.valueAsNumber })}
        />

        {onRemove && (
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={`Remove ${card.name}`}
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:pl-[3.25rem]">
        <input
          ref={fileInput}
          type="file"
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          aria-label={`Photo of ${card.name}`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onPhoto(file);
            event.target.value = "";
          }}
        />
        {previewUrl && photo?.status !== "error" && (
          <img src={previewUrl} alt={`Your photo of ${card.name}`} className="size-16 rounded-md border object-cover" />
        )}
        {photo?.status === "uploading" ? (
          <>
            <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
              <Spinner /> Uploading {Math.round(photo.progress * 100)}%
            </p>
            <Button variant="ghost" size="sm" onClick={onDropPhoto}>
              Cancel
            </Button>
          </>
        ) : photo?.status === "error" ? (
          <>
            <p role="alert" className="text-xs text-destructive">
              {photo.error}
            </p>
            <Button variant="outline" size="sm" disabled={disabled} onClick={pickPhoto}>
              <Upload data-icon="inline-start" /> Choose another
            </Button>
            <Button variant="ghost" size="sm" disabled={disabled} onClick={onDropPhoto}>
              Dismiss
            </Button>
          </>
        ) : previewUrl ? (
          <>
            <Button variant="outline" size="sm" disabled={disabled} onClick={pickPhoto}>
              <Upload data-icon="inline-start" /> Replace photo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label={`Remove photo of ${card.name}`}
              onClick={onDropPhoto}
            >
              Remove
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" disabled={disabled} onClick={pickPhoto}>
              <Upload data-icon="inline-start" /> Add photo
            </Button>
            <p className="text-xs text-muted-foreground">Optional. Without one, the official card image is shown.</p>
          </>
        )}
      </div>

      {failure && (
        <p role="alert" className="text-xs text-destructive">
          {failure}
        </p>
      )}
    </li>
  );
}
