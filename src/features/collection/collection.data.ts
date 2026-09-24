import arcaneDeckBox from "@/assets/home/arcane-deck-box.jpg";
import celestialGuardianBox from "@/assets/home/celestial-guardian-box.jpg";
import galacticGuardiansBox from "@/assets/home/galactic-guardians-box.jpg";
import aurasphereMouse from "@/assets/home/aurasphere-mouse.jpg";

export type CatalogueCard = {
  id: string;
  name: string;
  game: string;
  type: string;
  image: string;
};

export type CollectionCard = {
  id: string;
  catalogueId: string;
  photo: string;
  isPublic: boolean;
};

// ponytail: Small local catalogue until a searchable catalogue API is available.
export const catalogueCards: CatalogueCard[] = [
  { id: "charizard-ex-sar", name: "Charizard ex SAR", game: "Pokémon", type: "Single Card", image: arcaneDeckBox },
  { id: "pikachu-ar", name: "Pikachu AR", game: "Pokémon", type: "Single Card", image: galacticGuardiansBox },
  { id: "mew-vmax", name: "Mew VMAX", game: "Pokémon", type: "Single Card", image: galacticGuardiansBox },
  { id: "darkrai-ex", name: "Darkrai ex", game: "Pokémon", type: "Single Card", image: arcaneDeckBox },
  { id: "one-piece-op09", name: "ONE PIECE OP-09 Premium Set", game: "One Piece", type: "Sealed", image: aurasphereMouse },
  { id: "mega-evolution", name: "MEGA Evolution Booster Box", game: "Pokémon", type: "Booster Box", image: celestialGuardianBox },
];

export const demoCollection: CollectionCard[] = catalogueCards.map((card) => ({
  id: card.id,
  catalogueId: card.id,
  photo: card.image,
  isPublic: true,
}));

const storageKey = (userId: number) => `pegasus:collection:${userId}`;

export function readCollection(userId: number): CollectionCard[] {
  try {
    const saved = localStorage.getItem(storageKey(userId));
    if (!saved) return demoCollection;
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return demoCollection;
    return parsed.filter((card): card is CollectionCard =>
      card !== null && typeof card === "object" &&
      typeof card.id === "string" && typeof card.catalogueId === "string" &&
      typeof card.photo === "string" && typeof card.isPublic === "boolean",
    );
  } catch {
    return demoCollection;
  }
}

export function saveCollection(userId: number, cards: CollectionCard[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(cards));
}
