import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Sparkles, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type Path,
  type UseFormRegister,
} from "react-hook-form";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api";

import { catalogErrorMessage } from "../catalog.format";
import { useCardEffects, useSaveCardEffects } from "../catalog.queries";
import {
  cardEffectsSchema,
  emptyCardEffectForm,
  toCardEffectField,
  toCardEffectsForm,
  toCardEffectsPayload,
  type CardEffectsFormValues,
} from "../catalog.schema";
import type { CardEffect, CardEffectType } from "../catalog.types";

const EFFECT_TYPE_ITEMS: { value: CardEffectType; label: string }[] = [
  { value: "ATTACK", label: "Attack" },
  { value: "ABILITY", label: "Ability" },
  { value: "RULE", label: "Rule" },
];

type CatalogCardEffectEditorProps = {
  productId: number;
  onClose: () => void;
};

/**
 * แท็บ Abilities & Attacks — สิ่งที่หน้าการ์ดฝั่งร้านโชว์ในกล่องชื่อเดียวกัน
 *
 * บันทึกทั้งชุดทีเดียว (`PUT .../effects` แทนที่ของเดิม) ลำดับบนจอคือลำดับบนหน้าการ์ด
 * จึงเพิ่ม ลบ สลับ ได้อิสระแล้วค่อยกดบันทึกครั้งเดียว
 */
export function CatalogCardEffectEditor({
  productId,
  onClose,
}: CatalogCardEffectEditorProps) {
  const effects = useCardEffects(productId);

  return (
    <QueryBoundary
      query={effects}
      loading={<EffectEditorSkeleton />}
      errorTitle="โหลด Abilities & Attacks ไม่สำเร็จ"
      errorMessage="ลองใหม่อีกครั้ง หรือตรวจการเชื่อมต่อ"
    >
      {(saved) => (
        <EffectForm productId={productId} saved={saved} onClose={onClose} />
      )}
    </QueryBoundary>
  );
}

function EffectForm({
  productId,
  saved,
  onClose,
}: {
  productId: number;
  saved: CardEffect[];
  onClose: () => void;
}) {
  const saveEffects = useSaveCardEffects(productId);

  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CardEffectsFormValues>({
    resolver: zodResolver(cardEffectsSchema),
    defaultValues: toCardEffectsForm(saved),
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "effects",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const stored = await saveEffects.mutateAsync(
        toCardEffectsPayload(values),
      );
      // ค่าที่ backend เก็บจริง (ตัดช่องว่าง เรียงลำดับใหม่) กลายเป็นค่าตั้งต้นใหม่
      reset(toCardEffectsForm(stored));
      toast.add({ type: "success", title: "บันทึก Abilities & Attacks แล้ว" });
    } catch (error) {
      // violation มาเป็น `effects[2].name` — แปลงเป็นชื่อช่องของฟอร์มก่อนแปะ
      if (isApiError(error) && error.violations.length > 0) {
        for (const violation of error.violations) {
          setError(
            toCardEffectField(violation.field) as Path<CardEffectsFormValues>,
            { type: "server", message: violation.message },
          );
        }
        return;
      }
      setError("root.server", {
        message: catalogErrorMessage(
          error,
          "บันทึก Abilities & Attacks ไม่สำเร็จ ลองใหม่อีกครั้ง",
        ),
      });
    }
  });

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
        {errors.root?.server?.message && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.server.message}</AlertDescription>
          </Alert>
        )}
        {errors.effects?.root?.message && (
          <Alert variant="destructive">
            <AlertDescription>{errors.effects.root.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            เรียงตามลำดับบนการ์ด · ภาษาอังกฤษ
          </p>
          <Button
            type="button"
            size="sm"
            className="rounded-md px-2.5"
            onClick={() => append(emptyCardEffectForm())}
          >
            + เพิ่มรายการ
          </Button>
        </div>

        {fields.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="ยังไม่มี Abilities & Attacks"
            description="เพิ่มความสามารถ ท่าโจมตี หรือกฎพิเศษของการ์ด เพื่อแสดงในหน้าสินค้า"
            className="min-h-60"
          />
        ) : (
          <ol className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <EffectRow
                key={field.id}
                index={index}
                count={fields.length}
                control={control}
                register={register}
                errors={errors}
                onMove={(to) => move(index, to)}
                onRemove={() => remove(index)}
              />
            ))}
          </ol>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          ปิด
        </Button>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          บันทึก
        </Button>
      </div>
    </form>
  );
}

