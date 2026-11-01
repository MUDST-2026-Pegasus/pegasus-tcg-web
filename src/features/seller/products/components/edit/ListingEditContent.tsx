import { zodResolver } from "@hookform/resolvers/zod";
import { Eye } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";

import { ProductCard } from "@/components/common";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { formatBaht } from "@/features/seller/shared/seller.format";
import { usePublishPermission } from "@/features/seller/shared/seller.queries";
import { useFileUpload } from "@/hooks/use-file-upload";
import { applyApiErrors } from "@/lib/form";

import {
  CONDITION_OPTIONS,
  listingFormErrorMessage,
  selectedFromListing,
} from "../../listing-form.format";
import {
  useMarketSnapshot,
  useUpdateListing,
} from "../../listing-form.queries";
import {
  detailsChanged,
  listingSchema,
  MAX_LISTING_PHOTOS,
  pricingChanged,
  toDetailsPayload,
  toListingForm,
  toPricePayload,
  type ListingFormValues,
} from "../../listing-form.schema";
import { LISTING_STATUS_LABEL } from "../../products.format";
import { toNumber } from "../../products.format";
import type { SellerListing } from "../../products.types";
import { CatalogCardSummary } from "../create/CatalogCardSummary";
import { ConditionCard } from "../create/ConditionCard";
import { DetailsCard } from "../create/DetailsCard";
import { ListingPhotosCard } from "../create/ListingPhotosCard";
import { PricingCard } from "../create/PricingCard";
import { PricingTipCard } from "../create/PricingTipCard";

const PRODUCTS_PATH = "/seller/products";

type ListingEditContentProps = {
  listing: SellerListing;
  /** มาจากปุ่ม "ปรับราคาขาย" ในหน้าเติมสต็อก — โฟกัสช่องราคาให้เลย */
  focusPrice: boolean;
};

/**
 * หน้า "แก้ไขสินค้า" — ค่าตั้งต้นมาจาก `GET /sellers/me/listings/{id}` ทุกครั้ง
 *
 * - การ์ดกับสภาพเปลี่ยนไม่ได้ (`ListingDetailsRequest`: เป็นตลาดที่การ์ดบนประกาศอยู่)
 * - รายละเอียดกับรูป → `PUT` ทั้งชุด · ราคา → `PATCH .../price` เฉพาะตอนเปลี่ยน
 * - จำนวนกับต้นทุนมาจากคลัง เพิ่มผ่านหน้าเติมสต็อก
 */
