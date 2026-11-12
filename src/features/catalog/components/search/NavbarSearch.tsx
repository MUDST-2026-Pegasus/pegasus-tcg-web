import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ArrowLeftIcon, ArrowDownIcon, ArrowUpIcon, SearchIcon, XIcon } from "lucide-react";

import { useSearchSuggestPanel } from "@/features/catalog/components/search/SearchSuggestPanel";
import { moveHighlight, type SearchOption } from "@/features/catalog/search/search-options";
import type { NavbarSearchState } from "@/features/catalog/search/use-navbar-search";
import { useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * ช่องค้นหาใน Navbar + autocomplete [TCG-776]
 *
 * - desktop: popover กว้าง 760px ใต้ช่องค้นหา + scrim ทับเนื้อหา
 * - mobile (< md): แตะช่องค้นหา → หน้าเต็มจอ (Dialog ดัก focus ให้)
 *
 * เปิด/ปิดผูกกับ `location.key` — เปลี่ยน route แล้วปิดเองโดยไม่ต้องมี effect
 * Enter บนแถวที่ไฮไลต์ = ไปหน้านั้น · Enter เฉย ๆ = /search?q= (คงตัวกรองเดิมบนหน้า /search [TCG-694])
 */
/** ช่องค้นหาในแถวบนของ Navbar (md ขึ้นไป) + popover */
export function DesktopNavbarSearch({
  search,
  inputRef,
}: {
  search: NavbarSearchState;
  inputRef: Ref<HTMLInputElement>;
}) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div ref={root} className="relative hidden min-w-0 max-w-[640px] flex-1 md:block">
      <SearchCombobox
        variant="popover"
        inputRef={inputRef}
        query={search.query}
        setQuery={search.setQuery}
        expanded={search.mode === "popover"}
        onOpen={() => search.open("popover")}
        onClose={search.close}
        onSubmit={search.submit}
        onSelect={search.select}
        searchHref={search.hrefFor}
        containerRef={root}
      />
    </div>
  );
}

