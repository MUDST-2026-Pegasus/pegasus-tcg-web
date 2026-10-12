import { useState } from "react";

import { ImagePlus } from "lucide-react";

import { EmptyState, FileUpload } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";

import { catalogErrorMessage, variantLabel } from "../catalog.format";
import {
  useAddImage,
  useDeleteImage,
  useSetPrimaryImage,
} from "../catalog.queries";
import type {
  CatalogImage,
  CatalogProduct,
  CatalogVariant,
} from "../catalog.types";

import { CatalogImageTile } from "./CatalogImageTile";
import { DeleteImageDialog } from "./DeleteImageDialog";

/** ค่าที่ Select ใช้แทน "ทุก variant" — Base UI Select ไม่รับ `null` เป็นตัวเลือก */
const ALL_VARIANTS = "all";

/** อัปทีละหลายรูปได้ แต่ไม่ควรเยอะจนหน้าค้าง */
const MAX_FILES = 10;

type CatalogImageManagerProps = {
  product: CatalogProduct;
  variants: CatalogVariant[];
  images: CatalogImage[];
  /** ดึงสินค้าใหม่ — ใช้ขอ signed URL ตัวใหม่ตอนรูปหมดอายุ */
  onRefresh: () => Promise<unknown>;
};

/**
 * แท็บรูปภาพ — เพิ่ม / ตั้งรูปหลัก / ลบ
 *
 * เพิ่มรูปมีสองจังหวะ: เลือกไฟล์แล้วอัปขึ้น storage ทันที (`useFileUpload` —
 * presign → PUT) ได้ object key มา แล้วกด "แนบรูป" ค่อยยิง `POST .../images`
 * ทีละรูปตามลำดับที่เลือก backend เช็คว่าไฟล์มาถึงจริงก่อนบันทึก
 * รูปแรกของสินค้าเป็นรูปหลักให้เองเสมอ
 */
export function CatalogImageManager({
  product,
  variants,
  images,
  onRefresh,
}: CatalogImageManagerProps) {
  const upload = useFileUpload({
    purpose: "CATALOG_IMAGE",
    multiple: true,
    maxFiles: MAX_FILES,
  });
  const addImage = useAddImage(product.id);
  const setPrimary = useSetPrimaryImage(product.id);
  const deleteImage = useDeleteImage(product.id);

  const [scope, setScope] = useState(ALL_VARIANTS);
  const [isAttaching, setIsAttaching] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogImage | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const ready = upload.items.filter((item) => item.objectKey !== null);
  const scopeItems = [
    { value: ALL_VARIANTS, label: "ทุก variant (ใช้ร่วมกัน)" },
    ...variants
      .filter((variant) => variant.active || String(variant.id) === scope)
      .map((variant) => ({
        value: String(variant.id),
        label: variantLabel(variant),
      })),
  ];

  const labelOf = (image: CatalogImage): string | null => {
    if (image.catalogVariantId === null) return null;
    const variant = variants.find((v) => v.id === image.catalogVariantId);
    return variant ? variantLabel(variant) : "variant ที่ไม่พบ";
  };

  /**
   * แนบทีละรูปตามลำดับ ลำดับบนจอจะได้ตรงกับที่เลือก รูปที่แนบสำเร็จหายจากรายการอัปโหลด
   * รูปที่พลาดค้างไว้ให้กดแนบซ้ำหรือเอาออกเอง แล้วสรุปผลใน toast เดียว
   */
  async function handleAttach() {
    const catalogVariantId = scope === ALL_VARIANTS ? null : Number(scope);
    const failures: string[] = [];
    let attached = 0;

    setIsAttaching(true);
    for (const item of ready) {
      try {
        await addImage.mutateAsync({
          imageKey: item.objectKey as string,
          catalogVariantId,
          altText: null,
          primary: false,
        });
        upload.remove(item.id);
        attached += 1;
      } catch (error) {
        failures.push(
          `${item.file.name}: ${catalogErrorMessage(error, "แนบไม่สำเร็จ")}`,
        );
      }
    }
    setIsAttaching(false);

    if (failures.length === 0) {
      toast.add({ type: "success", title: `แนบรูปแล้ว ${attached} รูป` });
    } else {
      toast.add({
        type: "error",
        title:
          attached > 0
            ? `แนบได้ ${attached} รูป ไม่สำเร็จ ${failures.length} รูป`
            : "แนบรูปไม่สำเร็จ",
        description: failures.join(" · "),
      });
    }
  }

  function handleMakePrimary(image: CatalogImage) {
    setPrimary.mutate(image.id, {
      onSuccess: () => toast.add({ type: "success", title: "ตั้งรูปหลักแล้ว" }),
      onError: (error) =>
        toast.add({
          type: "error",
          title: "ตั้งรูปหลักไม่สำเร็จ",
          description: catalogErrorMessage(error, "ลองใหม่อีกครั้ง"),
        }),
    });
  }

  function handleRequestDelete(image: CatalogImage) {
    deleteImage.reset();
    setDeleteTarget(image);
    setIsDeleteOpen(true);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteImage.mutate(deleteTarget.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        toast.add({ type: "success", title: "ลบรูปแล้ว" });
      },
    });
  }

  const busyImageId = setPrimary.isPending
    ? setPrimary.variables
    : deleteImage.isPending
      ? deleteImage.variables
      : null;

  return (
    <div className="flex flex-col gap-6 px-6 pb-6">
      {images.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="ยังไม่มีรูป"
          description="รูปแรกที่แนบจะเป็นรูปหลักที่โชว์บนการ์ดสินค้า"
          className="min-h-48"
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <CatalogImageTile
              key={image.id}
              image={image}
              alt={product.name}
              variantLabel={labelOf(image)}
              isBusy={busyImageId === image.id}
              onMakePrimary={() => handleMakePrimary(image)}
              onDelete={() => handleRequestDelete(image)}
              onExpired={onRefresh}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="text-sm font-medium">เพิ่มรูป</p>

        <FileUpload
          id="catalogImages"
          upload={upload}
          description="รูปการ์ดทางการ"
          disabled={isAttaching}
        />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <Field className="w-full sm:w-72">
            <FieldLabel htmlFor="imageScope">ใช้กับ</FieldLabel>
            <Select
              items={scopeItems}
              value={scope}
              onValueChange={(next) => setScope(next ?? ALL_VARIANTS)}
              disabled={isAttaching}
            >
              <SelectTrigger id="imageScope" className="w-full">
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
            <FieldDescription className="text-xs">
              ส่วนใหญ่ใช้ร่วมกัน เลือก variant เฉพาะเมื่อภาพต่างกันจริง เช่น Alt Art
            </FieldDescription>
          </Field>

          {/* ปิดระหว่างอัป ไม่งั้นไฟล์ที่ยังขึ้นไม่เสร็จจะหลุดไปจากการแนบรอบนี้ */}
          <Button
            type="button"
            disabled={ready.length === 0 || upload.isUploading || isAttaching}
            onClick={handleAttach}
          >
            {isAttaching && <Spinner data-icon="inline-start" />}
            {ready.length > 0 ? `แนบรูป ${ready.length} รูป` : "แนบรูป"}
          </Button>
        </div>
      </div>

      <DeleteImageDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        image={deleteTarget}
        isPending={deleteImage.isPending}
        error={deleteImage.error}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
