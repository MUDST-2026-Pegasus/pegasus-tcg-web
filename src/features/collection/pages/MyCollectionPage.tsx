import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { ItemCard, QueryBoundary } from "@/components/common";
import { ItemGridSkeleton } from "@/components/common/PageSkeletons";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/auth.queries";
import { getErrorMessage } from "@/lib/api";

import { payloadOf } from "../collection.payload";
import { useCollection, useRemoveCollectionItem, useUpdateCollectionItem } from "../collection.queries";
import type { CollectionItem } from "../collection.types";
import { AddCardsDialog } from "../components/AddCardsDialog";
import { EditCardDialog } from "../components/EditCardDialog";

export function MyCollectionPage() {
  const { user } = useAuth();
  const collection = useCollection();
  const update = useUpdateCollectionItem();
  const remove = useRemoveCollectionItem();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CollectionItem | null>(null);
  const [removing, setRemoving] = useState<CollectionItem | null>(null);
  const [error, setError] = useState("");

  const cards = collection.data?.pages.flatMap((page) => page.items) ?? [];
  const total = collection.data?.pages[0]?.totalItems ?? 0;

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
          <Button onClick={() => setAdding(true)}><Plus data-icon="inline-start" /> Add Card</Button>
        </div>
      </div>
      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      <QueryBoundary query={collection} errorTitle="Could not load your collection" errorRetryLabel="Try again"
        loading={<div role="status" aria-busy="true" aria-label="Loading your collection"><ItemGridSkeleton className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" /></div>}>
        {() => <>
          {cards.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => <ItemCard key={item.id} imageSrc={item.photoUrl ?? item.card.officialImageUrl ?? undefined}
              imageAlt={item.card.productName} badge={item.card.variantLabel} title={item.card.productName}
              className="w-full [&_img]:object-contain"
              footer={<div className="flex w-full items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={item.publicItem} disabled={update.isPending}
                  onCheckedChange={(checked) => void togglePublic(item, checked)} aria-label={`Make ${item.card.productName} public`} />
                  {item.publicItem ? "Public" : "Private"}</label>
                <div className="flex"><Button variant="ghost" size="icon" aria-label={`Edit ${item.card.productName}`} onClick={() => setEditing(item)}><Pencil /></Button>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${item.card.productName}`} onClick={() => setRemoving(item)}><Trash2 /></Button></div>
              </div>} />)}
          </div> : <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No cards yet. Add your first card from the catalogue.</p>}
          {collection.hasNextPage ? <div className="mt-6 text-center"><Button variant="outline" disabled={collection.isFetchingNextPage} onClick={() => void collection.fetchNextPage()}>Load more</Button></div> : null}
        </>}
      </QueryBoundary>
    </div>

    <AddCardsDialog open={adding} onOpenChange={setAdding} />

    <EditCardDialog item={editing} onClose={() => setEditing(null)} />

    <AlertDialog open={removing !== null} onOpenChange={(open) => { if (!open) setRemoving(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove card?</AlertDialogTitle>
        <AlertDialogDescription>Remove this card from your collection?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={remove.isPending} onClick={() => void deleteCard()}>Remove Card</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>;
}
