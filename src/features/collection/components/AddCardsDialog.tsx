import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { useCardSetList, useGameList, useProductSearch } from "@/features/catalog/catalog.queries";
import type { ProductSummaryDto } from "@/features/catalog/catalog.types";
import { useFileUpload, type UploadItem } from "@/hooks/use-file-upload";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

import { getCollectionVariants } from "../collection.api";
import {
  DEFAULT_DRAFT,
  metaOf,
  offeredVariants,
  pickedOf,
  resolveVariantId,
  toPayload,
  type CardDraft,
  type PickedCard,
} from "../collection.picker";
import { useAddCollectionItems } from "../collection.queries";
import { CardDetailsRow, CardThumb, OptionSelect } from "./CardDetailsRow";

const PAGE_SIZE = 12;

export function AddCardsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-4xl">
        {/* The popup unmounts when closed, so the picker starts clean every time it opens. */}
        <AddCardsForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AddCardsForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [gameId, setGameId] = useState<number | null>(null);
  const [cardSetId, setCardSetId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<PickedCard[]>([]);
  const [drafts, setDrafts] = useState<Record<number, CardDraft>>({});
  const [photos, setPhotos] = useState<Record<number, File>>({});
  const [failures, setFailures] = useState<Record<number, string>>({});
  const [publicItem, setPublicItem] = useState(true);

  // One uploader for every row: a row's photo is the item holding that row's File.
  const upload = useFileUpload({ purpose: "COLLECTION_IMAGE", multiple: true });
  const add = useAddCollectionItems();

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const games = useGameList();
  const cardSets = useCardSetList(gameId);
  const results = useProductSearch({
    q: search || undefined,
    gameId: gameId === null ? undefined : [gameId],
    cardSetId: cardSetId ?? undefined,
    page,
    size: PAGE_SIZE,
  });
  const variantQueries = useQueries({
    queries: picked.map((card) => ({
      queryKey: ["collection", "variants", card.productId],
      queryFn: () => getCollectionVariants(card.productId),
    })),
  });

  const draftOf = (productId: number) => drafts[productId] ?? DEFAULT_DRAFT;
  const photoOf = (productId: number): UploadItem | undefined => {
    const file = photos[productId];
    return file ? upload.items.find((item) => item.file === file) : undefined;
  };

  const dropPhoto = (productId: number) => {
    const item = photoOf(productId);
    if (item) upload.remove(item.id);
    setPhotos((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const setPhoto = (productId: number, file: File) => {
    const previous = photoOf(productId);
    if (previous) upload.remove(previous.id);
    upload.addFiles([file]);
    setPhotos((current) => ({ ...current, [productId]: file }));
  };

  const unpick = (productId: number) => {
    dropPhoto(productId);
    setPicked((current) => current.filter((card) => card.productId !== productId));
    setFailures((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const toggle = (product: ProductSummaryDto) => {
    if (picked.some((card) => card.productId === product.id)) {
      unpick(product.id);
    } else {
      setPicked((current) => [...current, pickedOf(product)]);
    }
  };

  const patchDraft = (productId: number, changes: Partial<CardDraft>) => {
    setDrafts((current) => ({
      ...current,
      [productId]: { ...(current[productId] ?? DEFAULT_DRAFT), ...changes },
    }));
  };

  const rows = picked.map((card, index) => {
    const draft = draftOf(card.productId);
    const variants = variantQueries[index];
    return {
      card,
      draft,
      variants,
      variantId: resolveVariantId(draft, variants?.data),
      photo: photoOf(card.productId),
    };
  });

  const ready =
    rows.length > 0 &&
    rows.every((row) => row.variantId !== null && (!row.photo || row.photo.status === "done"));

  const submit = async () => {
    if (!ready) return;
    const outcomes = await add.mutateAsync(
      rows.map((row) => toPayload(row.variantId!, row.draft, row.photo?.objectKey ?? null, publicItem)),
    );

    const failed: Record<number, string> = {};
    outcomes.forEach((outcome, index) => {
      if (outcome.status === "rejected") {
        failed[rows[index].card.productId] = getErrorMessage(outcome.reason, "Could not add this card.");
      }
    });

    const addedCount = outcomes.length - Object.keys(failed).length;
    if (addedCount > 0) {
      toast.add({
        title: addedCount === 1 ? "1 card added" : `${addedCount} cards added`,
        description: "They are now in your collection.",
        type: "success",
      });
    }
    if (addedCount === outcomes.length) {
      onClose();
      return;
    }
    // Keep only what failed, so pressing the button again cannot add the others twice.
    setPicked((current) => current.filter((card) => card.productId in failed));
    setFailures(failed);
  };

  const pickedLabel = picked.length === 1 ? "1 card selected" : `${picked.length} cards selected`;
  const totalPages = results.data?.totalPages ?? 0;

  if (step === 1) {
    return (
      <>
        <DialogHeader>
          <p className="text-xs text-muted-foreground">Step 1 of 2</p>
          <DialogTitle>Choose cards</DialogTitle>
          <DialogDescription>Pick the cards you own from the catalogue.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search card name or number"
                placeholder="Search card name or number..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <OptionSelect
              label="Game"
              value={gameId}
              options={(games.data ?? []).map((game) => ({ value: game.id, label: game.name }))}
              placeholder="All games"
              clearable
              onChange={(next) => {
                setGameId(next);
                setCardSetId(null);
                setPage(0);
              }}
            />
            <OptionSelect
              label="Set"
              value={cardSetId}
              options={(cardSets.data ?? []).map((set) => ({ value: set.id, label: set.name }))}
              placeholder={gameId === null ? "Choose a game first" : "All sets"}
              clearable
              disabled={gameId === null}
              onChange={(next) => {
                setCardSetId(next);
                setPage(0);
              }}
            />
          </div>

          {results.isPending ? (
            <p role="status" className="py-10 text-center text-sm text-muted-foreground">
              Loading cards...
            </p>
          ) : results.isError ? (
            <div role="alert" className="flex flex-col items-center gap-3 py-10 text-sm">
              <p className="text-destructive">Could not load the catalogue.</p>
              <Button variant="outline" size="sm" onClick={() => void results.refetch()}>
                Try again
              </Button>
            </div>
          ) : results.data.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No matching cards.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {results.data.totalItems === 1 ? "1 card found" : `${results.data.totalItems} cards found`}
              </p>
              <ul
                className={cn(
                  "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
                  results.isPlaceholderData && "opacity-60",
                )}
              >
                {results.data.items.map((product) => (
                  <li key={product.id}>
                    <CatalogueTile
                      product={product}
                      selected={picked.some((card) => card.productId === product.id)}
                      onToggle={() => toggle(product)}
                    />
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <nav aria-label="Catalogue pages" className="flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>

        <DialogFooter className="sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {pickedLabel}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={picked.length === 0} onClick={() => setStep(2)}>
              Next
            </Button>
          </div>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <p className="text-xs text-muted-foreground">Step 2 of 2</p>
        <DialogTitle>Add details</DialogTitle>
        <DialogDescription>
          Choose the printing and condition of each card. A photo of your own card is optional.
        </DialogDescription>
      </DialogHeader>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No cards selected. Go back to choose some.
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {rows.map((row) => (
            <CardDetailsRow
              key={row.card.productId}
              card={row.card}
              draft={row.draft}
              variantId={row.variantId}
              variants={offeredVariants(row.variants?.data)}
              variantsPending={row.variants?.isPending ?? true}
              variantsFailed={row.variants?.isError ?? false}
              onRetryVariants={() => void row.variants?.refetch()}
              photo={row.photo}
              accept={upload.accept}
              failure={failures[row.card.productId]}
              disabled={add.isPending}
              onChange={(changes) => patchDraft(row.card.productId, changes)}
              onPhoto={(file) => setPhoto(row.card.productId, file)}
              onDropPhoto={() => dropPhoto(row.card.productId)}
              onRemove={() => unpick(row.card.productId)}
            />
          ))}
        </ul>
      )}

      <DialogFooter className="sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={publicItem} disabled={add.isPending} onCheckedChange={setPublicItem} />
          Show on my public profile
        </label>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" disabled={add.isPending} onClick={() => setStep(1)}>
            Back
          </Button>
          <Button disabled={!ready || add.isPending} onClick={() => void submit()}>
            {add.isPending ? <Spinner data-icon="inline-start" /> : null}
            {rows.length === 1 ? "Add 1 card" : `Add ${rows.length} cards`}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function CatalogueTile({
  product,
  selected,
  onToggle,
}: {
  product: ProductSummaryDto;
  selected: boolean;
  onToggle: () => void;
}) {
  const meta = metaOf(product);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/30",
        selected && "border-primary bg-primary/5 ring-1 ring-primary",
      )}
    >
      <CardThumb src={product.primaryImageUrl} className="h-16 w-12" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{product.name}</span>
        {meta && <span className="block truncate text-xs text-muted-foreground">{meta}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border",
          selected && "border-primary bg-primary text-primary-foreground",
        )}
      >
        {selected && <Check className="size-3" />}
      </span>
    </button>
  );
}
