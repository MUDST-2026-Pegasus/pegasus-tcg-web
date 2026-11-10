import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";

import { DateTimePicker } from "@/components/common";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import { hasErrorCode } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

import type { CardSet, Game } from "../catalog.types";
import { taxonomyErrorMessage } from "../taxonomy.format";
import { useSaveCardSet } from "../taxonomy.queries";
import {
  cardSetSchema,
  toCardSetForm,
  toCardSetPayload,
  type CardSetFormValues,
} from "../taxonomy.schema";
import { LogoUploadField } from "./LogoUploadField";
import { useTranslate } from "@/lib/i18n";

type CardSetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
  /** ไม่ส่งมา = เพิ่มชุดใหม่ */
  cardSet?: CardSet;
};

/**
 * เพิ่ม/แก้ชุดการ์ด — body หน้าตาเดียวกันทั้ง POST และ PUT (`CardSetRequest`)
 * ชุดย้ายเกมไม่ได้ รหัสห้ามซ้ำในเกมเดียวกัน (`CARD_SET_CODE_ALREADY_USED`)
 */
export function CardSetFormDialog({
  open,
  onOpenChange,
  game,
  cardSet,
}: CardSetFormDialogProps) {
  const { t } = useTranslate("admin");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {cardSet ? t("cardAttributes.setForm.editTitle", "แก้ไขชุด {code}", { code: cardSet.code }) : t("cardAttributes.setForm.addTitle", "เพิ่มชุดการ์ด · {game}", { game: game.name })}
          </DialogTitle>
          <DialogDescription>
            {t("cardAttributes.setForm.description", "ชุดการ์ดใช้จัดกลุ่มการ์ดตามรุ่นที่วางจำหน่าย และเป็นตัวกรองในหน้าแคตตาล็อก")}
          </DialogDescription>
        </DialogHeader>
        <CardSetForm
          key={cardSet?.id ?? "new"}
          game={game}
          cardSet={cardSet}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CardSetForm({
  game,
  cardSet,
  onSaved,
}: {
  game: Game;
  cardSet?: CardSet;
  onSaved: () => void;
}) {
  const { t } = useTranslate("admin");
  const saveCardSet = useSaveCardSet(game.id);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CardSetFormValues>({
    resolver: zodResolver(cardSetSchema(t)),
    defaultValues: toCardSetForm(cardSet),
  });

  const upload = useFileUpload({
    purpose: "CATALOG_IMAGE",
    onChange: (keys) =>
      setValue("logoUrl", keys[0] ?? "", { shouldDirty: true }),
  });
  const logoUrl = useWatch({ control, name: "logoUrl" });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await saveCardSet.mutateAsync({
        cardSetId: cardSet?.id ?? null,
        payload: toCardSetPayload(values),
      });
      toast.add({
        type: "success",
        title: cardSet ? t("cardAttributes.setForm.saved", "บันทึกชุดการ์ดแล้ว") : t("cardAttributes.setForm.added", "เพิ่มชุด {code} แล้ว", { code: saved.code }),
      });
      onSaved();
    } catch (error) {
      if (hasErrorCode(error, "CARD_SET_CODE_ALREADY_USED")) {
        setError("code", {
          type: "server",
          message: taxonomyErrorMessage(error, ""),
        });
        return;
      }
      if (!applyApiErrors(error, setError)) {
        setError("root.server", {
          message: taxonomyErrorMessage(error, t("cardAttributes.setForm.saveFailed", "บันทึกชุดการ์ดไม่สำเร็จ ลองใหม่อีกครั้ง")),
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
          <Field data-invalid={Boolean(errors.code) || undefined}>
            <FieldLabel htmlFor="setCode">{t("cardAttributes.setForm.code", "รหัสชุด *")}</FieldLabel>
            <Input
              id="setCode"
              maxLength={32}
              placeholder={t("cardAttributes.setForm.codePlaceholder", "เช่น SV9")}
              autoCapitalize="characters"
              className="uppercase"
              aria-invalid={Boolean(errors.code)}
              {...register("code")}
            />
            <FieldDescription className="text-xs">
              {t("cardAttributes.setForm.codeHint", "A-Z 0-9 . - _ · ห้ามซ้ำในเกมนี้")}
            </FieldDescription>
            <FieldError errors={[errors.code]} />
          </Field>

          <Field data-invalid={Boolean(errors.releaseDate) || undefined}>
            <FieldLabel htmlFor="setRelease">{t("cardAttributes.sets.col.release", "วันวางจำหน่าย")}</FieldLabel>
            <Controller
              control={control}
              name="releaseDate"
              render={({ field }) => (
                <DateTimePicker
                  id="setRelease"
                  mode="date"
                  invalid={Boolean(errors.releaseDate)}
                  value={field.value ?? ""}
                  onChange={(value) => {
                    field.onChange(value);
                    field.onBlur();
                  }}
                />
              )}
            />
            <FieldDescription className="text-xs">
              {t("cardAttributes.setForm.releaseHint", "ใส่วันในอนาคตได้")}
            </FieldDescription>
            <FieldError errors={[errors.releaseDate]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.name) || undefined}>
          <FieldLabel htmlFor="setName">{t("cardAttributes.setForm.name", "ชื่อชุด *")}</FieldLabel>
          <Input
            id="setName"
            maxLength={150}
            placeholder={t("cardAttributes.setForm.namePlaceholder", "เช่น Battle Partners")}
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={Boolean(errors.nameLocal) || undefined}>
          <FieldLabel htmlFor="setNameLocal">{t("cardAttributes.form.nameLocal", "ชื่อภาษาไทย")}</FieldLabel>
          <Input
            id="setNameLocal"
            maxLength={150}
            placeholder={t("cardAttributes.form.optional", "ไม่บังคับ")}
            aria-invalid={Boolean(errors.nameLocal)}
            {...register("nameLocal")}
          />
          <FieldError errors={[errors.nameLocal]} />
        </Field>

        <Field
          data-invalid={Boolean(errors.totalCards) || undefined}
          className="sm:max-w-[160px]"
        >
          <FieldLabel htmlFor="setTotal">{t("cardAttributes.sets.totalCards", "จำนวนการ์ดในชุด")}</FieldLabel>
          <Input
            id="setTotal"
            inputMode="numeric"
            placeholder={t("cardAttributes.setForm.totalPlaceholder", "เช่น 100")}
            aria-invalid={Boolean(errors.totalCards)}
            {...register("totalCards")}
          />
          <FieldError errors={[errors.totalCards]} />
        </Field>

        <Field data-invalid={Boolean(errors.logoUrl) || undefined}>
          <FieldLabel htmlFor="setLogo">{t("cardAttributes.form.logo", "โลโก้")}</FieldLabel>
          <LogoUploadField
            upload={upload}
            id="setLogo"
            value={logoUrl}
            saved={cardSet}
            onRemove={() => setValue("logoUrl", "", { shouldDirty: true })}
          />
          <FieldError errors={[errors.logoUrl]} />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          {t("actions.cancel", "ยกเลิก", { ns: "common" })}
        </DialogClose>
        <Button type="submit" disabled={isSubmitting || upload.isUploading}>
          {(isSubmitting || upload.isUploading) && (
            <Spinner data-icon="inline-start" />
          )}
          {cardSet ? t("cardAttributes.form.save", "บันทึก") : t("cardAttributes.sets.addShort", "เพิ่มชุดการ์ด")}
        </Button>
      </DialogFooter>
    </form>
  );
}
