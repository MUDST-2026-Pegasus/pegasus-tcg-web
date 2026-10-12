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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {attribute
              ? `แก้ไขฟิลด์ ${attribute.label}`
              : `เพิ่มฟิลด์ · ${game.name}`}
          </DialogTitle>
          <DialogDescription>
            ฟิลด์จะโผล่ในฟอร์มเพิ่มการ์ดของเกมนี้ทันที และเป็นตัวกรองในหน้าร้านถ้าเปิด
            "ใช้กรอง"
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
    resolver: zodResolver(attributeSchema),
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
        title: attribute ? "บันทึกฟิลด์แล้ว" : `เพิ่มฟิลด์ ${values.label} แล้ว`,
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
          message: taxonomyErrorMessage(error, "บันทึกฟิลด์ไม่สำเร็จ ลองใหม่อีกครั้ง"),
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
            <FieldLabel htmlFor="attrLabel">ชื่อฟิลด์ *</FieldLabel>
            <Input
              id="attrLabel"
              maxLength={100}
              placeholder="เช่น Card Type"
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
            <FieldLabel htmlFor="attrKey">คีย์ *</FieldLabel>
            <Input
              id="attrKey"
              maxLength={50}
              placeholder="เช่น card_type"
              className="font-mono"
              aria-invalid={Boolean(errors.attrKey)}
              {...register("attrKey")}
            />
            <FieldDescription className="text-xs">
              {attribute
                ? "เปลี่ยนคีย์แล้ว ค่าที่การ์ดเก็บไว้ใต้คีย์เดิมจะไม่ถูกอ่าน"
                : "a-z 0-9 _ · ค่าของการ์ดเก็บใต้คีย์นี้"}
            </FieldDescription>
            <FieldError errors={[errors.attrKey]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.dataType) || undefined}>
          <FieldLabel htmlFor="attrType">ประเภท *</FieldLabel>
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
            <FieldLabel htmlFor="attrOptions">ตัวเลือก *</FieldLabel>
            <Textarea
              id="attrOptions"
              rows={4}
              placeholder={"Fire\nWater\nGrass"}
              aria-invalid={Boolean(errors.options)}
              {...register("options")}
            />
            <FieldDescription className="text-xs">
              หนึ่งบรรทัดต่อหนึ่งตัวเลือก
              {attribute ? " · ตัดตัวเลือกออกแล้ว การ์ดที่ใช้ค่านั้นอยู่ต้องแก้ใหม่ตอนบันทึกครั้งหน้า" : ""}
            </FieldDescription>
            <FieldError errors={[errors.options]} />
          </Field>
        )}

        <FlagField
          control={control}
          name="filterable"
          title="ใช้กรอง"
          description="แสดงเป็นตัวกรองในหน้าร้านของเกมนี้"
        />
        <FlagField
          control={control}
          name="required"
          title="จำเป็น"
          description="ต้องกรอกทุกครั้งที่เพิ่มหรือแก้การ์ดของเกมนี้"
        />
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          ยกเลิก
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {attribute ? "บันทึก" : "เพิ่มฟิลด์"}
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
