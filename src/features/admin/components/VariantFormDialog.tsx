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
import { hasErrorCode } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

import {
  CARD_EDITION_LABEL,
  CARD_EDITIONS,
  CARD_FINISH_LABEL,
  CARD_FINISHES,
  catalogErrorMessage,
} from "../catalog.format";
import { useSaveVariant } from "../catalog.queries";
import {
  emptyVariantForm,
  toVariantForm,
  toVariantPayload,
  variantSchema,
  type VariantFormValues,
} from "../catalog.schema";
import type { CatalogProduct, CatalogVariant } from "../catalog.types";

type VariantFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: CatalogProduct;
  /** ไม่ส่งมา = เพิ่ม variant ใหม่ */
  variant?: CatalogVariant;
};

const FINISH_ITEMS = CARD_FINISHES.map((finish) => ({
  value: finish,
  label: CARD_FINISH_LABEL[finish],
}));

const EDITION_ITEMS = CARD_EDITIONS.map((edition) => ({
  value: edition,
  label: CARD_EDITION_LABEL[edition],
}));

/**
 * เพิ่ม/แก้ variant — body หน้าตาเดียวกันทั้ง POST และ PUT (`VariantRequest`)
 *
 * ภาษา + finish + edition + หมายเหตุการพิมพ์ คือตัวตนของ variant ห้ามซ้ำกันในสินค้าเดียว
 * (ไม่งั้นการ์ดใบเดียวกันจะมีราคากลางสองราคา) backend ตอบ `VARIANT_ALREADY_EXISTS`
 *
 * ตัวฟอร์มแยกเป็น component ใน `DialogContent` ที่ถูก unmount ตอนปิด ค่าจึงรีเซ็ตเอง
 */
export function VariantFormDialog({
  open,
  onOpenChange,
  product,
  variant,
}: VariantFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{variant ? "แก้ไข variant" : "เพิ่ม variant"}</DialogTitle>
          <DialogDescription>
            หนึ่ง variant = หนึ่งแบบที่ซื้อขายจริง เช่น ภาษาอังกฤษ Foil กับภาษาญี่ปุ่นปกติ
            คือคนละ variant ประกาศขายและราคากลางผูกกับ variant
          </DialogDescription>
        </DialogHeader>
        <VariantForm
          key={variant?.id ?? "new"}
          product={product}
          variant={variant}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function VariantForm({
  product,
  variant,
  onSaved,
}: {
  product: CatalogProduct;
  variant?: CatalogVariant;
  onSaved: () => void;
}) {
  const saveVariant = useSaveVariant(product.id);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: variant
      ? toVariantForm(variant)
      : emptyVariantForm(product.productType),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveVariant.mutateAsync({
        variantId: variant?.id ?? null,
        payload: toVariantPayload(values, variant),
      });
      toast.add({
        type: "success",
        title: variant ? "บันทึก variant แล้ว" : "เพิ่ม variant แล้ว",
      });
      onSaved();
    } catch (error) {
      if (hasErrorCode(error, "SKU_ALREADY_USED")) {
        setError("sku", {
          type: "server",
          message: catalogErrorMessage(error, ""),
        });
        return;
      }
      // ชื่อฟิลด์ใน violations ตรงกับชื่อช่องอยู่แล้ว ไม่ต้อง map
      // ตัวตนซ้ำ (VARIANT_ALREADY_EXISTS) เกี่ยวกับหลายช่องพร้อมกัน ไปโผล่ที่ Alert
      if (!applyApiErrors(error, setError)) {
        setError("root.server", {
          message: catalogErrorMessage(
            error,
            "บันทึก variant ไม่สำเร็จ ลองใหม่อีกครั้ง",
          ),
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
        <div className="grid gap-4 sm:grid-cols-3">
          <Field data-invalid={Boolean(errors.languageCode) || undefined}>
            <FieldLabel htmlFor="languageCode">ภาษา</FieldLabel>
            <Input
              id="languageCode"
              maxLength={10}
              placeholder="EN"
              autoCapitalize="characters"
              className="uppercase"
              aria-invalid={Boolean(errors.languageCode)}
              {...register("languageCode")}
            />
            <FieldError errors={[errors.languageCode]} />
          </Field>

          <Field data-invalid={Boolean(errors.finish) || undefined}>
            <FieldLabel htmlFor="finish">Finish</FieldLabel>
            <Controller
              control={control}
              name="finish"
              render={({ field }) => (
                <Select
                  items={FINISH_ITEMS}
                  value={field.value}
                  onValueChange={(next) => {
                    if (next !== null) field.onChange(next);
                  }}
                >
                  <SelectTrigger
                    id="finish"
                    className="w-full"
                    onBlur={field.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {FINISH_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.finish]} />
          </Field>

          <Field data-invalid={Boolean(errors.edition) || undefined}>
            <FieldLabel htmlFor="edition">Edition</FieldLabel>
            <Controller
              control={control}
              name="edition"
              render={({ field }) => (
                <Select
                  items={EDITION_ITEMS}
                  value={field.value}
                  onValueChange={(next) => {
                    if (next !== null) field.onChange(next);
                  }}
                >
                  <SelectTrigger
                    id="edition"
                    className="w-full"
                    onBlur={field.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {EDITION_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.edition]} />
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.printingNote) || undefined}>
          <FieldLabel htmlFor="printingNote">หมายเหตุการพิมพ์</FieldLabel>
          <Input
            id="printingNote"
            maxLength={100}
            placeholder="เช่น Alt Art, Full Art — ว่างไว้ถ้าเป็นใบปกติ"
            aria-invalid={Boolean(errors.printingNote)}
            {...register("printingNote")}
          />
          <FieldDescription className="text-xs">
            เป็นส่วนหนึ่งของตัวตน variant ไม่ใช่คำอธิบาย
          </FieldDescription>
          <FieldError errors={[errors.printingNote]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.sku) || undefined}>
            <FieldLabel htmlFor="sku">SKU</FieldLabel>
            <Input
              id="sku"
              maxLength={64}
              placeholder="ว่างไว้ ระบบสร้างให้"
              className="uppercase"
              aria-invalid={Boolean(errors.sku)}
              {...register("sku")}
            />
            <FieldDescription className="text-xs">
              {variant
                ? "ลบให้ว่าง = คง SKU เดิม"
                : "สร้างจากเกม ชุด เลขการ์ด ภาษา และ finish"}
            </FieldDescription>
            <FieldError errors={[errors.sku]} />
          </Field>

          <Field data-invalid={Boolean(errors.barcode) || undefined}>
            <FieldLabel htmlFor="barcode">บาร์โค้ด</FieldLabel>
            <Input
              id="barcode"
              maxLength={64}
              placeholder="ไม่บังคับ"
              aria-invalid={Boolean(errors.barcode)}
              {...register("barcode")}
            />
            <FieldError errors={[errors.barcode]} />
          </Field>
        </div>

        <Field orientation="horizontal">
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <Switch
                id="variantActive"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldLabel htmlFor="variantActive" className="font-normal">
            เปิดใช้งาน — ปิดแล้วผู้ขายลงขาย variant นี้เพิ่มไม่ได้
          </FieldLabel>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          ยกเลิก
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {variant ? "บันทึก" : "เพิ่ม variant"}
        </Button>
      </DialogFooter>
    </form>
  );
}
