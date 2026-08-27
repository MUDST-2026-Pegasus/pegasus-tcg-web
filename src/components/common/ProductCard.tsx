import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  /** ป้ายบอกชนิดสินค้า เช่น "การ์ดเดี่ยว", "กล่องสุ่ม" */
  type: string;
  title: string;
  price: string;
  image?: string;
  imageAlt?: string;
};

type ProductCardProps = {
  product: ProductCardData;
  className?: string;
};

/**
 * การ์ดสินค้าแบบ Grid ตาม component "Product Card / Layout=Grid" ใน Figma
 * (รูปด้านบน → ป้ายชนิด → ชื่อ → ราคาสีหลัก)
 *
 * ใช้ร่วมกันได้ทุก feature ที่ต้องโชว์สินค้าเป็นตาราง เช่น หน้าแรก, หน้าร้าน,
 * แคตตาล็อกหลังบ้าน
 */
export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <Card
      className={cn(
        "w-full gap-0 rounded-lg border border-border p-0 shadow-none ring-0",
        className,
      )}
    >
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {product.image ? (
          <img
            src={product.image}
            alt={product.imageAlt ?? product.title}
            className="size-full object-contain"
          />
        ) : null}
      </div>

      {/* ความสูงคงที่ 146px ตามดีไซน์ ทุกใบในแถวจึงสูงเท่ากันแม้ชื่อยาวไม่เท่ากัน */}
      <div className="flex h-[146px] flex-col justify-between px-4 pt-[18px] pb-4">
        <div className="flex flex-col gap-3">
          <span className="w-fit rounded-[4px] bg-primary-foreground px-2 py-1 text-[10px] leading-[15px] font-semibold text-foreground">
            {product.type}
          </span>
          {/* ล็อกไว้ 2 บรรทัด (2 × leading-5) ให้ราคาอยู่ระดับเดียวกันทุกใบ */}
          <p className="line-clamp-2 h-10 text-sm leading-5 text-foreground">
            {product.title}
          </p>
        </div>

        <p className="text-lg leading-6 font-semibold text-primary">
          {product.price}
        </p>
      </div>
    </Card>
  );
}
