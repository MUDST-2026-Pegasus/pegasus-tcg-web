import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { hasErrorCode, isApiError } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

import {
  catalogErrorMessage,
  PRODUCT_TYPE_LABEL,
  PRODUCT_TYPES,
} from "../catalog.format";
import {
  useCachedGameAttributes,
  useCardSets,
  useCategories,
  useCreateProduct,
  useGameAttributes,
  useUpdateProduct,
} from "../catalog.queries";
import {
  emptyProductForm,
  productSchema,
  splitAttributeProblems,
  toProductForm,
  toProductPayload,
  type ProductFormValues,
} from "../catalog.schema";
import type { CatalogProduct, Game } from "../catalog.types";

import { GameAttributeFields } from "./GameAttributeFields";

/** ค่าที่ Select ใช้แทน "ไม่ระบุชุด" — Base UI Select ไม่รับ `""` เป็นตัวเลือก */
const NO_SET = "__none__";

type CatalogProductFormProps = {
  games: Game[];
  /** ไม่ส่งมา = เพิ่มสินค้าใหม่ */
  product?: CatalogProduct;
  /** เกมตั้งต้นตอนเพิ่มใหม่ — เกมที่เปิดดูอยู่ในหน้า */
  defaultGameId: number;
  onCreated?: (product: CatalogProduct) => void;
  onCancel: () => void;
};

/**
 * ฟอร์มเดียวใช้ทั้งเพิ่มและแก้ เพราะ `POST` กับ `PUT` รับ `ProductRequest` ตัวเดียวกัน
 *
 * - เกมเลือกได้ตอนสร้างเท่านั้น (backend ล็อกไว้เพราะ attributes ถูกตรวจกับเกมนั้นแล้ว)
 *   เปลี่ยนเกม = ล้างหมวด ชุด และ attributes เพราะเป็นของเกมเดิม
 * - ช่อง attributes วาดตาม registry ของเกมที่เลือก และตรวจด้วย registry เดียวกัน
 * - `PUT` เขียนทับทั้งแถว ค่าตั้งต้นของฟอร์มแก้ไขจึงมาจากสินค้าที่โหลดใหม่เสมอ
 */
