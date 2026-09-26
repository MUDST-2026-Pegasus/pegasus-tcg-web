import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus, Search, Trash2 } from "lucide-react";

import { ItemCard } from "@/components/common/ItemCard";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/auth.queries";

import { catalogueCards, readCollection, saveCollection, type CollectionCard } from "../collection.data";

export function MyCollectionPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CollectionCard[]>(() => user ? readCollection(user.id) : []);
  const [isAdding, setIsAdding] = useState(false);
  const [removing, setRemoving] = useState<CollectionCard | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photo, setPhoto] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const updateCards = (next: CollectionCard[]) => {
    try {
      saveCollection(user.id, next);
      setCards(next);
      setError("");
      return true;
    } catch {
      setError("Could not save your collection. Try a smaller photo.");
      return false;
    }
  };

  const resetForm = () => {
    setQuery("");
    setSelectedId(null);
    setPhoto("");
    setPhotoName("");
    setError("");
  };

  const matches = query.trim()
    ? catalogueCards.filter((card) => `${card.name} ${card.game}`.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const addCard = () => {
    if (!selectedId || !photo) return;
    const next = [...cards, { id: crypto.randomUUID(), catalogueId: selectedId, photo, isPublic: true }];
    if (updateCards(next)) {
      setIsAdding(false);
      resetForm();
    }
  };

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10_000_000) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    try {
      const image = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();
      setPhoto(canvas.toDataURL("image/jpeg", 0.8));
      setPhotoName(file.name);
      setError("");
    } catch {
      setError("Could not read this photo.");
    }
  };

  return (
    <main className="min-h-[580px] bg-muted/60 px-4 py-12 font-sans sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Collection</h1>
            <p className="mt-1 text-muted-foreground">{cards.length} cards in your collection.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" render={<Link to={`/users/${user.id}`} />}>View public profile</Button>
            <Button variant="outline" render={<Link to="/account/profile" />}>My Account</Button>
            <Button onClick={() => { resetForm(); setIsAdding(true); }}><Plus data-icon="inline-start" /> Add Card</Button>
          </div>
        </div>

        {error && !isAdding ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
        {cards.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => {
              const card = catalogueCards.find((entry) => entry.id === item.catalogueId);
              if (!card) return null;
              return <ItemCard key={item.id} imageSrc={item.photo} imageAlt={card.name} badge={card.type} title={card.name}
                className="w-full [&_img]:object-contain"
                footer={<div className="flex w-full items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={item.isPublic} onCheckedChange={(checked) => updateCards(cards.map((entry) => entry.id === item.id ? { ...entry, isPublic: checked } : entry))} aria-label={`Make ${card.name} public`} />
                    {item.isPublic ? "Public" : "Private"}
                  </label>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${card.name}`} onClick={() => setRemoving(item)}><Trash2 /></Button>
                </div>} />;
            })}
          </div>
        ) : <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No cards yet. Add your first card from the catalogue.</p>}
      </div>

      <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add card to collection</DialogTitle>
            <DialogDescription>Choose a card listed in our catalogue, then upload your own photo.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search card name" placeholder="Search card name..." value={query} onChange={(event) => { setQuery(event.target.value); setSelectedId(null); }} className="pl-9" />
            </div>
            <p className="text-sm text-muted-foreground">{selectedId ? "Selected from the catalogue" : query ? `${matches.length} matching card${matches.length === 1 ? "" : "s"}` : "Search the catalogue to see matching cards."}</p>
            {matches.length ? <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
              {matches.map((card) => <Button key={card.id} variant="outline" className="w-full justify-center" aria-pressed={selectedId === card.id} onClick={() => setSelectedId(card.id)}>
                {selectedId === card.id ? <Check data-icon="inline-start" /> : null}{card.name} · {card.game}{selectedId === card.id ? "" : " · Select"}
              </Button>)}
            </div> : null}
            <p className="text-sm font-medium">Your card photo</p>
            {photo ? <div className="flex items-center gap-4"><img src={photo} alt="Uploaded card preview" className="h-16 w-28 rounded object-contain" /><div className="text-sm"><p>{photoName}</p><p className="text-muted-foreground">Photo ready to add</p></div></div> : null}
            <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={(event) => uploadPhoto(event.target.files?.[0])} />
            <Button variant="outline" disabled={!selectedId} onClick={() => fileInput.current?.click()}>{photo ? "Replace photo" : selectedId ? "Upload photo" : "Select a card before uploading"}</Button>
            <p className="text-xs text-muted-foreground">Upload a photo of your own card.</p>
            {photo ? <Button variant="ghost" size="sm" className="self-start" onClick={() => { setPhoto(""); setPhotoName(""); }}>Remove photo</Button> : null}
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button disabled={!selectedId || !photo} onClick={addCard}>Add Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removing !== null} onOpenChange={(open) => { if (!open) setRemoving(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove card?</AlertDialogTitle><AlertDialogDescription>Remove this card from your collection?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={() => { if (removing && updateCards(cards.filter((item) => item.id !== removing.id))) setRemoving(null); }}>Remove Card</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
