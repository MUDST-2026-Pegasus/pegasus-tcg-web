import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { CONDITION_LABELS } from "@/features/catalog/catalog.mappers";
import type { CardCondition } from "@/features/catalog/catalog.types";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getErrorMessage } from "@/lib/api";

import { getCollectionVariants } from "../collection.api";
import { payloadOf } from "../collection.payload";
import { clampQuantity, offeredVariants, resolveVariantId, type CardDraft } from "../collection.picker";
import { useUpdateCollectionItem } from "../collection.queries";
import type { CollectionItem } from "../collection.types";
import { CardDetailsRow } from "./CardDetailsRow";

export function EditCardDialog({ item, onClose }: { item: CollectionItem | null; onClose: () => void }) {
  // Keep showing the card while the dialog animates shut, instead of an empty box.
  const [shown, setShown] = useState(item);
  if (item && item !== shown) setShown(item);

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
        {shown && <EditCardForm key={shown.id} item={shown} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EditCardForm({ item, onClose }: { item: CollectionItem; onClose: () => void }) {
  const update = useUpdateCollectionItem();
  const upload = useFileUpload({ purpose: "COLLECTION_IMAGE" });
  const [draft, setDraft] = useState<CardDraft>({
    variantId: item.card.variantId,
    condition: item.condition in CONDITION_LABELS ? (item.condition as CardCondition) : "NM",
    quantity: item.quantity,
  });
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [error, setError] = useState("");

  const variants = useQuery({
    queryKey: ["collection", "variants", item.card.productId],
    queryFn: () => getCollectionVariants(item.card.productId),
  });

  const photo = upload.items[0];
  // Until the printings arrive the card keeps the one it has, so the rest can still be saved.
  const variantId = variants.data
    ? resolveVariantId(draft, variants.data, item.card.variantId)
    : item.card.variantId;
  const ready = variantId !== null && (!photo || photo.status === "done");

  const save = async () => {
    if (variantId === null || !ready) return;
    const imageKey = photo?.objectKey ?? (photoRemoved ? null : item.imageKey);
    try {
      await update.mutateAsync({
        id: item.id,
        payload: payloadOf(item, {
          catalogVariantId: variantId,
          condition: draft.condition,
          quantity: clampQuantity(draft.quantity),
          imageKey,
        }),
      });
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not save this card. Please try again."));
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit card</DialogTitle>
        <DialogDescription>
          Change the printing, condition, or quantity, or replace your photo.
        </DialogDescription>
      </DialogHeader>

      <ul className="flex flex-col">
        <CardDetailsRow
          card={{
            productId: item.card.productId,
            name: item.card.productName,
            imageUrl: item.card.officialImageUrl,
            cardNumber: null,
            rarityCode: null,
          }}
          draft={draft}
          variantId={variantId}
          variants={offeredVariants(variants.data, item.card.variantId)}
          variantsPending={variants.isPending}
          variantsFailed={variants.isError}
          onRetryVariants={() => void variants.refetch()}
          photo={photo}
          currentPhotoUrl={photoRemoved ? null : item.photoUrl}
          accept={upload.accept}
          failure={error || undefined}
          disabled={update.isPending}
          onChange={(changes) => setDraft((current) => ({ ...current, ...changes }))}
          onPhoto={(file) => upload.addFiles([file])}
          onDropPhoto={() => {
            // A photo picked here goes first; pressing again takes the saved one off the card.
            if (photo) upload.clear();
            else setPhotoRemoved(true);
          }}
        />
      </ul>

      <DialogFooter>
        <Button variant="outline" disabled={update.isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!ready || update.isPending} onClick={() => void save()}>
          {update.isPending ? <Spinner data-icon="inline-start" /> : null}
          Save Changes
        </Button>
      </DialogFooter>
    </>
  );
}
