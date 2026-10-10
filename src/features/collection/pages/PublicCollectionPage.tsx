import { Link, useParams } from "react-router-dom";

import { ItemCard, QueryBoundary } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth.queries";

import { usePublicCollection } from "../collection.queries";

export function PublicCollectionPage() {
  const { username = "" } = useParams();
  const { user } = useAuth();
  const isOwn = user?.username.toLowerCase() === username.toLowerCase();
  const collection = usePublicCollection(username);
  const cards = collection.data?.pages.flatMap((page) => page.items) ?? [];
  const total = collection.data?.pages[0]?.totalItems ?? 0;
  const name = isOwn ? user.displayName : username;

  return <main className="min-h-[580px] bg-muted/60 px-4 py-12 font-sans sm:px-8 lg:px-12">
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
      <Button variant="outline" className="self-start" render={<Link to={isOwn ? "/account/collection" : "/search"} />}>{isOwn ? "Back to My Collection" : "Back to products"}</Button>
      <QueryBoundary query={collection} errorTitle="Could not load this collection" errorRetryLabel="Try again">
        {() => <>
          <Card className="rounded-xl shadow-none"><CardContent className="flex flex-wrap items-center gap-6 p-8">
            <Avatar className="size-20"><AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
            <div className="flex-1"><h1 className="text-2xl font-bold">{name}</h1><p className="text-muted-foreground">@{username}</p></div>
            <p className="text-xl font-semibold text-primary">{total} cards</p>
          </CardContent></Card>
          <div><h2 className="text-xl font-semibold">{isOwn ? "Public collection" : "Collection highlights"}</h2>
            <p className="text-sm text-muted-foreground">{isOwn ? "Cards you have made public." : `Cards from @${username}'s collection.`}</p></div>
          {cards.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => <ItemCard key={item.id} imageSrc={item.photoUrl ?? item.card.officialImageUrl ?? undefined}
              imageAlt={item.card.productName} badge={item.card.variantLabel} title={item.card.productName}
              className="w-full [&_img]:object-contain" />)}
          </div> : <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No public cards yet.</p>}
          {collection.hasNextPage ? <Button variant="outline" className="self-center" disabled={collection.isFetchingNextPage}
            onClick={() => void collection.fetchNextPage()}>Load more</Button> : null}
        </>}
      </QueryBoundary>
    </div>
  </main>;
}
