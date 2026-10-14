import { useEffect, useRef, useState } from "react";

import { ImageIcon, ScanBarcode, SearchIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatBaht } from "@/features/seller/shared/seller.format";
import { getErrorMessage, hasErrorCode } from "@/lib/api";
import { cn } from "@/lib/utils";

import {
  searchItemMeta,
  selectedFromCatalog,
  selectedFromLookup,
  variantLabelOf,
} from "../../listing-form.format";
import {
  MIN_SEARCH_LENGTH,
  useCatalogProduct,
  useCatalogSearch,
  useVariantLookup,
} from "../../listing-form.queries";
import type {
  CatalogSearchItem,
  SelectedCard,
} from "../../listing-form.types";

/** พิมพ์ค้างไว้ครู่หนึ่งค่อยค้น ไม่ยิงทุกตัวอักษร */
const SEARCH_DELAY_MS = 350;

type CardPickerProps = {
  onSelect: (card: SelectedCard) => void;
  /** error ของช่อง `catalogVariantId` เช่น กดถัดไปโดยยังไม่เลือก */
  error?: string;
};

/**
 * ขั้นที่ 1 — หาการ์ดในแคตตาล็อกกลางแล้วเลือก "พิมพ์" (ภาษา / finish / edition) ที่ตรงกับ
 * ใบในมือ ประกาศชี้ไปที่พิมพ์ ไม่ใช่ที่ตัวการ์ด เพราะ EN ปกติกับ JP Foil คนละราคา [RQ-5]
 *
 * มีสองทาง: ค้นจากชื่อ/เลขการ์ด หรือกรอก SKU / สแกนบาร์โค้ด (`/catalog/variants/by-code`)
 */
