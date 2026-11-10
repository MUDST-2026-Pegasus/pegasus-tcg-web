import type { ChangeEvent } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { hasErrorCode } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

import type { Game, GameAttribute } from "../catalog.types";
import {
  ATTRIBUTE_TYPE_BADGE,
  ATTRIBUTE_TYPE_LABEL,
  ATTRIBUTE_TYPES,
  taxonomyErrorMessage,
} from "../taxonomy.format";
import { useSaveAttribute } from "../taxonomy.queries";
import {
  attributeSchema,
  suggestAttrKey,
  toAttributeForm,
  toAttributePayload,
  type AttributeFormValues,
} from "../taxonomy.schema";
import { useTranslate } from "@/lib/i18n";

type AttributeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
  /** ไม่ส่งมา = เพิ่มฟิลด์ใหม่ */
  attribute?: GameAttribute;
  /** ลำดับของฟิลด์ใหม่ — ต่อท้ายตาราง */
  nextDisplayOrder: number;
};

const TYPE_ITEMS = ATTRIBUTE_TYPES.map((type) => ({
  value: type,
  label: `${ATTRIBUTE_TYPE_BADGE[type]} — ${ATTRIBUTE_TYPE_LABEL[type]}`,
}));

/**
 * เพิ่ม/แก้ฟิลด์ของการ์ด — body หน้าตาเดียวกันทั้ง POST และ PUT (`GameAttributeRequest`)
 * บันทึกแล้วฟอร์มเพิ่มการ์ดในหน้าแคตตาล็อกมีช่องนี้ทันที (cache เดียวกัน)
 */
