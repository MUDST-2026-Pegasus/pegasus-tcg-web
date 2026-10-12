import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { hasErrorCode } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

import type { Game } from "../catalog.types";
import { taxonomyErrorMessage } from "../taxonomy.format";
import { useSaveGame } from "../taxonomy.queries";
import {
  gameSchema,
  toGameForm,
  toGamePayload,
  type GameFormValues,
} from "../taxonomy.schema";

type GameFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ไม่ส่งมา = เพิ่มเกมใหม่ */
  game?: Game;
  /** เรียกหลังบันทึกสำเร็จ — หน้าใช้เลือกเกมที่เพิ่งเพิ่ม */
  onSaved?: (game: Game) => void;
};

/**
 * เพิ่ม/แก้เกม — body หน้าตาเดียวกันทั้ง POST และ PUT (`GameRequest`)
 * slug ตั้งได้ครั้งเดียวตอนสร้าง (ลิงก์หน้าร้านชี้มา) จึงล็อกไว้ตอนแก้
 *
 * ตัวฟอร์มแยกเป็น component ใน `DialogContent` ที่ถูก unmount ตอนปิด ค่าจึงรีเซ็ตเอง
 */
export function GameFormDialog({
  open,
  onOpenChange,
  game,
  onSaved,
}: GameFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{game ? `แก้ไขเกม ${game.name}` : "เพิ่มเกม"}</DialogTitle>
          <DialogDescription>
            {game
              ? "เปลี่ยนชื่อ รหัส หรือโลโก้ได้ตลอด slug ในลิงก์หน้าร้านตั้งได้ครั้งเดียวตอนสร้าง"
              : "เกมใหม่จะมีหมวดกลาง (Single cards, Sealed, Accessories) ให้ใช้ทันที แล้วค่อยเพิ่มฟิลด์และชุดการ์ด"}
          </DialogDescription>
        </DialogHeader>
        <GameForm
          key={game?.id ?? "new"}
          game={game}
          onSaved={(saved) => {
            onOpenChange(false);
            onSaved?.(saved);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function GameForm({
  game,
  onSaved,
}: {
  game?: Game;
  onSaved: (game: Game) => void;
}) {
  const saveGame = useSaveGame();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema),
    defaultValues: toGameForm(game),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await saveGame.mutateAsync({
        gameId: game?.id ?? null,
        payload: toGamePayload(values),
      });
      toast.add({
        type: "success",
        title: game ? "บันทึกข้อมูลเกมแล้ว" : `เพิ่มเกม ${saved.name} แล้ว`,
      });
      onSaved(saved);
    } catch (error) {
      if (hasErrorCode(error, "GAME_CODE_ALREADY_USED")) {
        setError("code", {
          type: "server",
          message: taxonomyErrorMessage(error, ""),
        });
        return;
      }
      if (!applyApiErrors(error, setError)) {
        setError("root.server", {
          message: taxonomyErrorMessage(error, "บันทึกเกมไม่สำเร็จ ลองใหม่อีกครั้ง"),
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
        <Field data-invalid={Boolean(errors.name) || undefined}>
          <FieldLabel htmlFor="gameName">ชื่อเกม *</FieldLabel>
          <Input
            id="gameName"
            maxLength={100}
            placeholder="เช่น Pokémon"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={Boolean(errors.nameLocal) || undefined}>
          <FieldLabel htmlFor="gameNameLocal">ชื่อภาษาไทย</FieldLabel>
          <Input
            id="gameNameLocal"
            maxLength={100}
            placeholder="เช่น โปเกมอน"
            aria-invalid={Boolean(errors.nameLocal)}
            {...register("nameLocal")}
          />
          <FieldError errors={[errors.nameLocal]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.code) || undefined}>
            <FieldLabel htmlFor="gameCode">รหัสเกม *</FieldLabel>
            <Input
              id="gameCode"
              maxLength={32}
              placeholder="เช่น POKEMON"
              autoCapitalize="characters"
              className="uppercase"
              aria-invalid={Boolean(errors.code)}
              {...register("code")}
            />
            <FieldDescription className="text-xs">
              A-Z 0-9 _ · ใช้ขึ้นต้น SKU ของการ์ด
            </FieldDescription>
            <FieldError errors={[errors.code]} />
          </Field>

          <Field data-invalid={Boolean(errors.slug) || undefined}>
            <FieldLabel htmlFor="gameSlug">Slug</FieldLabel>
            <Input
              id="gameSlug"
              maxLength={100}
              placeholder="เว้นว่าง = สร้างจากชื่อ"
              disabled={Boolean(game)}
              aria-invalid={Boolean(errors.slug)}
              {...register("slug")}
            />
            <FieldDescription className="text-xs">
              ตั้งได้ครั้งเดียวตอนสร้าง
            </FieldDescription>
            <FieldError errors={[errors.slug]} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field data-invalid={Boolean(errors.logoUrl) || undefined}>
            <FieldLabel htmlFor="gameLogo">โลโก้ (URL)</FieldLabel>
            <Input
              id="gameLogo"
              type="url"
              maxLength={500}
              placeholder="https://…"
              aria-invalid={Boolean(errors.logoUrl)}
              {...register("logoUrl")}
            />
            <FieldError errors={[errors.logoUrl]} />
          </Field>

          <Field data-invalid={Boolean(errors.displayOrder) || undefined}>
            <FieldLabel htmlFor="gameOrder">ลำดับการแสดง</FieldLabel>
            <Input
              id="gameOrder"
              inputMode="numeric"
              placeholder="0"
              aria-invalid={Boolean(errors.displayOrder)}
              {...register("displayOrder")}
            />
            <FieldError errors={[errors.displayOrder]} />
          </Field>
        </div>

        <Field orientation="horizontal">
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <Switch
                id="gameActive"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldContent>
            <FieldLabel htmlFor="gameActive">แสดงบนหน้าร้าน</FieldLabel>
            <FieldDescription className="text-xs">
              ปิดไว้ก่อนได้ถ้ายังเตรียมฟิลด์และชุดการ์ดไม่เสร็จ
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          ยกเลิก
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {game ? "บันทึก" : "เพิ่มเกม"}
        </Button>
      </DialogFooter>
    </form>
  );
}