/** ช่องค้นหาบนมือถือ — แตะแล้วเปิดหน้าค้นหาเต็มจอ */
export function MobileNavbarSearch({
  search,
  inputRef,
}: {
  search: NavbarSearchState;
  inputRef: Ref<HTMLInputElement>;
}) {
  const { t } = useTranslate();
  return (
    <>
      <form
        onSubmit={search.submit}
        role="search"
        className="mx-4 mb-2.5 flex h-10 items-center gap-2 rounded-full border border-border bg-muted px-4 md:hidden"
      >
        <SearchIcon className="size-[18px] text-muted-foreground" />
        <input
          ref={inputRef}
          aria-label={t("nav.search", "ค้นหา")}
          aria-haspopup="dialog"
          value={search.query}
          readOnly
          onFocus={(event) => {
            event.currentTarget.blur();
            search.open("screen");
          }}
          onClick={() => search.open("screen")}
          placeholder={t("nav.searchPlaceholder", "ค้นหาการ์ด ชุดการ์ด หรือร้านค้า…")}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </form>
      <DialogPrimitive.Root
        open={search.mode === "screen"}
        onOpenChange={(next) => (next ? search.open("screen") : search.close())}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Popup
            data-testid="mobile-search"
            className="fixed inset-0 z-50 flex flex-col bg-background outline-none"
          >
            <DialogPrimitive.Title className="sr-only">
              {t("searchSuggest.dialogTitle", "ค้นหาสินค้า", { ns: "buyer" })}
            </DialogPrimitive.Title>
            <SearchCombobox
              variant="screen"
              query={search.query}
              setQuery={search.setQuery}
              expanded
              onOpen={() => search.open("screen")}
              onClose={search.close}
              onSubmit={search.submit}
              onSelect={search.select}
              searchHref={search.hrefFor}
            />
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

function SearchCombobox({
  variant,
  inputRef,
  query,
  setQuery,
  expanded,
  onOpen,
  onClose,
  onSubmit,
  onSelect,
  searchHref: hrefFor,
  containerRef,
}: {
  variant: "popover" | "screen";
  inputRef?: Ref<HTMLInputElement>;
  query: string;
  setQuery: (value: string) => void;
  expanded: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onSelect: (option: SearchOption) => void;
  searchHref: (term: string, extra?: Record<string, string>) => string;
  containerRef?: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslate("buyer");
  const listId = useId();
  const [highlight, setHighlight] = useState<{ query: string; index: number }>({ query, index: -1 });
  const highlighted = highlight.query === query ? highlight.index : -1;

  const panel = useSearchSuggestPanel({
    query,
    idPrefix: `${listId}-opt`,
    layout: variant === "popover" ? "columns" : "stack",
    highlighted,
    searchHref: hrefFor,
    onSelect,
    onHover: (index) => setHighlight({ query, index }),
  });
  const active = highlighted >= 0 ? panel.options[highlighted] : undefined;
  useCloseOnOutsidePointer(variant === "popover" && expanded, containerRef, onClose);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (variant === "popover") {
        onClose();
        event.currentTarget.blur();
      }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!expanded) onOpen();
      const next = moveHighlight(highlighted, panel.options.length, event.key);
      setHighlight({ query, index: next });
      if (next >= 0) {
        document.getElementById(panel.options[next].id)?.scrollIntoView?.({ block: "nearest" });
      }
      return;
    }
    if (event.key === "Enter" && expanded && active) {
      event.preventDefault();
      onSelect(active);
    }
  };

  const input = (
    <input
      ref={inputRef}
      role="combobox"
      aria-label={t("nav.search", "ค้นหา", { ns: "common" })}
      aria-expanded={expanded}
      aria-controls={expanded ? listId : undefined}
      aria-autocomplete="list"
      aria-activedescendant={expanded && active ? active.id : undefined}
      autoComplete="off"
      enterKeyHint="search"
      autoFocus={variant === "screen"}
      value={query}
      onChange={(event) => {
        setQuery(event.target.value);
        if (!expanded) onOpen();
      }}
      onFocus={() => {
        if (!expanded) onOpen();
      }}
      onKeyDown={onKeyDown}
      placeholder={t("nav.searchPlaceholder", "ค้นหาการ์ด ชุดการ์ด หรือร้านค้า…", { ns: "common" })}
      className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
    />
  );

  const listbox = (
    <div id={listId} role="listbox" aria-label={t("searchSuggest.listLabel", "คำแนะนำการค้นหา")}>
      {panel.body}
    </div>
  );
  const status = (
    <p role="status" aria-live="polite" className="sr-only">
      {expanded ? panel.status : ""}
    </p>
  );

  if (variant === "screen") {
    return (
      <>
        <form onSubmit={onSubmit} role="search" className="flex items-center gap-2 border-b border-border px-2 py-2">
          <DialogPrimitive.Close
            aria-label={t("searchSuggest.back", "กลับ")}
            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted"
          >
            <ArrowLeftIcon className="size-5" />
          </DialogPrimitive.Close>
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border-2 border-ring/60 bg-background px-3">
            <SearchIcon className="size-[18px] shrink-0 text-muted-foreground" />
            {input}
            {query && (
              <button
                type="button"
                aria-label={t("searchSuggest.clearInput", "ล้างคำค้น")}
                onClick={() => setQuery("")}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>
        </form>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{listbox}</div>
        {query.trim() && (
          <div className="sticky bottom-0 flex justify-center border-t border-border bg-muted/60 px-4 py-3">
            {panel.footer}
          </div>
        )}
        {status}
      </>
    );
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        role="search"
        className={cn(
          "group flex h-11 items-center gap-2 rounded-full border border-border bg-muted px-4 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring",
          expanded && "relative z-50 bg-background",
        )}
      >
        <SearchIcon className="size-[18px] shrink-0 text-muted-foreground" />
        {input}
        <kbd className="rounded border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground group-focus-within:hidden">
          /
        </kbd>
      </form>
      {status}
      {expanded && (
        <>
          <div
            aria-hidden="true"
            data-testid="search-scrim"
            onMouseDown={onClose}
            className="fixed inset-x-0 top-16 bottom-0 z-40 bg-foreground/28"
          />
          <div
            onMouseDown={(event) => {
              // คลิกในแผงไม่ให้ช่องพิมพ์เสีย focus
              if (!(event.target instanceof HTMLInputElement)) event.preventDefault();
            }}
            className="absolute top-full left-0 z-50 mt-2 w-[760px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
          >
            <div className="max-h-[min(70vh,640px)] overflow-y-auto">{listbox}</div>
            <div className="flex h-11 items-center justify-between gap-4 border-t border-border bg-muted/60 px-4">
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <KeyHint>
                  <ArrowUpIcon className="size-3" />
                  <ArrowDownIcon className="size-3" />
                </KeyHint>
                {t("searchSuggest.keySelect", "เลือก")}
                <KeyHint>Enter</KeyHint>
                {t("searchSuggest.keyOpen", "เปิด")}
                <KeyHint>Esc</KeyHint>
                {t("searchSuggest.keyClose", "ปิด")}
              </span>
              <span className="flex min-w-0 items-center">{panel.footer}</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function KeyHint({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-sans text-xs font-semibold text-foreground">
      {children}
    </kbd>
  );
}

/** คลิกนอกช่องค้นหา + แผง (เช่นแถบบน) → ปิด · scrim ปิดเองอยู่แล้ว */
function useCloseOnOutsidePointer(
  active: boolean,
  containerRef: RefObject<HTMLDivElement | null> | undefined,
  onClose: () => void,
) {
  useEffect(() => {
    if (!active || !containerRef) return;
    const listener = (event: PointerEvent) => {
      const root = containerRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) onClose();
    };
    document.addEventListener("pointerdown", listener);
    return () => document.removeEventListener("pointerdown", listener);
  }, [active, containerRef, onClose]);
}
