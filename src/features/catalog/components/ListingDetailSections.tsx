import { translate, useLanguage } from "@/lib/language";
import {
  CARD_FINISH_LABEL,
  CARD_EDITION_LABEL,
  languageLabel,
  rarityLabel,
  cardDate,
} from "@/lib/card-labels";
import { Badge } from "@/components/ui/badge";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Droplets,
  Zap,
  Leaf,
  Eye,
  Circle,
  TrendingUp,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ZoomIn,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSaleBaht } from "@/components/sale";
import { ProductImage } from "./ProductDetailSections";
import {
  certificateHref,
  displayValue,
  marketHint,
  sortedEffects,
} from "../listing-detail.format";
import { listingText as t } from "../listing-detail.messages";
import type {
  CardSetDto,
  CatalogCardEffectDto,
  CatalogVariantDto,
  GameAttributeDto,
  MarketStatDto,
  ProductDetailDto,
  PublicListingDetailDto,
} from "../catalog.types";
import { CONDITION_LABELS } from "../catalog.mappers";
import { cn } from "@/lib/utils";

export function ListingGallery({
  photos,
  title,
  catalog,
  grade,
  cert,
}: {
  photos: string[];
  title: string;
  catalog: boolean;
  grade?: string;
  cert?: string | null;
}) {
  useLanguage();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const selected = Math.min(index, Math.max(0, photos.length - 1));
  const move = (step: number) =>
    setIndex((selected + step + photos.length) % photos.length);
  return (
    <div className="min-w-0 space-y-5">
      <div className="relative flex aspect-[7/8] items-center justify-center overflow-hidden rounded-[20px] bg-foreground">
        {photos[selected] ? (
          <button
            aria-label={t.zoom}
            onClick={() => setOpen(true)}
            className="h-full w-full cursor-zoom-in"
          >
            <ProductImage
              key={photos[selected]}
              src={photos[selected]}
              alt={title}
              className="h-full w-full object-contain"
            />
          </button>
        ) : (
          <p className="text-sm text-white">{t.noPhoto}</p>
        )}
        <span className="pointer-events-none absolute top-4 left-4 flex max-w-[75%] items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
          {grade ? (
            <strong>
              {grade}
              {cert ? ` · Cert #${cert}` : ""}
            </strong>
          ) : (
            <>
              <Camera className="size-3.5" />
              {catalog ? t.catalogPhoto : t.sellerPhoto}
            </>
          )}
        </span>
        {photos.length > 0 && (
          <span className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
            {selected + 1} / {photos.length}
          </span>
        )}
        {photos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-1/2 left-4 rounded-full"
              aria-label={t.previous}
              onClick={() => move(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-1/2 right-4 rounded-full"
              aria-label={t.next}
              onClick={() => move(1)}
            >
              <ChevronRight />
            </Button>
          </>
        )}
        {photos.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-4 bottom-4 rounded-full"
            onClick={() => setOpen(true)}
          >
            <ZoomIn className="size-4" />
            {t.zoom}
          </Button>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={`${photo}-${i}`}
              aria-label={t.photoAt(i + 1)}
              aria-pressed={selected === i}
              onClick={() => setIndex(i)}
              className={cn(
                "aspect-square w-[calc((100%-36px)/4)] shrink-0 overflow-hidden rounded-xl border-2 bg-card",
                selected === i ? "border-primary" : "border-transparent",
              )}
            >
              <ProductImage
                src={photo}
                alt=""
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[95vh] sm:max-w-4xl">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <img
            src={photos[selected]}
            alt={title}
            className="max-h-[80vh] w-full object-contain"
          />
          {photos.length > 1 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                aria-label={t.previous}
                onClick={() => move(-1)}
              >
                <ChevronLeft />
              </Button>
              <span>
                {selected + 1} / {photos.length}
              </span>
              <Button
                variant="outline"
                aria-label={t.next}
                onClick={() => move(1)}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ListingMarketHint({
  market,
  price,
  condition,
}: {
  condition?: string;
  market: MarketStatDto | null | undefined;
  price: number;
}) {
  useLanguage();
  const hint = marketHint(market, price);
  const labels = {
    none: t.noMarket,
    low: t.lowSample,
    equal: t.equal,
    below: t.below,
    above: t.above,
  };
  return (
    <div
      className="flex flex-wrap items-center gap-2 text-xs"
      data-market-hint={hint.kind}
    >
      <span
        className={cn(
          "rounded-full px-2.5 py-1 font-medium",
          hint.kind === "below" || hint.kind === "equal"
            ? "bg-emerald-50 text-emerald-700"
            : hint.kind === "above"
              ? "bg-amber-50 text-amber-700"
              : "bg-muted text-muted-foreground",
        )}
      >
        <TrendingUp className="mr-1 inline size-3" />
        {labels[hint.kind]}
        {hint.kind === "below" || hint.kind === "above"
          ? ` ${hint.percent.toFixed(0)}%`
          : ""}
      </span>
      {market?.medianPrice != null && (
        <span className="text-muted-foreground">
          {t.median} {condition}{translate("30 วัน", "30 days")}{formatSaleBaht(market.medianPrice)}
        </span>
      )}
    </div>
  );
}

type Row = [string, unknown];
export function InformationGroup({
  title,
  rows,
}: {
  title: string;
  rows: Row[];
}) {
  useLanguage();
  const visible = rows.flatMap(([label, value]) => {
    const text = displayValue(value);
    return text == null ? [] : [[label, text]];
  });
  if (!visible.length) return null;
  return (
    <div className="min-w-0">
      {title && <h3 className="mb-2 text-sm font-semibold text-primary">{title}</h3>}
      <dl>
        {visible.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-3 border-b py-3 text-[13px] last:border-b-0"
          >
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium break-words">
              {label === t.condition ? (
                <Badge variant="secondary">{value}</Badge>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ListingCardInformation({
  data,
  listing,
  variant,
  cardSet,
  gameName,
  gameCode,
  definitions,
  effects,
  cert,
  errorAction,
}: {
  data: ProductDetailDto;
  listing: PublicListingDetailDto["listing"];
  variant?: CatalogVariantDto;
  cardSet?: CardSetDto;
  gameName?: string;
  gameCode?: string;
  definitions: GameAttributeDto[];
  effects: CatalogCardEffectDto[];
  cert: string | null;
  errorAction?: ReactNode;
}) {
  useLanguage();
  const product = data.product;
  const attr = product.attributes ?? {};
  const pokemon = gameCode?.toUpperCase() === "POKEMON";
  const supertype = String(attr.supertype ?? "").toLowerCase();
  const energy = pokemon && supertype === "energy";
  const specialEnergy =
    energy &&
    (String(attr.subtype ?? attr.energy_type ?? "")
      .toLowerCase()
      .includes("special") ||
      (Array.isArray(attr.subtypes) &&
        attr.subtypes.some((x) =>
          String(x).toLowerCase().includes("special"),
        )));
  const trainer = pokemon && supertype === "trainer";
  const shownEffects = energy && !specialEnergy ? [] : sortedEffects(effects);
  const certUrl = certificateHref(listing.gradingCompany, cert);
  const gameRows: Row[] = [...definitions]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .filter((d) => !["artist", "supertype"].includes(d.attrKey))
    .filter(
      (d) =>
        !trainer ||
        ["trainer_type", "subtype", "subtypes", "card_type"].includes(
          d.attrKey,
        ),
    )
    .map((d) => [
      d.label,
      Array.isArray(attr[d.attrKey])
        ? (attr[d.attrKey] as unknown[]).join(" · ")
        : attr[d.attrKey],
    ]);
  return (
    <section
      className="rounded-[20px] border bg-card p-6 sm:p-7"
      aria-label={t.cardInfo}
    >
      <div className="mb-6 flex justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{t.cardInfo}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.name}
            {product.cardNumber ? ` · #${product.cardNumber}` : ""}
          </p>
        </div>
        <Link
          to={`/products/${encodeURIComponent(product.slug)}`}
          className="text-xs text-primary hover:underline"
        >
          {t.catalog} ›
        </Link>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <InformationGroup
          title={t.card}
          rows={[
            [t.game, gameName],
            [t.set, cardSet?.nameLocal || cardSet?.name],
            [t.number, product.cardNumber],
            [t.rarity, rarityLabel(product.rarityCode)],
            [
              t.release,
              cardSet?.releaseDate ? cardDate(cardSet.releaseDate) : null,
            ],
            [t.artist, attr.artist],
          ]}
        />
        <div>
          <InformationGroup
            title={t.offeredCard}
            rows={[
              [t.language, languageLabel(variant?.languageCode)],
              [
                t.finish,
                variant?.finish === "NOT_APPLICABLE"
                  ? null
                  : (CARD_FINISH_LABEL[variant?.finish ?? ""] ??
                    variant?.finish),
              ],
              [
                t.edition,
                variant?.edition === "NOT_APPLICABLE"
                  ? null
                  : (CARD_EDITION_LABEL[variant?.edition ?? ""] ??
                    variant?.edition),
              ],
              ...(listing.gradingCompany
                ? ([
                    [t.gradingCompany, listing.gradingCompany],
                    [t.grade, listing.gradeValue],
                  ] as Row[])
                : ([
                    [t.condition, CONDITION_LABELS[listing.condition]],
                    [t.grading, t.raw],
                  ] as Row[])),
            ]}
          />
          {listing.gradingCompany && cert && (
            <div className="flex justify-between gap-3 border-t py-3 text-[13px]">
              <span className="text-muted-foreground">{t.cert}</span>
              {certUrl ? (
                <a
                  href={certUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary"
                >
                  {cert}
                  <ExternalLink className="size-3" />
                </a>
              ) : (
                <span>{cert}</span>
              )}
            </div>
          )}
          <InformationGroup
            title=""
            rows={[[t.sku, variant?.sku || listing.card.sku]]}
          />
        </div>
        {!energy && (
          <InformationGroup
            title={
              trainer ? t.trainer : pokemon ? t.pokemon : (gameName ?? t.game)
            }
            rows={gameRows}
          />
        )}
      </div>
      {errorAction}
      {shownEffects.length > 0 && (
        <div className="mt-6 space-y-3 border-t pt-6">
          <h3 className="text-sm font-semibold text-primary">
            {trainer || specialEnergy || !pokemon ? t.effects : t.attacks}
          </h3>
          {shownEffects.map((effect, i) => (
            <article
              key={`${effect.effectType}-${effect.displayOrder}-${i}`}
              className={cn(
                "rounded-xl p-3.5",
                effect.effectType === "RULE" ? "bg-amber-50" : "bg-muted/60",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="rounded bg-card px-2 py-1 text-[11px] text-muted-foreground">
                  {effect.effectType === "ABILITY"
                    ? t.ability
                    : effect.effectType === "ATTACK"
                      ? t.attack
                      : t.rule}
                </span>
                {effect.energyCost.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {effect.energyCost.map((energy, n) => {
                      const Icon =
                        (
                          {
                            Fire: Flame,
                            Water: Droplets,
                            Lightning: Zap,
                            Grass: Leaf,
                            Psychic: Eye,
                          } as Record<string, typeof Circle>
                        )[energy] ?? Circle;
                      return (
                        <Icon
                          key={n}
                          aria-label={energy}
                          className="inline size-4"
                        />
                      );
                    })}
                  </span>
                )}
                <h4 className="text-sm font-semibold">{effect.name}</h4>
                {effect.damage != null && (
                  <strong className="ml-auto text-sm">{effect.damage}</strong>
                )}
              </div>
              {effect.effectText && (
                <p className="mt-1 pl-0 text-xs leading-relaxed text-muted-foreground sm:pl-14">
                  {effect.effectText}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
      {product.description && (
        <p className="mt-5 whitespace-pre-wrap text-sm text-muted-foreground">
          {product.description}
        </p>
      )}
    </section>
  );
}

export function ListingInformationSkeleton() {
  useLanguage();
  return (
    <section
      aria-label={t.loadingInfo}
      aria-busy="true"
      className="min-h-[480px] rounded-[20px] border bg-card p-7"
    >
      <Skeleton className="mb-6 h-6 w-40" />
      <div className="grid gap-8 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-5">
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <Skeleton key={j} className="h-6 w-full" />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ListingDetailSkeleton() {
  useLanguage();
  return (
    <main
      className="mx-auto max-w-[1280px] space-y-7 px-5 py-7 lg:px-20"
      role="status"
      aria-label={t.loading}
      aria-busy="true"
    >
      <Skeleton className="h-5 w-2/3" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,560fr)_minmax(0,520fr)]">
        <div>
          <Skeleton className="aspect-[7/8] w-full rounded-[20px]" />
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[528px] w-full rounded-[20px]" />
          <Skeleton className="h-40 w-full rounded-[20px]" />
        </div>
      </div>
      <Skeleton className="h-96 w-full rounded-[20px]" />
    </main>
  );
}
