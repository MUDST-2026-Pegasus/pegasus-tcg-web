import {
  Archive,
  ChevronRight,
  Clock3,
  MessageSquareText,
  Star,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";

import registerBackground from "@/assets/auth/register-background.jpg";
import registerHeader from "@/assets/auth/register-header.jpg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STORE_STATS = [
  { label: "รายการสินค้า", value: "971", detail: undefined, icon: Archive },
  { label: "ผู้ติดตาม", value: "49.6k", detail: undefined, icon: UsersRound },
  { label: "คะแนน", value: "4.9", detail: "(169.5k)", icon: Star },
  { label: "ประสิทธิภาพการแชท", value: "99%", detail: undefined, icon: MessageSquareText },
  { label: "เข้าร่วมเมื่อ", value: "8 ปีที่ผ่านมา", detail: undefined, icon: Clock3 },
] as const;

const STORE_TABS = [
  "หน้าแรก",
  "สินค้าทั้งหมด",
  "Sale (ลดล้างสต็อก)",
  "New (มาใหม่)",
  "Beyblade X",
  "Pokemon",
] as const;

const PRODUCTS = [
  { name: "Mega Evolution Pitch Black Booster Box [ENG]", price: "฿2,450", category: "Sealed", image: registerHeader, position: "center" },
  { name: "Pokemon Booster Box (Thai)", price: "฿1,800", category: "Sealed", image: registerBackground, position: "36% 30%" },
  { name: "Disney Lorcana Booster Box", price: "฿4,200", category: "Sealed", image: registerHeader, position: "75% center" },
  { name: "Dragon Shield Matte Sleeves", price: "฿350", category: "Accessories", image: registerBackground, position: "center 70%" },
  { name: "[BOT] Battle of Talingchan - Kudson Deck", price: "฿290", category: "Deck", image: registerBackground, position: "70% 38%" },
] as const;

function ProductCard({ product }: { product: (typeof PRODUCTS)[number] }) {
  return (
    <Card className="h-full gap-4 rounded-xl py-5 shadow-none">
      <CardContent>
        <img
          src={product.image}
          alt={product.name}
          className="aspect-[16/9] w-full rounded-lg object-cover"
          style={{ objectPosition: product.position }}
        />
      </CardContent>
      <CardHeader className="mt-auto gap-3">
        <Badge variant="secondary">{product.category}</Badge>
        <CardTitle className="line-clamp-2 min-h-12 text-base font-semibold leading-6">
          {product.name}
        </CardTitle>
      </CardHeader>
      <CardFooter>
        <p className="text-xl font-semibold text-primary">{product.price}</p>
      </CardFooter>
    </Card>
  );
}

export function StoreProfilePage() {
  return (
    <div className="bg-muted/60 px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Card className="relative min-h-[350px] overflow-hidden rounded-xl border-0 py-0 shadow-none">
            <img
              src={registerHeader}
              alt="บรรยากาศร้าน Nx Gallery"
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-foreground/50" />
            <CardContent className="relative flex min-h-[350px] flex-col items-center justify-center gap-5 p-8 text-center text-primary-foreground">
              <Avatar className="size-28">
                <AvatarFallback className="bg-background text-3xl font-semibold text-primary">Nx</AvatarFallback>
              </Avatar>
              <h1 className="max-w-md text-2xl font-semibold leading-snug">
                Nx Gallery - Card Game &amp; Board Game Cafe
              </h1>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg">
                  <UserRoundPlus data-icon="inline-start" /> ติดตาม
                </Button>
                <Button variant="secondary" size="lg">
                  <MessageSquareText data-icon="inline-start" /> พูดคุย
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-none">
            <CardContent className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {STORE_STATS.map(({ label, value, detail, icon: Icon }) => (
                <div key={label} className="flex flex-col gap-2">
                  <p className="flex items-center gap-2 font-medium">
                    <Icon className="size-4" /> {label}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-2xl font-semibold text-primary">{value}</p>
                    {detail && <p className="text-xs text-muted-foreground">{detail} ▮▮▮▮▮</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <nav aria-label="หมวดหมู่ร้านค้า" className="flex flex-wrap items-center gap-2">
          {STORE_TABS.map((tab, index) => (
            <Button key={tab} variant={index === 0 ? "outline" : "ghost"}>
              {tab}
            </Button>
          ))}
        </nav>

        <Separator />

        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-primary">สินค้าแนะนำสำหรับคุณ</h2>
            <Button variant="ghost" size="sm">
              ดูทั้งหมด <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PRODUCTS.map((product) => <ProductCard key={product.name} product={product} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
