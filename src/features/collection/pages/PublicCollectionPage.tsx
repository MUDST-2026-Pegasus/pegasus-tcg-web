import { Link, useParams } from "react-router-dom";

import { ItemCard } from "@/components/common/ItemCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth.queries";

import { catalogueCards, demoCollection, readCollection } from "../collection.data";

export function PublicCollectionPage() {
  const { userId } = useParams();
  const { user, isLoading } = useAuth();
  const isOwn = Boolean(user && userId === String(user.id));
  const collectors: Record<string, { name: string; handle: string; count: number }> = {
    napatcards: { name: "Napat S.", handle: "@napatcards", count: 42 },
    minacollects: { name: "Mina K.", handle: "@minacollects", count: 28 },
    tpokemon: { name: "Thanawat P.", handle: "@tpokemon", count: 17 },
  };
  const collector = userId ? collectors[userId] : undefined;
  const name = isOwn ? user!.displayName : collector?.name ?? "";
  const handle = isOwn ? `@${user!.username}` : collector?.handle ?? "";
  const cards = (isOwn ? readCollection(user!.id) : collector ? demoCollection : []).filter((card) => card.isPublic);

  if (isLoading) return <main className="min-h-[580px] bg-muted/60 p-12 text-center text-muted-foreground">Loading profile...</main>;

  if (!isOwn && !collector) {
    return <main className="min-h-[580px] bg-muted/60 p-12 text-center"><h1 className="text-2xl font-bold">Profile not found</h1></main>;
  }

  return <main className="min-h-[580px] bg-muted/60 px-4 py-12 font-sans sm:px-8 lg:px-12">
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
      <div><Button variant="outline" render={<Link to={isOwn ? "/account/collection" : "/products/charizard-ex-sar"} />}>{isOwn ? "Back to My Collection" : "Back to card"}</Button></div>
      <Card className="rounded-xl shadow-none"><CardContent className="flex flex-wrap items-center gap-6 p-8">
        <Avatar className="size-20"><AvatarFallback>{name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
        <div className="flex-1"><h1 className="text-2xl font-bold">{name}</h1><p className="text-muted-foreground">{handle}</p></div>
        <p className="text-xl font-semibold text-primary">{collector ? `${collector.count} cards` : `${cards.length} cards`}</p>
      </CardContent></Card>
      <div><h2 className="text-xl font-semibold">{isOwn ? "Public collection" : "Collection highlights"}</h2><p className="text-sm text-muted-foreground">{isOwn ? "Cards you have made public." : `A selection of cards from ${name}'s collection.`}</p></div>
      {cards.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => {
          const card = catalogueCards.find((entry) => entry.id === item.catalogueId);
          return card ? <ItemCard key={item.id} imageSrc={item.photo} imageAlt={card.name} badge={card.type} title={card.name} className="w-full [&_img]:object-contain" /> : null;
        })}
      </div> : <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No public cards yet.</p>}
    </div>
  </main>;
}
