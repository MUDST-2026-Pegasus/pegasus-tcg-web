import {
  Archive,
  ChevronRight,
  Clock3,
  MessageSquareText,
  Star,
  UsersRound,
} from "lucide-react";

import { ItemCard } from "@/components/common/ItemCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { STORE_PROFILE_FIXTURE } from "@/features/store/store.fixture";

const STAT_ICONS = {
  products: Archive,
  followers: UsersRound,
  rating: Star,
  chat: MessageSquareText,
  joined: Clock3,
};

export function StoreProfilePage() {
  const { store, stats, tabs, products } = STORE_PROFILE_FIXTURE;

  return (
    <div className="bg-muted/60 px-4 py-10 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Card className="relative min-h-[350px] overflow-hidden rounded-xl border-0 py-0 shadow-none">
            <img
              src={store.coverImage}
              alt={store.coverImageAlt}
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-foreground/50" />
            <CardContent className="relative flex min-h-[350px] flex-col items-center justify-center gap-5 p-8 text-center text-primary-foreground">
              <Avatar className="size-28">
                <AvatarFallback className="bg-background text-3xl font-semibold text-primary">{store.initials}</AvatarFallback>
              </Avatar>
              <h1 className="max-w-md text-2xl font-semibold leading-snug">
                {store.name}
              </h1>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-none">
            <CardContent className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {stats.map(({ key, label, value, detail }) => {
                const Icon = STAT_ICONS[key];

                return (
                <div key={label} className="flex flex-col gap-2">
                  <p className="flex items-center gap-2 font-medium">
                    <Icon className="size-4" /> {label}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-2xl font-semibold text-primary">{value}</p>
                    {detail && <p className="text-xs text-muted-foreground">{detail} ▮▮▮▮▮</p>}
                  </div>
                </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <nav aria-label="Store categories" className="flex flex-wrap items-center gap-2">
          {tabs.map((tab, index) => (
            <Button key={tab} variant={index === 0 ? "outline" : "ghost"}>
              {tab}
            </Button>
          ))}
        </nav>

        <Separator />

        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-primary">Recommended for You</h2>
            <Button variant="ghost" size="sm">
              View All <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {products.map((product) => (
              <ItemCard
                key={product.name}
                imageSrc={product.image}
                imageAlt={product.name}
                badge={product.category}
                title={product.name}
                price={product.price}
                className="h-full w-full"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