function EffectRow({
  index,
  count,
  control,
  register,
  errors,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  control: Control<CardEffectsFormValues>;
  register: UseFormRegister<CardEffectsFormValues>;
  errors: FieldErrors<CardEffectsFormValues>;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const effectType = useWatch({ control, name: `effects.${index}.effectType` });
  const fieldErrors = errors.effects?.[index];
  const id = (name: string) => `effects-${index}-${name}`;

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          #{index + 1}
        </span>
        <Controller
          control={control}
          name={`effects.${index}.effectType`}
          render={({ field }) => (
            <Select
              items={EFFECT_TYPE_ITEMS}
              value={field.value}
              onValueChange={(next) => {
                if (next !== null) field.onChange(next);
              }}
            >
              <SelectTrigger
                aria-label={`ประเภทรายการที่ ${index + 1}`}
                className="w-32"
                onBlur={field.onBlur}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {EFFECT_TYPE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`เลื่อนรายการที่ ${index + 1} ขึ้น`}
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`เลื่อนรายการที่ ${index + 1} ลง`}
            disabled={index === count - 1}
            onClick={() => onMove(index + 1)}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`ลบรายการที่ ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field data-invalid={Boolean(fieldErrors?.name) || undefined}>
            <FieldLabel htmlFor={id("name")}>ชื่อ</FieldLabel>
            <Input
              id={id("name")}
              maxLength={120}
              placeholder={effectType === "ATTACK" ? "Topaz Bolt" : "Resolute Heart"}
              aria-invalid={Boolean(fieldErrors?.name)}
              {...register(`effects.${index}.name`)}
            />
            <FieldError errors={[fieldErrors?.name]} />
          </Field>

          {effectType === "ATTACK" && (
            <Field data-invalid={Boolean(fieldErrors?.damage) || undefined}>
              <FieldLabel htmlFor={id("damage")}>ดาเมจ</FieldLabel>
              <Input
                id={id("damage")}
                inputMode="numeric"
                placeholder="—"
                aria-invalid={Boolean(fieldErrors?.damage)}
                {...register(`effects.${index}.damage`)}
              />
              <FieldError errors={[fieldErrors?.damage]} />
            </Field>
          )}
        </div>

        {effectType === "ATTACK" && (
          <Field data-invalid={Boolean(fieldErrors?.energyCost) || undefined}>
            <FieldLabel htmlFor={id("energyCost")}>พลังงานที่ใช้</FieldLabel>
            <Input
              id={id("energyCost")}
              placeholder="Grass, Lightning, Metal"
              aria-invalid={Boolean(fieldErrors?.energyCost)}
              {...register(`effects.${index}.energyCost`)}
            />
            <FieldDescription>
              คั่นด้วยจุลภาค ตามลำดับบนการ์ด
            </FieldDescription>
            <FieldError errors={[fieldErrors?.energyCost]} />
          </Field>
        )}

        <Field data-invalid={Boolean(fieldErrors?.effectText) || undefined}>
          <FieldLabel htmlFor={id("effectText")}>คำอธิบาย</FieldLabel>
          <Textarea
            id={id("effectText")}
            rows={3}
            aria-invalid={Boolean(fieldErrors?.effectText)}
            {...register(`effects.${index}.effectText`)}
          />
          <FieldError errors={[fieldErrors?.effectText]} />
        </Field>

        <Field data-invalid={Boolean(fieldErrors?.sourceUrl) || undefined}>
          <FieldLabel htmlFor={id("sourceUrl")}>ลิงก์แหล่งที่มา</FieldLabel>
          <Input
            id={id("sourceUrl")}
            type="url"
            placeholder="https://www.pokemon-card.com/..."
            aria-invalid={Boolean(fieldErrors?.sourceUrl)}
            {...register(`effects.${index}.sourceUrl`)}
          />
          <FieldError errors={[fieldErrors?.sourceUrl]} />
        </Field>
      </FieldGroup>
    </li>
  );
}

function EffectEditorSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-6 pb-6">
      <Skeleton className="h-8 w-40 self-end" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
