import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { FileUpload, ItemCard, QueryBoundary } from "@/components/common";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useAuth } from "@/features/auth/auth.queries";
import { getProducts } from "@/features/catalog/catalog.api";
import { getErrorMessage } from "@/lib/api";

import { getCollectionVariants } from "../collection.api";
import { payloadOf } from "../collection.payload";
import { useAddCollectionItem, useCollection, useRemoveCollectionItem, useUpdateCollectionItem } from "../collection.queries";
import type { CollectionItem } from "../collection.types";

export function MyCollectionPage() {
  const { user } = useAuth();
  const collection = useCollection();
  const add = useAddCollectionItem();
  const update = useUpdateCollectionItem();
  const remove = useRemoveCollectionItem();
  const upload = useFileUpload({ purpose: "COLLECTION_IMAGE" });
  const [editing, setEditing] = useState<CollectionItem | "new" | null>(null);
  const [removing, setRemoving] = useState<CollectionItem | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string } | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const results = useQuery({
    queryKey: ["collection", "catalogue-search", search],
    queryFn: () => getProducts({ q: search, page: 0, size: 10 }),
    enabled: editing !== null && search.length >= 2,
  });
  const variants = useQuery({
    queryKey: ["collection", "variants", selectedProduct?.id],
    queryFn: () => getCollectionVariants(selectedProduct!.id),
    enabled: editing !== null && selectedProduct !== null,
  });

  const cards = collection.data?.pages.flatMap((page) => page.items) ?? [];
  const total = collection.data?.pages[0]?.totalItems ?? 0;

  const closeForm = () => {
    setEditing(null);
    setQuery("");
    setSelectedProduct(null);
    setSelectedVariantId(null);
    setError("");
    upload.clear();
  };

  const openForm = (item: CollectionItem | "new") => {
    setEditing(item);
    setQuery("");
    setSelectedProduct(item === "new" ? null : { id: item.card.productId, name: item.card.productName });
    setSelectedVariantId(item === "new" ? null : item.card.variantId);
    setError("");
    upload.clear();
  };

  const save = async () => {
    if (selectedVariantId === null || editing === null) return;
    const imageKey = upload.objectKeys[0] ?? (editing === "new" ? null : editing.imageKey);
    if (!imageKey) { setError("Upload a photo of your card first."); return; }
    try {
      if (editing === "new") {
        await add.mutateAsync({ catalogVariantId: selectedVariantId, imageKey, publicItem: true });
      } else {
        await update.mutateAsync({ id: editing.id, payload: payloadOf(editing, { catalogVariantId: selectedVariantId, imageKey }) });
      }
      closeForm();
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not save this card. Please try again."));
    }
  };

  const togglePublic = async (item: CollectionItem, publicItem: boolean) => {
    try {
      await update.mutateAsync({ id: item.id, payload: payloadOf(item, { publicItem }) });
      setError("");
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not change visibility."));
    }
  };

  const deleteCard = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      setRemoving(null);
      setError("");
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not remove this card."));
    }
  };

  if (!user) return null;

  return <main className="min-h-[580px] bg-muted/60 px-4 py-12 font-sans sm:px-8 lg:px-12">
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold">My Collection</h1><p className="mt-1 text-muted-foreground">{total} cards in your collection.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link to={`/users/${user.username}`} />}>View public profile</Button>
          <Button variant="outline" render={<Link to="/account/profile" />}>My Account</Button>
          <Button onClick={() => openForm("new")}><Plus data-icon="inline-start" /> Add Card</Button>
        </div>
      </div>
      {error && editing === null ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      <QueryBoundary query={collection} errorTitle="Could not load your collection" errorRetryLabel="Try again">
        {() => <>
          {cards.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => <ItemCard key={item.id} imageSrc={item.photoUrl ?? item.card.officialImageUrl ?? undefined}
              imageAlt={item.card.productName} badge={item.card.variantLabel} title={item.card.productName}
              className="w-full [&_img]:object-contain"
              footer={<div className="flex w-full items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={item.publicItem} disabled={update.isPending}
                  onCheckedChange={(checked) => void togglePublic(item, checked)} aria-label={`Make ${item.card.productName} public`} />
                  {item.publicItem ? "Public" : "Private"}</label>
                <div className="flex"><Button variant="ghost" size="icon" aria-label={`Edit ${item.card.productName}`} onClick={() => openForm(item)}><Pencil /></Button>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${item.card.productName}`} onClick={() => setRemoving(item)}><Trash2 /></Button></div>
              </div>} />)}
          </div> : <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No cards yet. Add your first card from the catalogue.</p>}
          {collection.hasNextPage ? <div className="mt-6 text-center"><Button variant="outline" disabled={collection.isFetchingNextPage} onClick={() => void collection.fetchNextPage()}>Load more</Button></div> : null}
        </>}
      </QueryBoundary>
    </div>

    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) closeForm(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{editing === "new" ? "Add card to collection" : "Edit card"}</DialogTitle>
          <DialogDescription>Choose a card in the catalogue and upload your own photo.</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search card name" placeholder="Search card name..." value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" /></div>
          {search.length >= 2 ? <div className="flex max-h-36 flex-col gap-2 overflow-y-auto">
            {results.isPending ? <p className="text-sm text-muted-foreground">Searching...</p> : results.isError ? <p role="alert" className="text-sm text-destructive">Could not search the catalogue.</p> :
              results.data?.items.length ? results.data.items.map((product) =>
                <Button key={product.id} variant="outline" aria-pressed={selectedProduct?.id === product.id}
                  onClick={() => { setSelectedProduct({ id: product.id, name: product.name }); setSelectedVariantId(null); }}>{product.name}</Button>) :
                <p className="text-sm text-muted-foreground">No matching cards.</p>}
          </div> : null}
          {selectedProduct ? <div className="flex flex-col gap-2"><p className="text-sm font-medium">{selectedProduct.name} · Choose printing</p>
            {variants.isPending ? <p className="text-sm text-muted-foreground">Loading printings...</p> : variants.isError ? <p role="alert" className="text-sm text-destructive">Could not load printings.</p> :
              variants.data?.filter((variant) => variant.active || variant.id === selectedVariantId).map((variant) =>
                <Button key={variant.id} variant={selectedVariantId === variant.id ? "default" : "outline"} onClick={() => setSelectedVariantId(variant.id)}>{variant.sku} · {variant.languageCode}</Button>)}
          </div> : <p className="text-sm text-muted-foreground">Search the catalogue to choose a card.</p>}
          {selectedVariantId ? <FileUpload upload={upload} title={editing === "new" ? "Upload your card photo" : "Replace card photo (optional)"} /> : null}
          {editing && editing !== "new" && editing.photoUrl && !upload.items.length ? <img src={editing.photoUrl} alt="Current card photo" className="h-20 w-36 rounded object-contain" /> : null}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter><Button variant="outline" onClick={closeForm}>Cancel</Button>
          <Button disabled={!selectedVariantId || (editing === "new" && !upload.objectKeys[0]) || upload.isUploading || add.isPending || update.isPending}
            onClick={() => void save()}>{add.isPending || update.isPending ? <Spinner data-icon="inline-start" /> : null}{editing === "new" ? "Add Card" : "Save Changes"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={removing !== null} onOpenChange={(open) => { if (!open) setRemoving(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove card?</AlertDialogTitle>
        <AlertDialogDescription>Remove this card from your collection?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={remove.isPending} onClick={() => void deleteCard()}>Remove Card</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>;
}
