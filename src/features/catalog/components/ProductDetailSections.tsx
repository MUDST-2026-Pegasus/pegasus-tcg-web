import { useState, type ReactNode } from "react";
import { BadgeCheck, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";

import { TextLinesSkeleton } from "@/components/common/PageSkeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useProductCardEffects } from "../catalog.queries";
import type { ProductDetailDto } from "../catalog.types";
import { useTranslate } from "@/lib/i18n";

// ---------- ส่วนของหน้ารายละเอียดที่ใช้ร่วมกัน [TCG-629] ----------
// หน้าสินค้า (`ProductDetailPage`) และหน้าประมูล (`AuctionDetailPage`) หน้าตาเหมือนกันตรงนี้

export type GalleryImage = { id: string | number; url: string; alt: string };

/** รูปที่โหลดพังแล้วขึ้นข้อความแทน ไม่ให้เห็นไอคอนรูปแตก */
export function ProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { t } = useTranslate("buyer");
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex min-h-24 items-center justify-center p-4 text-center text-sm text-muted-foreground">
        {t("product.imageFailed", "โหลดรูปไม่ได้ กรุณาลองโหลดข้อมูลใหม่")}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

/**
 * แกลเลอรีคอลัมน์ซ้าย: แถบรูปย่อ + รูปใหญ่
 * @param emptyAction แสดงใต้ข้อความ "ยังไม่มีรูปสินค้า" เช่นปุ่มโหลดใหม่
 */
export function ProductGallery({
  images,
  selectedId,
  onSelect,
  emptyAction,
}: {
  images: GalleryImage[];
  selectedId: GalleryImage["id"] | null;
  onSelect: (id: GalleryImage["id"]) => void;
  emptyAction?: ReactNode;
}) {
  const { t } = useTranslate("buyer");
  const current = images.find((image) => image.id === selectedId) ?? images[0];
  return (
    <div className={cn("grid min-w-0 gap-4", images.length > 0 ? "sm:grid-cols-[78px_minmax(0,1fr)]" : "sm:grid-cols-1")}>
      {images.length > 0 && (
        <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onSelect(image.id)}
              aria-label={t("product.viewImage", "ดูรูปสินค้าที่ {n}", { n: index + 1 })}
              aria-pressed={current?.id === image.id}
              className={cn(
                "flex aspect-[3/4] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-card p-1.5 transition sm:w-full",
                current?.id === image.id ? "border-primary shadow-sm" : "border-transparent hover:border-primary/40",
              )}
            >
              <ProductImage key={image.url} src={image.url} alt={image.alt} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
      <div className="order-1 flex min-h-[500px] flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-8 shadow-sm sm:order-2 lg:min-h-[620px]">
        {current ? (
          <ProductImage
            key={current.url}
            src={current.url}
            alt={current.alt}
            className="max-h-[560px] w-full object-contain drop-shadow-[0_18px_24px_rgba(24,24,27,0.22)]"
          />
        ) : (
          <p className="text-center text-sm text-muted-foreground">{t("product.noImage", "ยังไม่มีรูปสินค้า")}</p>
        )}
        {!current && emptyAction}
      </div>
    </div>
  );
}

/** ป้ายเกม + ความหายาก เหนือชื่อสินค้า */
export function ProductBadges({ game, rarity }: { game: string; rarity: string | null }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold tracking-wide text-primary uppercase">{game}</span>
      {rarity && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{rarity}</span>}
    </div>
  );
}

/** แถบ Tracked shipping / Buyer protection / Verified sellers */
export function TrustStrip() {
  const { t } = useTranslate("buyer");
  return (
    <div className="grid grid-cols-3 divide-x rounded-2xl border bg-card px-2 py-4 text-center">
      <div className="px-2"><Truck className="mx-auto mb-2 size-5 text-primary" /><p className="text-xs font-semibold">{t("product.trust.shipping", "จัดส่งแบบมีเลขพัสดุ")}</p></div>
      <div className="px-2"><ShieldCheck className="mx-auto mb-2 size-5 text-primary" /><p className="text-xs font-semibold">{t("product.trust.protection", "คุ้มครองผู้ซื้อ")}</p></div>
      <div className="px-2"><BadgeCheck className="mx-auto mb-2 size-5 text-primary" /><p className="text-xs font-semibold">{t("product.trust.verified", "ผู้ขายที่ยืนยันตัวตนแล้ว")}</p></div>
    </div>
  );
}

type CatalogProduct = ProductDetailDto["product"];

/** กล่อง Card attributes */
export function CardAttributesCard({ product }: { product: CatalogProduct }) {
  const { t } = useTranslate("buyer");
  const attributes = product.attributes ?? {};
  const displayAttribute = (key: string) => {
    const value = attributes[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : "—";
  };
  const rows = [
    [t("product.attr.cardNumber", "หมายเลขการ์ด"), product.cardNumber || "—"],
    [t("product.attr.rarity", "ความหายาก"), product.rarityCode || "—"],
    [t("product.attr.cardType", "ประเภทการ์ด"), displayAttribute("card_type")],
    [t("product.attr.stage", "ระดับวิวัฒนาการ"), displayAttribute("stage")],
    ["HP", displayAttribute("hp")],
    [t("product.attr.artist", "ผู้วาดภาพ"), displayAttribute("artist")],
  ];
  return (
    <Card className="gap-0 rounded-2xl border bg-card p-0 shadow-none"><CardContent className="p-6 sm:p-7">
      <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold"><Sparkles className="size-5 text-primary" />{t("product.attr.title", "คุณสมบัติการ์ด")}</h2>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
        {rows.map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold break-words">{value}</dd></div>)}
      </dl>
      {product.description && <p className="mt-5 border-t pt-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{product.description}</p>}
    </CardContent></Card>
  );
}

/** กล่องความสามารถ / ท่าโจมตี — ใช้กับการ์ดใบเดียว (`SINGLE_CARD`) */
export function CardEffectsCard({ productId, title }: { productId: number; title?: string }) {
  const { t } = useTranslate("buyer");
  const effectsQuery = useProductCardEffects(productId);
  const effects = effectsQuery.data ?? [];
  return (
    <Card className="gap-0 rounded-2xl border bg-card p-0 shadow-none"><CardContent className="p-6 sm:p-7">
      <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold"><PackageCheck className="size-5 text-primary" />{title ?? t("product.effect.title", "ความสามารถและท่าโจมตี")}</h2>
      {effectsQuery.isPending ? (
        <div role="status" aria-busy="true" aria-label={t("product.effect.loading", "กำลังโหลดความสามารถการ์ด")}><TextLinesSkeleton lines={4} /></div>
      ) : effectsQuery.isError ? (
        <div role="alert" className="space-y-2 text-sm"><p>{t("product.effect.failed", "โหลดความสามารถการ์ดไม่สำเร็จ")}</p><Button variant="outline" onClick={() => void effectsQuery.refetch()}>{t("actions.retry", "ลองใหม่", { ns: "common" })}</Button></div>
      ) : effects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("product.effect.empty", "ยังไม่มีข้อมูลความสามารถและท่าโจมตีของการ์ดใบนี้")}</p>
      ) : (
        <div className="divide-y">
          {effects.map((effect, index) => (
            <div key={`${effect.effectType}-${effect.displayOrder}-${index}`} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{effect.effectType === "ABILITY" ? t("product.effect.ability", "ความสามารถ") : effect.effectType === "ATTACK" ? t("product.effect.attack", "ท่าโจมตี") : t("product.effect.rule", "กฎ")}</Badge>
                <h3 className="font-semibold">{effect.name}</h3>
                {effect.damage !== null && <strong className="ml-auto text-lg">{effect.damage}</strong>}
              </div>
              {effect.energyCost.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Energy: {effect.energyCost.join(" · ")}</p>}
              {effect.effectText && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{effect.effectText}</p>}
            </div>
          ))}
        </div>
      )}
    </CardContent></Card>
  );
}