export function ListingEditContent({
  listing,
  focusPrice,
}: ListingEditContentProps) {
  const { canPublish, reason } = usePublishPermission();
  const updateListing = useUpdateListing(listing.id);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema("edit")),
    defaultValues: toListingForm(listing),
  });
  const { control, setValue, getValues, setError, handleSubmit, reset, formState } =
    form;
  const values = useWatch({ control }) as ListingFormValues;

  const card = selectedFromListing(listing);
  const market = useMarketSnapshot(listing.card.variantId, listing.condition);
  const existingKeys = listing.photos.map((photo) => photo.imageKey);
  const keptExisting = values.imageKeys.filter((key) =>
    existingKeys.includes(key),
  ).length;

  const upload = useFileUpload({
    purpose: "LISTING_IMAGE",
    multiple: true,
    // รูปเดิมที่ยังเก็บไว้กินโควตา 10 รูปของประกาศด้วย
    maxFiles: MAX_LISTING_PHOTOS - keptExisting,
    onChange: (uploaded) => {
      const current = getValues("imageKeys");
      setValue(
        "imageKeys",
        [
          ...current.filter(
            (key) => existingKeys.includes(key) || uploaded.includes(key),
          ),
          ...uploaded.filter((key) => !current.includes(key)),
        ],
        { shouldDirty: true, shouldValidate: formState.isSubmitted },
      );
    },
  });

  const isClosed =
    listing.status === "DELISTED" || listing.status === "BLOCKED";
  const hasChanges =
    detailsChanged(values, listing) || pricingChanged(values, listing);

  const onSubmit = handleSubmit(async (submitted) => {
    try {
      const latest = await updateListing.mutateAsync({
        details: detailsChanged(submitted, listing)
          ? toDetailsPayload(submitted)
          : null,
        price: pricingChanged(submitted, listing)
          ? toPricePayload(submitted)
          : null,
      });
      // รูปใหม่กลายเป็นรูปของประกาศแล้ว ไม่ต้องค้างในรายการอัปโหลด
      upload.clear();
      if (latest) reset(toListingForm(latest));
      toast.add({ type: "success", title: "บันทึกการเปลี่ยนแปลงแล้ว" });
    } catch (error) {
      if (!applyApiErrors(error, setError)) {
        setError("root.server", {
          message: listingFormErrorMessage(
            error,
            "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง",
          ),
        });
      }
    }
  });

  const selectedCondition = CONDITION_OPTIONS.find(
    (option) => option.value === listing.condition,
  );
  const price = toNumber(values.price);
  const firstKey = values.imageKeys[0];
  const previewImage =
    listing.photos.find((photo) => photo.imageKey === firstKey)?.url ??
    upload.items.find((item) => item.objectKey === firstKey)?.previewUrl ??
    card.imageUrl ??
    undefined;

  const blockedReason = !canPublish ? (reason ?? undefined) : undefined;
  const twin = listing.similarListings[0];

  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs text-gray-500 sm:gap-1.5">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={PRODUCTS_PATH} />}>
              จัดการสินค้า
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>{listing.card.productName}</BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-gray-700">
              แก้ไขสินค้า
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-foreground">
            แก้ไขสินค้า
            <Badge variant="outline" className="rounded-full text-xs font-medium">
              {LISTING_STATUS_LABEL[listing.status]}
            </Badge>
          </h1>
          <p className="text-xs text-gray-500">
            แก้ราคา รายละเอียด และรูปของประกาศ — สภาพเปลี่ยนไม่ได้ จำนวนเพิ่มผ่านการเติมสต็อก
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            render={<Link to={PRODUCTS_PATH} />}
            nativeButton={false}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            size="sm"
            className="rounded-md px-2.5"
            title={blockedReason}
            disabled={
              !hasChanges ||
              isClosed ||
              !canPublish ||
              formState.isSubmitting ||
              upload.isUploading
            }
          >
            {formState.isSubmitting ? <Spinner data-icon="inline-start" /> : null}
            บันทึกการเปลี่ยนแปลง
          </Button>
        </div>
      </div>

      {isClosed ? (
        <Alert>
          <AlertDescription>
            ประกาศนี้{LISTING_STATUS_LABEL[listing.status]} แก้ไขไม่ได้แล้ว
          </AlertDescription>
        </Alert>
      ) : blockedReason ? (
        <Alert>
          <AlertDescription>{blockedReason}</AlertDescription>
        </Alert>
      ) : null}
      {twin ? (
        <Alert>
          <AlertDescription>
            ประกาศ #{twin.id}
            {twin.lotLabel ? ` (${twin.lotLabel})` : ""} ของคุณขายการ์ดใบนี้สภาพเดียวกันอยู่
            {twin.samePrice ? " ในราคาเดียวกัน" : ""} — พิจารณารวมเป็นประกาศเดียว
          </AlertDescription>
        </Alert>
      ) : null}
      {formState.errors.root?.server?.message ? (
        <Alert variant="destructive">
          <AlertDescription>{formState.errors.root.server.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <CatalogCardSummary title="การ์ดในประกาศนี้" card={card} />

          <ConditionCard
            value={listing.condition}
            onValueChange={() => undefined}
            disabled
          />

          <PricingCard
            form={form}
            mode="edit"
            market={{
              data: market.data,
              isPending: market.isPending,
              enabled: true,
            }}
            stock={{
              quantityAvailable: listing.quantityAvailable,
              restockTo: `${PRODUCTS_PATH}/${listing.id}/restock`,
            }}
            autoFocusPrice={focusPrice}
          />

          <DetailsCard form={form} />

          <ListingPhotosCard
            form={form}
            upload={upload}
            existing={listing.photos}
          />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <div className="flex items-center gap-1.5">
            <Eye aria-hidden="true" className="size-4 text-slate-500" />
            <p className="text-xs font-medium text-gray-500">
              ตัวอย่างที่ผู้ซื้อจะเห็น
            </p>
          </div>

          <div className="flex justify-center">
            <ProductCard
              className="w-56"
              product={{
                id: String(listing.id),
                type: selectedCondition?.badgeLabel ?? "—",
                title: listing.card.productName,
                price: price === null ? "฿—" : formatBaht(price),
                image: previewImage,
                imageAlt: listing.card.productName,
              }}
            />
          </div>

          <PricingTipCard />
        </div>
      </div>
    </form>
  );
}
