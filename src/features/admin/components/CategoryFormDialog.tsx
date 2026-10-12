import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FileUpload } from "@/components/common";
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
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import { hasErrorCode } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

import type { CatalogCategory, Game } from "../catalog.types";
import { taxonomyErrorMessage } from "../taxonomy.format";
import { useSaveCategory } from "../taxonomy.queries";
import {
  ALL_GAMES,
  categorySchema,
  NO_PARENT,
  toCategoryForm,
  toCategoryPayload,
  type CategoryFormValues,
} from "../taxonomy.schema";

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
  /** หมวดทั้งหมดที่เกมนี้เห็น — ใช้หาหมวดแม่ที่เลือกได้ */
  categories: CatalogCategory[];
  /** ไม่ส่งมา = เพิ่มหมวดใหม่ */
  category?: CatalogCategory;
  /** รูปปัจจุบันที่เปิดได้ (มาจากตัว public) */
  imageUrl?: string;
};

/**
 * เพิ่ม/แก้หมวดหมู่ — body หน้าตาเดียวกันทั้ง POST และ PUT (`CategoryRequest`)
 *
 * เกมที่ใช้ (`gameId`) กับ slug ตั้งได้ครั้งเดียวตอนสร้าง จึงล็อกไว้ตอนแก้
 * หมวดซ้อนได้ชั้นเดียว: หมวดแม่ต้องอยู่ระดับบนสุด และเป็นหมวดข้ามเกมหรือเกมเดียวกัน
 * ตัวเลือกหมวดแม่จึงกรองตามกติกานี้ไว้ก่อน backend จะตอบ `VALIDATION_FAILED`
 */
