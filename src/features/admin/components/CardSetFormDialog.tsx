import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {cardSet ? `แก้ไขชุด ${cardSet.code}` : `เพิ่มชุดการ์ด · ${game.name}`}
          </DialogTitle>
          <DialogDescription>
            ชุดการ์ดใช้จัดกลุ่มการ์ดตามรุ่นที่วางจำหน่าย และเป็นตัวกรองในหน้าแคตตาล็อก
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
  const saveCardSet = useSaveCardSet(game.id);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CardSetFormValues>({
    resolver: zodResolver(cardSetSchema),
    defaultValues: toCardSetForm(cardSet),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await saveCardSet.mutateAsync({
        cardSetId: cardSet?.id ?? null,
        payload: toCardSetPayload(values),
      });
      toast.add({
        type: "success",
        title: cardSet ? "บันทึกชุดการ์ดแล้ว" : `เพิ่มชุด ${saved.code} แล้ว`,
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
          message: taxonomyErrorMessage(error, "บันทึกชุดการ์ดไม่สำเร็จ ลองใหม่อีกครั้ง"),
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
            <FieldLabel htmlFor="setCode">รหัสชุด *</FieldLabel>
            <Input
              id="setCode"
              maxLength={32}
              placeholder="เช่น SV9"
              autoCapitalize="characters"
              className="uppercase"
              aria-invalid={Boolean(errors.code)}
              {...register("code")}
            />
            <FieldDescription className="text-xs">
              A-Z 0-9 . - _ · ห้ามซ้ำในเกมนี้
            </FieldDescription>
            <FieldError errors={[errors.code]} />
          </Field>

          <Field data-invalid={Boolean(errors.releaseDate) || undefined}>
            <FieldLabel htmlFor="setRelease">วันวางจำหน่าย</FieldLabel>
            <Input
              id="setRelease"
              type="date"
              aria-invalid={Boolean(errors.releaseDate)}
              {...register("releaseDate")}
            />
            <FieldDescription className="text-xs">
              ใส่วันในอนาคตได้
            </FieldDescription>
            <FieldError errors={[errors.releaseDate]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.name) || undefined}>
          <FieldLabel htmlFor="setName">ชื่อชุด *</FieldLabel>
          <Input
            id="setName"
            maxLength={150}
            placeholder="เช่น Battle Partners"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={Boolean(errors.nameLocal) || undefined}>
          <FieldLabel htmlFor="setNameLocal">ชื่อภาษาไทย</FieldLabel>
          <Input
            id="setNameLocal"
            maxLength={150}
            placeholder="ไม่บังคับ"
            aria-invalid={Boolean(errors.nameLocal)}
            {...register("nameLocal")}
          />
          <FieldError errors={[errors.nameLocal]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <Field data-invalid={Boolean(errors.totalCards) || undefined}>
            <FieldLabel htmlFor="setTotal">จำนวนการ์ดในชุด</FieldLabel>
            <Input
              id="setTotal"
              inputMode="numeric"
              placeholder="เช่น 100"
              aria-invalid={Boolean(errors.totalCards)}
              {...register("totalCards")}
            />
            <FieldError errors={[errors.totalCards]} />
          </Field>

          <Field data-invalid={Boolean(errors.logoUrl) || undefined}>
            <FieldLabel htmlFor="setLogo">โลโก้ (URL)</FieldLabel>
            <Input
              id="setLogo"
              type="url"
              maxLength={500}
              placeholder="https://…"
              aria-invalid={Boolean(errors.logoUrl)}
              {...register("logoUrl")}
            />
            <FieldError errors={[errors.logoUrl]} />
          </Field>
        </div>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          ยกเลิก
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {cardSet ? "บันทึก" : "เพิ่มชุดการ์ด"}
        </Button>
      </DialogFooter>
    </form>
  );
}