export function CatalogProductForm({
  games,
  product,
  defaultGameId,
  onCreated,
  onCancel,
}: CatalogProductFormProps) {
  const isEdit = product !== undefined;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const cachedAttributes = useCachedGameAttributes();

  // registry ขึ้นกับเกมที่อยู่ในค่าของฟอร์มเอง จึงหยิบตอน validate จากเกมใน `values`
  const resolver: Resolver<ProductFormValues> = (values, context, options) =>
    zodResolver(productSchema(cachedAttributes(Number(values.gameId))))(
      values,
      context,
      options,
    );

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues>({
    resolver,
    defaultValues: product
      ? toProductForm(product)
      : emptyProductForm(defaultGameId),
  });

  const gameId = Number(useWatch({ control, name: "gameId" }));
  const game = games.find((candidate) => candidate.id === gameId);
  const attributes = useGameAttributes(gameId);
  const categories = useCategories(gameId);
  const cardSets = useCardSets(gameId);

  const registryReady = attributes.data !== undefined;

  function handleGameChange(next: string) {
    setValue("gameId", next, { shouldDirty: true });
    setValue("categoryId", "", { shouldDirty: true });
    setValue("cardSetId", "", { shouldDirty: true });
    setValue("attributes", {}, { shouldDirty: true });
  }

  const onSubmit = handleSubmit(async (values) => {
    const registry = attributes.data ?? [];
    const payload = toProductPayload(values, registry);

    try {
      if (product) {
        const updated = await updateProduct.mutateAsync({
          productId: product.id,
          payload,
        });
        // ค่าที่ backend เก็บจริง (ตัดช่องว่าง ตัดค่าว่างทิ้ง) กลายเป็นค่าตั้งต้นใหม่
        reset(toProductForm(updated));
        toast.add({ type: "success", title: "บันทึกสินค้าแล้ว" });
      } else {
        const created = await createProduct.mutateAsync(payload);
        toast.add({
          type: "success",
          title: "เพิ่มสินค้าแล้ว",
          description: "เพิ่ม variant และรูปต่อได้เลย",
        });
        onCreated?.(created);
      }
    } catch (error) {
      // ปัญหาของ attributes มาเป็นข้อความเดียว แยกกลับไปแปะใต้แต่ละช่อง
      if (hasErrorCode(error, "INVALID_PRODUCT_ATTRIBUTES") && isApiError(error)) {
        const { fields, unmatched } = splitAttributeProblems(
          error.message,
          registry,
        );
        for (const field of fields) {
          setError(`attributes.${field.key}`, {
            type: "server",
            message: field.message,
          });
        }
        if (unmatched.length > 0) {
          setError("root.server", { message: unmatched.join(" · ") });
        }
        return;
      }
      if (hasErrorCode(error, "CATEGORY_NOT_FOUND")) {
        setError("categoryId", {
          type: "server",
          message: catalogErrorMessage(error, ""),
        });
        return;
      }
      if (hasErrorCode(error, "CARD_SET_NOT_FOUND")) {
        setError("cardSetId", {
          type: "server",
          message: catalogErrorMessage(error, ""),
        });
        return;
      }
      // ชื่อฟิลด์ใน violations ตรงกับชื่อช่องอยู่แล้ว ไม่ต้อง map
      // ตัวที่ไม่มีช่องรับผิดชอบ (เช่น หมวดเป็นของเกมอื่น) ไปโผล่ที่ Alert ด้านบน
      if (!applyApiErrors(error, setError)) {
        setError("root.server", {
          message: catalogErrorMessage(
            error,
            "บันทึกสินค้าไม่สำเร็จ ลองใหม่อีกครั้ง",
          ),
        });
      }
    }
  });

  const categoryItems = (categories.data ?? []).map((category) => ({
    value: String(category.id),
    label: category.active ? category.name : `${category.name} (ปิดแล้ว)`,
  }));
  const setItems = [
    { value: NO_SET, label: "ไม่ระบุชุด" },
    ...(cardSets.data ?? []).map((set) => ({
      value: String(set.id),
      label: `${set.name} (${set.code})`,
    })),
  ];
  const typeItems = PRODUCT_TYPES.map((type) => ({
    value: type,
    label: PRODUCT_TYPE_LABEL[type],
  }));
  const gameItems = games.map((candidate) => ({
    value: String(candidate.id),
    label: candidate.active
      ? candidate.name
      : `${candidate.name} (ปิดแล้ว)`,
  }));

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
        {errors.root?.server?.message && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.server.message}</AlertDescription>
          </Alert>
        )}

        <FieldSet>
          <FieldLegend variant="label">ข้อมูลหลัก</FieldLegend>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.gameId) || undefined}>
                <FieldLabel htmlFor="gameId">เกม</FieldLabel>
                <Controller
                  control={control}
                  name="gameId"
                  render={({ field }) => (
                    <Select
                      items={gameItems}
                      value={field.value}
                      onValueChange={(next) => {
                        if (next !== null) handleGameChange(String(next));
                      }}
                      disabled={isEdit}
                    >
                      <SelectTrigger
                        id="gameId"
                        className="w-full"
                        onBlur={field.onBlur}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {gameItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {isEdit ? (
                  <FieldDescription className="text-xs">
                    เปลี่ยนเกมไม่ได้หลังสร้างแล้ว
                  </FieldDescription>
                ) : null}
                <FieldError errors={[errors.gameId]} />
              </Field>

              <Field data-invalid={Boolean(errors.productType) || undefined}>
                <FieldLabel htmlFor="productType">ชนิดสินค้า</FieldLabel>
                <Controller
                  control={control}
                  name="productType"
                  render={({ field }) => (
                    <Select
                      items={typeItems}
                      value={field.value}
                      onValueChange={(next) => {
                        if (next !== null) field.onChange(next);
                      }}
                    >
                      <SelectTrigger
                        id="productType"
                        className="w-full"
                        onBlur={field.onBlur}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {typeItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.productType]} />
              </Field>

              <Field data-invalid={Boolean(errors.categoryId) || undefined}>
                <FieldLabel htmlFor="categoryId">หมวดหมู่</FieldLabel>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      items={categoryItems}
                      value={field.value === "" ? null : field.value}
                      onValueChange={(next) =>
                        field.onChange(next === null ? "" : String(next))
                      }
                      disabled={categories.isPending}
                    >
                      <SelectTrigger
                        id="categoryId"
                        className="w-full"
                        aria-invalid={Boolean(errors.categoryId)}
                        onBlur={field.onBlur}
                      >
                        <SelectValue
                          placeholder={
                            categories.isPending
                              ? "กำลังโหลดหมวดหมู่…"
                              : "เลือกหมวดหมู่"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {categoryItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.categoryId]} />
              </Field>

              <Field data-invalid={Boolean(errors.cardSetId) || undefined}>
                <FieldLabel htmlFor="cardSetId">ชุด (Set)</FieldLabel>
                <Controller
                  control={control}
                  name="cardSetId"
                  render={({ field }) => (
                    <Select
                      items={setItems}
                      value={field.value === "" ? NO_SET : field.value}
                      onValueChange={(next) =>
                        field.onChange(
                          next === null || next === NO_SET ? "" : String(next),
                        )
                      }
                      disabled={cardSets.isPending}
                    >
                      <SelectTrigger
                        id="cardSetId"
                        className="w-full"
                        aria-invalid={Boolean(errors.cardSetId)}
                        onBlur={field.onBlur}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {setItems.map((item) => (
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
                  อุปกรณ์เสริมไม่อยู่ในชุดไหน เลือก "ไม่ระบุชุด"
                </FieldDescription>
                <FieldError errors={[errors.cardSetId]} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.name) || undefined}>
                <FieldLabel htmlFor="name">ชื่อสินค้า</FieldLabel>
                <Input
                  id="name"
                  maxLength={255}
                  placeholder="เช่น Charizard ex"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={Boolean(errors.nameLocal) || undefined}>
                <FieldLabel htmlFor="nameLocal">ชื่อภาษาท้องถิ่น</FieldLabel>
                <Input
                  id="nameLocal"
                  maxLength={255}
                  placeholder="ไม่บังคับ เช่น ชื่อภาษาไทย/ญี่ปุ่น"
                  aria-invalid={Boolean(errors.nameLocal)}
                  {...register("nameLocal")}
                />
                <FieldError errors={[errors.nameLocal]} />
              </Field>

              <Field data-invalid={Boolean(errors.cardNumber) || undefined}>
                <FieldLabel htmlFor="cardNumber">เลขในชุด</FieldLabel>
                <Input
                  id="cardNumber"
                  maxLength={32}
                  placeholder="เช่น 006/197"
                  aria-invalid={Boolean(errors.cardNumber)}
                  {...register("cardNumber")}
                />
                <FieldError errors={[errors.cardNumber]} />
              </Field>

              <Field data-invalid={Boolean(errors.rarityCode) || undefined}>
                <FieldLabel htmlFor="rarityCode">ความหายาก</FieldLabel>
                <Input
                  id="rarityCode"
                  maxLength={32}
                  placeholder="เช่น SR, SAR"
                  aria-invalid={Boolean(errors.rarityCode)}
                  {...register("rarityCode")}
                />
                <FieldError errors={[errors.rarityCode]} />
              </Field>
            </div>

            <Field data-invalid={Boolean(errors.slug) || undefined}>
              <FieldLabel htmlFor="slug">Slug (ส่วนท้าย URL)</FieldLabel>
              <Input
                id="slug"
                maxLength={120}
                placeholder="ว่างไว้ ระบบสร้างจากชื่อและเลขการ์ดให้"
                aria-invalid={Boolean(errors.slug)}
                readOnly={isEdit}
                className={isEdit ? "text-muted-foreground" : undefined}
                {...register("slug")}
              />
              <FieldDescription className="text-xs">
                {isEdit
                  ? "เปลี่ยนไม่ได้หลังสร้างแล้ว เพราะลิงก์ที่แชร์ออกไปชี้มาที่นี่"
                  : "ใช้ได้แค่ a-z ตัวเล็ก ตัวเลข และขีดกลาง · ตั้งแล้วแก้ไม่ได้"}
              </FieldDescription>
              <FieldError errors={[errors.slug]} />
            </Field>

            <Field data-invalid={Boolean(errors.description) || undefined}>
              <FieldLabel htmlFor="description">คำอธิบาย</FieldLabel>
              <Textarea
                id="description"
                rows={3}
                placeholder="ไม่บังคับ"
                aria-invalid={Boolean(errors.description)}
                {...register("description")}
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <Field orientation="horizontal">
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <Switch
                    id="active"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <FieldLabel htmlFor="active" className="font-normal">
                เปิดใช้งาน — ปิดแล้วผู้ซื้อหาไม่เจอ และผู้ขายลงขายเพิ่มไม่ได้
              </FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">
            คุณสมบัติการ์ด{game ? ` · ${game.name}` : ""}
          </FieldLegend>
          <FieldDescription className="text-xs">
            ช่องเปลี่ยนตามเกมที่เลือก ตั้งค่าช่องได้ที่หน้า "คุณสมบัติการ์ด"
          </FieldDescription>
          {attributes.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full rounded-3xl" />
                </div>
              ))}
            </div>
          ) : attributes.data === undefined ? (
            <Alert variant="destructive">
              <AlertDescription>
                โหลดช่องคุณสมบัติของเกมนี้ไม่สำเร็จ{" "}
                <button
                  type="button"
                  className="cursor-pointer font-medium underline underline-offset-2"
                  onClick={() => attributes.refetch()}
                >
                  ลองใหม่
                </button>
              </AlertDescription>
            </Alert>
          ) : attributes.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              เกมนี้ยังไม่ได้กำหนดคุณสมบัติการ์ด
            </p>
          ) : (
            <GameAttributeFields
              registry={attributes.data}
              control={control}
              errors={errors}
            />
          )}
        </FieldSet>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {isEdit ? "ปิด" : "ยกเลิก"}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !registryReady || (isEdit && !isDirty)}
        >
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {isEdit ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
        </Button>
      </div>
    </form>
  );
}