export function CardPicker({ onSelect, error }: CardPickerProps) {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [openProductId, setOpenProductId] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const search = useCatalogSearch(query);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleSearchInput(value: string) {
    setText(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setQuery(value.trim());
      setOpenProductId(null);
    }, SEARCH_DELAY_MS);
  }

  const items = search.data?.items ?? [];
  const tooShort = query.length < MIN_SEARCH_LENGTH;

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-base font-semibold text-zinc-950">
          เลือกการ์ดจากแคตตาล็อก
        </h2>
        <p className="text-xs text-gray-500">
          ค้นจากชื่อหรือเลขในชุด แล้วเลือกพิมพ์ (ภาษา / finish) ให้ตรงกับใบที่คุณมี
        </p>
      </div>

      <InputGroup className="h-9 rounded-lg bg-background">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label="ค้นหาการ์ดในแคตตาล็อก"
          placeholder="เช่น Charizard ex หรือ 006/197"
          value={text}
          onChange={(event) => handleSearchInput(event.target.value)}
          onKeyDown={(event) => {
            // Enter ค้นทันที และต้องไม่ส่งฟอร์มประกาศทั้งก้อน
            if (event.key === "Enter") {
              event.preventDefault();
              window.clearTimeout(timer.current);
              setQuery(text.trim());
            }
          }}
        />
      </InputGroup>

      {tooShort ? (
        <p className="text-xs text-gray-400">
          พิมพ์อย่างน้อย {MIN_SEARCH_LENGTH} ตัวอักษรเพื่อค้นหา
        </p>
      ) : search.isPending ? (
        <SearchSkeleton />
      ) : search.data === undefined ? (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(search.error, "ค้นหาการ์ดไม่สำเร็จ")}{" "}
            <button
              type="button"
              className="cursor-pointer font-medium underline underline-offset-2"
              onClick={() => search.refetch()}
            >
              ลองใหม่
            </button>
          </AlertDescription>
        </Alert>
      ) : items.length === 0 ? (
        <p className="rounded-lg bg-neutral-50 px-3.5 py-3 text-xs text-gray-500">
          ไม่พบการ์ดที่ตรงกับ "{query}" — ลองคำอื่น ค้นด้วย SKU / บาร์โค้ดด้านล่าง
          หรือแจ้งแอดมินให้เพิ่มการ์ดเข้าแคตตาล็อก
        </p>
      ) : (
        <ul
          aria-busy={search.isPlaceholderData || undefined}
          className={cn(
            "flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-100",
            search.isPlaceholderData && "opacity-60",
          )}
        >
          {items.map((item) => (
            <SearchResultRow
              key={item.id}
              item={item}
              isOpen={openProductId === item.id}
              onToggle={() =>
                setOpenProductId((current) =>
                  current === item.id ? null : item.id,
                )
              }
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3 text-[11px] text-gray-400">
        <span className="h-px flex-1 bg-gray-100" />
        หรือ
        <span className="h-px flex-1 bg-gray-100" />
      </div>

      <CodeLookup onSelect={onSelect} />

      <FieldError>{error}</FieldError>
    </Card>
  );
}

function SearchSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 p-2">
          <Skeleton className="size-10 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchResultRow({
  item,
  isOpen,
  onToggle,
  onSelect,
}: {
  item: CatalogSearchItem;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (card: SelectedCard) => void;
}) {
  const meta = searchItemMeta(item);

  return (
    <li className="flex flex-col">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
      >
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
          {item.primaryImageUrl ? (
            <img
              src={item.primaryImageUrl}
              alt=""
              className="size-full object-contain"
            />
          ) : (
            <ImageIcon aria-hidden="true" className="size-4 text-slate-400" />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-zinc-950">
            {item.name}
          </span>
          <span className="truncate text-[11px] text-gray-500">
            {meta || "—"}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-[11px] text-gray-500">
          <span>{item.variantCount} พิมพ์</span>
          {item.lowestPrice !== null ? (
            <span>เริ่ม {formatBaht(item.lowestPrice)}</span>
          ) : null}
        </span>
      </button>

      {isOpen ? (
        <VariantChooser item={item} onSelect={onSelect} />
      ) : null}
    </li>
  );
}

/** พิมพ์ทุกแบบของการ์ดใบหนึ่ง — โหลดเมื่อเปิดแถวนั้น */
function VariantChooser({
  item,
  onSelect,
}: {
  item: CatalogSearchItem;
  onSelect: (card: SelectedCard) => void;
}) {
  const detail = useCatalogProduct(item.id);

  if (detail.isPending) {
    return (
      <p className="flex items-center gap-2 px-3 pb-3 text-xs text-gray-500">
        <Spinner className="size-3.5" /> กำลังโหลดพิมพ์ของการ์ดนี้…
      </p>
    );
  }
  if (detail.data === undefined) {
    return (
      <p className="px-3 pb-3 text-xs text-destructive">
        {getErrorMessage(detail.error, "โหลดพิมพ์ของการ์ดนี้ไม่สำเร็จ")}
      </p>
    );
  }

  const variants = detail.data.variants.filter((variant) => variant.active);
  if (variants.length === 0) {
    return (
      <p className="px-3 pb-3 text-xs text-gray-500">
        การ์ดนี้ยังไม่มีพิมพ์ที่เปิดให้ลงขาย แจ้งแอดมินให้เพิ่ม variant
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 pb-3">
      <p className="text-[11px] font-medium text-gray-500">เลือกพิมพ์</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <Button
            key={variant.id}
            type="button"
            variant="outline"
            size="sm"
            className="h-auto flex-col items-start gap-0 rounded-lg px-3 py-1.5"
            onClick={() =>
              onSelect(
                selectedFromCatalog(
                  detail.data,
                  variant,
                  item.primaryImageUrl,
                ),
              )
            }
          >
            <span className="text-xs font-semibold">
              {variantLabelOf(variant)}
            </span>
            <span className="font-mono text-[10px] text-gray-500">
              {variant.sku}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

/** กรอก SKU ที่คนอื่นบอกต่อ หรือสแกนบาร์โค้ด (เครื่องสแกนพิมพ์แล้วกด Enter ให้เอง) */
function CodeLookup({ onSelect }: { onSelect: (card: SelectedCard) => void }) {
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const lookup = useVariantLookup(submitted);
  const productId = lookup.data?.productId ?? null;
  // รูปและเลขการ์ดไม่ได้มากับผล lookup — ดึงตัวการ์ดมาเติม (ไม่มีก็เลือกได้)
  const detail = useCatalogProduct(productId);

  function handleSubmit() {
    const trimmed = code.trim();
    if (trimmed !== "") setSubmitted(trimmed);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* div ไม่ใช่ form — หน้านี้ทั้งหน้าอยู่ใน <form> ของประกาศ ซ้อน form ไม่ได้ */}
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="h-9 min-w-0 flex-1 rounded-lg bg-background">
          <InputGroupAddon>
            <ScanBarcode />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="SKU หรือบาร์โค้ด"
            placeholder="SKU หรือบาร์โค้ด เช่น PKM-SV8A-025-EN-NORMAL"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => {
              // Enter ต้องไม่ส่งฟอร์มประกาศทั้งก้อน
              if (event.key === "Enter") {
                event.preventDefault();
                handleSubmit();
              }
            }}
          />
        </InputGroup>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          disabled={code.trim() === ""}
          onClick={handleSubmit}
        >
          ค้นด้วยรหัส
        </Button>
      </div>

      {submitted === null ? null : lookup.isPending ? (
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <Spinner className="size-3.5" /> กำลังค้น {submitted}…
        </p>
      ) : lookup.data === undefined ? (
        <p className="text-xs text-destructive">
          {hasErrorCode(lookup.error, "VARIANT_NOT_FOUND")
            ? `ไม่พบการ์ดที่มีรหัส "${submitted}" ในแคตตาล็อก`
            : getErrorMessage(lookup.error, "ค้นด้วยรหัสไม่สำเร็จ")}
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3.5 py-2.5">
          <div className="flex min-w-0 flex-col">
            <p className="text-sm font-medium text-zinc-950">
              {lookup.data.productName}
            </p>
            <p className="text-[11px] text-gray-600">
              {lookup.data.variantLabel} ·{" "}
              <span className="font-mono">{lookup.data.variant.sku}</span>
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-md px-2.5"
            disabled={!lookup.data.variant.active}
            onClick={() =>
              lookup.data && onSelect(selectedFromLookup(lookup.data, detail.data))
            }
          >
            {lookup.data.variant.active ? "ใช้การ์ดนี้" : "พิมพ์นี้ปิดขายแล้ว"}
          </Button>
        </div>
      )}
    </div>
  );
}