export function CategoryFormDialog({
  open,
  onOpenChange,
  game,
  categories,
  category,
  imageUrl,
}: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {category ? `แก้ไขหมวด ${category.name}` : "เพิ่มหมวดหมู่"}
          </DialogTitle>
          <DialogDescription>
            {category?.gameId === null
              ? "หมวดนี้ใช้ร่วมกันทุกเกม แก้แล้วมีผลกับทุกเกม"
              : "หมวดหมู่คือชั้นวางของสินค้า เช่น การ์ดเดี่ยว ของซีล อุปกรณ์เสริม ซ้อนได้หนึ่งชั้น"}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          key={category?.id ?? "new"}
          game={game}
          categories={categories}
          category={category}
          imageUrl={imageUrl}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  game,
  categories,
  category,
  imageUrl,
  onSaved,
}: {
  game: Game;
  categories: CatalogCategory[];
  category?: CatalogCategory;
  imageUrl?: string;
  onSaved: () => void;
}) {
  const saveCategory = useSaveCategory();

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: toCategoryForm(game.id, category),
  });

  const upload = useFileUpload({
    purpose: "CATALOG_IMAGE",
    onChange: (keys) =>
      setValue("imageKey", keys[0] ?? "", { shouldDirty: true }),
  });

  const scope = useWatch({ control, name: "scope" });
  const imageKey = useWatch({ control, name: "imageKey" });

  const hasChildren = category
    ? categories.some((item) => item.parentId === category.id)
    : false;
  const scopeItems = [
    { value: String(game.id), label: `เฉพาะ ${game.name}` },
    { value: ALL_GAMES, label: "ทุกเกม" },
  ];
  // หมวดแม่ได้เฉพาะระดับบนสุด ที่เป็นหมวดข้ามเกมหรือเกมเดียวกับหมวดนี้
  const parentItems = [
    { value: NO_PARENT, label: "ไม่มี (ระดับบนสุด)" },
    ...categories
      .filter(
        (item) =>
          item.parentId === null &&
          item.id !== category?.id &&
          (item.gameId === null || (scope !== ALL_GAMES && item.gameId === game.id)),
      )
      .map((item) => ({
        value: String(item.id),
        label: item.gameId === null ? `${item.name} (ทุกเกม)` : item.name,
      })),
  ];

  const showCurrentImage =
    Boolean(imageUrl) &&
    imageKey !== "" &&
    imageKey === category?.imageKey &&
    upload.items.length === 0;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await saveCategory.mutateAsync({
        categoryId: category?.id ?? null,
        payload: toCategoryPayload(values),
      });
      toast.add({
        type: "success",
        title: category ? "บันทึกหมวดหมู่แล้ว" : `เพิ่มหมวด ${saved.name} แล้ว`,
      });
      onSaved();
    } catch (error) {
      if (hasErrorCode(error, "CATEGORY_CODE_ALREADY_USED")) {
        setError("code", {
          type: "server",
          message: taxonomyErrorMessage(error, ""),
        });
        return;
      }
      if (!applyApiErrors(error, setError)) {
        setError("root.server", {
          message: taxonomyErrorMessage(error, "บันทึกหมวดหมู่ไม่สำเร็จ ลองใหม่อีกครั้ง"),
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
          <FieldLabel htmlFor="categoryName">ชื่อหมวด *</FieldLabel>
          <Input
            id="categoryName"
            maxLength={100}
            placeholder="เช่น Elite Trainer Box"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.code) || undefined}>
            <FieldLabel htmlFor="categoryCode">รหัส *</FieldLabel>
            <Input
              id="categoryCode"
              maxLength={50}
              placeholder="เช่น ETB"
              autoCapitalize="characters"
              className="uppercase"
              aria-invalid={Boolean(errors.code)}
              {...register("code")}
            />
            <FieldDescription className="text-xs">A-Z 0-9 _</FieldDescription>
            <FieldError errors={[errors.code]} />
          </Field>

          <Field data-invalid={Boolean(errors.slug) || undefined}>
            <FieldLabel htmlFor="categorySlug">Slug</FieldLabel>
            <Input
              id="categorySlug"
              maxLength={120}
              placeholder="เว้นว่าง = สร้างจากชื่อ"
              disabled={Boolean(category)}
              aria-invalid={Boolean(errors.slug)}
              {...register("slug")}
            />
            <FieldDescription className="text-xs">
              ตั้งได้ครั้งเดียวตอนสร้าง
            </FieldDescription>
            <FieldError errors={[errors.slug]} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="categoryScope">ใช้กับ *</FieldLabel>
            <Controller
              control={control}
              name="scope"
              render={({ field }) => (
                <Select
                  items={scopeItems}
                  value={field.value}
                  disabled={Boolean(category)}
                  onValueChange={(next) => {
                    if (next === null) return;
                    field.onChange(next);
                    // หมวดข้ามเกมมีแม่เป็นหมวดของเกมเดียวไม่ได้
                    const parent = categories.find(
                      (item) => String(item.id) === getValues("parentId"),
                    );
                    if (next === ALL_GAMES && parent && parent.gameId !== null) {
                      setValue("parentId", NO_PARENT);
                    }
                  }}
                >
                  <SelectTrigger
                    id="categoryScope"
                    className="w-full"
                    onBlur={field.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {scopeItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldDescription className="text-xs">
              ตั้งได้ครั้งเดียวตอนสร้าง
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="categoryParent">หมวดแม่</FieldLabel>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select
                  items={parentItems}
                  value={field.value}
                  disabled={hasChildren}
                  onValueChange={(next) => {
                    if (next !== null) field.onChange(next);
                  }}
                >
                  <SelectTrigger
                    id="categoryParent"
                    className="w-full"
                    onBlur={field.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {parentItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldDescription className="text-xs">
              {hasChildren
                ? "มีหมวดย่อยอยู่ จึงย้ายไปอยู่ใต้หมวดอื่นไม่ได้"
                : "ซ้อนได้หนึ่งชั้น"}
            </FieldDescription>
          </Field>
        </div>

        <Field
          data-invalid={Boolean(errors.displayOrder) || undefined}
          className="sm:max-w-[160px]"
        >
          <FieldLabel htmlFor="categoryOrder">ลำดับการแสดง</FieldLabel>
          <Input
            id="categoryOrder"
            inputMode="numeric"
            placeholder="0"
            aria-invalid={Boolean(errors.displayOrder)}
            {...register("displayOrder")}
          />
          <FieldError errors={[errors.displayOrder]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="categoryImage">รูปหมวด</FieldLabel>
          {showCurrentImage ? (
            <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
              <img
                src={imageUrl}
                alt=""
                className="size-14 rounded-md object-cover"
              />
              <p className="flex-1 text-xs text-muted-foreground">
                รูปปัจจุบัน · แสดงเป็นไทล์ในหน้าแรก
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setValue("imageKey", "", { shouldDirty: true })}
              >
                <Trash2 data-icon="inline-start" />
                เอารูปออก
              </Button>
            </div>
          ) : (
            <FileUpload
              upload={upload}
              id="categoryImage"
              title={
                imageKey !== "" && upload.items.length === 0
                  ? "หมวดนี้มีรูปอยู่แล้ว (หมวดที่ปิดอยู่ดูตัวอย่างไม่ได้) — เลือกไฟล์ใหม่เพื่อเปลี่ยน"
                  : "ลากรูปมาวาง หรือคลิกเพื่อเลือกรูป"
              }
            />
          )}
        </Field>

        <Field orientation="horizontal">
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <Switch
                id="categoryActive"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldContent>
            <FieldLabel htmlFor="categoryActive">เปิดใช้งาน</FieldLabel>
            <FieldDescription className="text-xs">
              ปิดแล้วเลือกหมวดนี้ให้การ์ดใหม่ไม่ได้ การ์ดเดิมยังอยู่ในหมวดนี้
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          ยกเลิก
        </DialogClose>
        <Button type="submit" disabled={isSubmitting || upload.isUploading}>
          {(isSubmitting || upload.isUploading) && (
            <Spinner data-icon="inline-start" />
          )}
          {category ? "บันทึก" : "เพิ่มหมวดหมู่"}
        </Button>
      </DialogFooter>
    </form>
  );
}
