import { useState } from "react";

import { QueryBoundary } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { ProductTab, ProductTarget } from "../catalog.filters";
import { productTitle } from "../catalog.format";
import { useAdminProduct } from "../catalog.queries";
import type { CatalogProduct, Game } from "../catalog.types";

import { CatalogImageManager } from "./CatalogImageManager";
import { CatalogProductForm } from "./CatalogProductForm";
import { CatalogProductSheetSkeleton } from "./CatalogSkeleton";
import { CatalogVariantList } from "./CatalogVariantList";

type CatalogProductSheetProps = {
  /** `null` = ปิด */
  target: ProductTarget | null;
  tab: ProductTab;
  onTabChange: (tab: ProductTab) => void;
  games: Game[];
  /** เกมที่เปิดดูอยู่ในหน้า — ใช้เป็นเกมตั้งต้นตอนเพิ่มใหม่ */
  defaultGameId: number;
  /** สร้างเสร็จแล้ว เปิดตัวที่เพิ่งสร้างต่อเพื่อเพิ่ม variant และรูป */
  onCreated: (product: CatalogProduct) => void;
  onClose: () => void;
};

/**
 * หน้าต่างด้านขวาสำหรับเพิ่ม/แก้สินค้า — เปิดจาก `?product=new` หรือ `?product=<id>`
 * ลิงก์ตรงมาที่สินค้าได้ และกด back แล้วปิด
 */
export function CatalogProductSheet({
  target,
  tab,
  onTabChange,
  games,
  defaultGameId,
  onCreated,
  onClose,
}: CatalogProductSheetProps) {
  // จำตัวล่าสุดไว้ระหว่างเลื่อนปิด ไม่งั้นเนื้อหาหายไปก่อนหน้าต่างจะออกพ้นจอ
  const [shown, setShown] = useState(target);
  if (target !== null && target !== shown) {
    setShown(target);
  }

  return (
    <Sheet
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        {shown === "new" ? (
          <>
            <SheetHeader className="pr-14">
              <SheetTitle className="text-lg font-semibold">
                เพิ่มสินค้าใหม่
              </SheetTitle>
              <SheetDescription>
                เลือกเกมก่อน ช่องคุณสมบัติการ์ดจะเปลี่ยนตามเกม · variant
                และรูปเพิ่มได้หลังบันทึก
              </SheetDescription>
            </SheetHeader>
            <CatalogProductForm
              games={games}
              defaultGameId={defaultGameId}
              onCreated={onCreated}
              onCancel={onClose}
            />
          </>
        ) : shown !== null ? (
          <EditProductPanel
            key={shown}
            productId={shown}
            tab={tab}
            onTabChange={onTabChange}
            games={games}
            onClose={onClose}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function EditProductPanel({
  productId,
  tab,
  onTabChange,
  games,
  onClose,
}: {
  productId: number;
  tab: ProductTab;
  onTabChange: (tab: ProductTab) => void;
  games: Game[];
  onClose: () => void;
}) {
  const detail = useAdminProduct(productId);

  return (
    <QueryBoundary
      query={detail}
      loading={<CatalogProductSheetSkeleton />}
      errorTitle="โหลดสินค้าไม่สำเร็จ"
      errorMessage="สินค้านี้อาจไม่มีอยู่แล้ว หรือเชื่อมต่อไม่ได้"
    >
      {({ product, variants, images }) => {
        const game = games.find((candidate) => candidate.id === product.gameId);

        return (
          <>
            <SheetHeader className="pr-14">
              <SheetTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                {productTitle(product)}
                {!product.active ? (
                  <Badge variant="secondary" className="rounded-full">
                    ปิดใช้งาน
                  </Badge>
                ) : null}
              </SheetTitle>
              <SheetDescription>
                {game?.name ?? "เกมที่ไม่รู้จัก"} · /{product.slug}
              </SheetDescription>
            </SheetHeader>

            <Tabs
              value={tab}
              onValueChange={(next) => onTabChange(next as ProductTab)}
              className="min-h-0 flex-1 gap-4"
            >
              <TabsList className="mx-6">
                <TabsTrigger value="details">ข้อมูลสินค้า</TabsTrigger>
                <TabsTrigger value="variants">
                  Variant ({variants.length})
                </TabsTrigger>
                <TabsTrigger value="images">รูปภาพ ({images.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="flex min-h-0 flex-col">
                <CatalogProductForm
                  games={games}
                  product={product}
                  defaultGameId={product.gameId}
                  onCancel={onClose}
                />
              </TabsContent>

              <TabsContent value="variants" className="min-h-0 overflow-y-auto">
                <CatalogVariantList product={product} variants={variants} />
              </TabsContent>

              <TabsContent value="images" className="min-h-0 overflow-y-auto">
                <CatalogImageManager
                  product={product}
                  variants={variants}
                  images={images}
                  onRefresh={() => detail.refetch()}
                />
              </TabsContent>
            </Tabs>
          </>
        );
      }}
    </QueryBoundary>
  );
}