export function AttributeFormDialog({
  open,
  onOpenChange,
  game,
  attribute,
  nextDisplayOrder,
}: AttributeFormDialogProps) {
  const { t } = useTranslate("admin");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {attribute
              ? t("cardAttributes.fieldForm.editTitle", "แก้ไขฟิลด์ {label}", { label: attribute.label })
              : t("cardAttributes.fieldForm.addTitle", "เพิ่มฟิลด์ · {game}", { game: game.name })}
          </DialogTitle>
          <DialogDescription>
            {t("cardAttributes.fieldForm.description", "ฟิลด์จะโผล่ในฟอร์มเพิ่มการ์ดของเกมนี้ทันที และเป็นตัวกรองในหน้าร้านถ้าเปิด \"ใช้กรอง\"")}
          </DialogDescription>
        </DialogHeader>
        <AttributeForm
          key={attribute?.id ?? "new"}
          game={game}
          attribute={attribute}
          displayOrder={attribute?.displayOrder ?? nextDisplayOrder}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AttributeForm({
  game,
  attribute,
  displayOrder,
  onSaved,
}: {
  game: Game;
  attribute?: GameAttribute;
  displayOrder: number;
  onSaved: () => void;
}) {
  const { t } = useTranslate("admin");
  const saveAttribute = useSaveAttribute(game.id);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema(t)),
    defaultValues: toAttributeForm(attribute),
  });

  const dataType = useWatch({ control, name: "dataType" });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveAttribute.mutateAsync({
        attributeId: attribute?.id ?? null,
        payload: toAttributePayload(values, displayOrder),
      });
      toast.add({
        type: "success",
        title: attribute ? t("cardAttributes.fieldForm.saved", "บันทึกฟิลด์แล้ว") : t("cardAttributes.fieldForm.added", "เพิ่มฟิลด์ {label} แล้ว", { label: values.label }),
      });
      onSaved();
    } catch (error) {
      if (hasErrorCode(error, "ATTRIBUTE_KEY_ALREADY_USED")) {
        setError("attrKey", {
          type: "server",
          message: taxonomyErrorMessage(error, ""),
        });
        return;
      }
      if (hasErrorCode(error, "INVALID_ATTRIBUTE_DEFINITION")) {
        setError("options", {
          type: "server",
          message: taxonomyErrorMessage(error, ""),
        });
        return;
      }
      if (!applyApiErrors(error, setError)) {
        setError("root.server", {
          message: taxonomyErrorMessage(error, t("cardAttributes.fieldForm.saveFailed", "บันทึกฟิลด์ไม่สำเร็จ ลองใหม่อีกครั้ง")),
        });
      }
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {errors.root?.server?.message && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.server.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.label) || undefined}>
            <FieldLabel htmlFor="attrLabel">{t("cardAttributes.fieldForm.label", "ชื่อฟิลด์ *")}</FieldLabel>
            <Input
              id="attrLabel"
              maxLength={100}
              placeholder={t("cardAttributes.fieldForm.labelPlaceholder", "เช่น Card Type")}
              aria-invalid={Boolean(errors.label)}
              {...register("label", {
                // ฟิลด์ใหม่: เดาคีย์จากชื่อให้ จนกว่าผู้ดูแลจะพิมพ์คีย์เอง
                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                  if (!attribute && !getFieldState("attrKey").isDirty) {
                    setValue("attrKey", suggestAttrKey(event.target.value));
                  }
                },
              })}
            />
            <FieldError errors={[errors.label]} />
          </Field>

          <Field data-invalid={Boolean(errors.attrKey) || undefined}>
            <FieldLabel htmlFor="attrKey">{t("cardAttributes.fieldForm.key", "คีย์ *")}</FieldLabel>
            <Input
              id="attrKey"
              maxLength={50}
              placeholder={t("cardAttributes.fieldForm.keyPlaceholder", "เช่น card_type")}
              className="font-mono"
              aria-invalid={Boolean(errors.attrKey)}
              {...register("attrKey")}
            />
            <FieldDescription className="text-xs">
              {attribute
                ? t("cardAttributes.fieldForm.keyChanged", "เปลี่ยนคีย์แล้ว ค่าที่การ์ดเก็บไว้ใต้คีย์เดิมจะไม่ถูกอ่าน")
                : t("cardAttributes.fieldForm.keyHint", "a-z 0-9 _ · ค่าของการ์ดเก็บใต้คีย์นี้")}
            </FieldDescription>
            <FieldError errors={[errors.attrKey]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.dataType) || undefined}>
          <FieldLabel htmlFor="attrType">{t("cardAttributes.fieldForm.type", "ประเภท *")}</FieldLabel>
          <Controller
            control={control}
            name="dataType"
            render={({ field }) => (
              <Select
                items={TYPE_ITEMS}
                value={field.value}
                onValueChange={(next) => {
                  if (next !== null) field.onChange(next);
                }}
              >
                <SelectTrigger
                  id="attrType"
                  className="w-full"
                  onBlur={field.onBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TYPE_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.dataType]} />
        </Field>

        {dataType === "ENUM" && (
          <Field data-invalid={Boolean(errors.options) || undefined}>
            <FieldLabel htmlFor="attrOptions">{t("cardAttributes.fieldForm.options", "ตัวเลือก *")}</FieldLabel>
            <Textarea
              id="attrOptions"
              rows={4}
              placeholder={"Fire\nWater\nGrass"}
              aria-invalid={Boolean(errors.options)}
              {...register("options")}
            />
            <FieldDescription className="text-xs">
              {t("cardAttributes.fieldForm.optionsHint", "หนึ่งบรรทัดต่อหนึ่งตัวเลือก")}
              {attribute ? ` · ${t("cardAttributes.fieldForm.optionsEditHint", "ตัดตัวเลือกออกแล้ว การ์ดที่ใช้ค่านั้นอยู่ต้องแก้ใหม่ตอนบันทึกครั้งหน้า")}` : ""}
            </FieldDescription>
            <FieldError errors={[errors.options]} />
          </Field>
        )}

        <FlagField
          control={control}
          name="filterable"
          title={t("cardAttributes.fields.filterable", "ใช้กรอง")}
          description={t("cardAttributes.fieldForm.filterableHint", "แสดงเป็นตัวกรองในหน้าร้านของเกมนี้")}
        />
        <FlagField
          control={control}
          name="required"
          title={t("cardAttributes.fields.required", "จำเป็น")}
          description={t("cardAttributes.fieldForm.requiredHint", "ต้องกรอกทุกครั้งที่เพิ่มหรือแก้การ์ดของเกมนี้")}
        />
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          {t("actions.cancel", "ยกเลิก", { ns: "common" })}
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {attribute ? t("cardAttributes.form.save", "บันทึก") : t("cardAttributes.fields.addShort", "เพิ่มฟิลด์")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function FlagField({
  control,
  name,
  title,
  description,
}: {
  control: Control<AttributeFormValues>;
  name: "filterable" | "required";
  title: string;
  description: string;
}) {
  const id = `attr-${name}`;
  return (
    <Field orientation="horizontal">
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch
            id={id}
            checked={field.value}
            onCheckedChange={(checked) => field.onChange(checked)}
            onBlur={field.onBlur}
          />
        )}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>{title}</FieldLabel>
        <FieldDescription className="text-xs">{description}</FieldDescription>
      </FieldContent>
    </Field>
  );
}
