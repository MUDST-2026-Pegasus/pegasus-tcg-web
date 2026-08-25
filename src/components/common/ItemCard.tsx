import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ItemCardProps = {
  /** URL ของภาพสินค้า/รายการ */
  imageSrc?: string;
  /** คำอธิบายภาพสำหรับ screen reader; ใช้ title หากไม่ได้ระบุ */
  imageAlt?: string;
  /** ป้ายประเภทของรายการ เช่น Sealed หรือ Single Card */
  badge: string;
  /** ชื่อรายการ รองรับได้สูงสุดสองบรรทัดตาม Design System */
  title: string;
  /** ข้อความราคา เช่น ฿2,450 */
  price: string;
  /** ปลายทางสำหรับเปิดรายละเอียดรายการ; เมื่อไม่ระบุ Card จะเป็นข้อมูลแบบไม่คลิก */
  href?: string;
  className?: string;
};

/**
 * Card สำหรับรายการสินค้า/คอนเทนต์ตาม Figma node 773:5312.
 *
 * ใช้เป็น global component ได้ทุกหน้าโดยส่งข้อมูลผ่าน props และกำหนด `href`
 * เมื่อต้องการให้ผู้ใช้เปิดหน้ารายละเอียดของรายการนั้น.
 */
export function ItemCard({
  imageSrc,
  imageAlt,
  badge,
  title,
  price,
  href,
  className,
}: ItemCardProps) {
  const card = (
    <Card
      className={cn(
        "w-[225px] max-w-full gap-3.5 rounded-xl py-4 shadow-none ring-1 ring-foreground/5",
        className,
      )}
    >
      <CardContent className="px-5">
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt ?? title}
              className="size-full object-cover"
            />
          ) : null}
        </div>
      </CardContent>

      <CardHeader className="gap-2.5 px-5">
        <Badge variant="secondary" className="h-[18px] rounded-full px-2 text-[10px]">
          {badge}
        </Badge>
        <CardTitle className="line-clamp-2 h-[42px] text-sm leading-[21px] font-semibold">
          {title}
        </CardTitle>
      </CardHeader>

      <CardFooter className="px-5">
        <p className="text-lg leading-6 font-semibold text-primary">{price}</p>
      </CardFooter>
    </Card>
  );

  if (!href) {
    return card;
  }

  return (
    <a
      href={href}
      aria-label={`${title} ${price}`}
      className="block w-fit max-w-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {card}
    </a>
  );
}
