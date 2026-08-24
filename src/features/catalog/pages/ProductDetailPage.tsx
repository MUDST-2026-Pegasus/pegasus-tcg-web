import { useState } from "react"
import { BadgeCheck, ChevronRight, Heart, PackageCheck, ShieldCheck, ShoppingCart, Sparkles, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const productImages = [
  "https://images.pokemontcg.io/swsh3/20_hires.png",
  "https://images.pokemontcg.io/swsh3/20.png",
  "https://images.pokemontcg.io/swsh3/19_hires.png",
]

const conditions = [
  { label: "Near Mint", short: "NM", price: 12900 },
  { label: "Lightly Played", short: "LP", price: 11200 },
  { label: "Moderately Played", short: "MP", price: 9450 },
]

const listings = [
  { seller: "CardVault BKK", rating: "4.9 · 1.2k sales", condition: "Near Mint", delivery: "Ships in 1–2 days", price: 12900 },
  { seller: "PokeHub Thailand", rating: "4.8 · 847 sales", condition: "Near Mint", delivery: "Free tracked shipping", price: 13250 },
  { seller: "RareCard Station", rating: "5.0 · 326 sales", condition: "Lightly Played", delivery: "Ships tomorrow", price: 11200 },
]

const formatPrice = (price: number) => `฿${price.toLocaleString()}`

export function ProductDetailPage() {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedCondition, setSelectedCondition] = useState(conditions[0])
  const [isWatching, setIsWatching] = useState(false)

  return (
    <div className="flex-1 bg-[#F4F4F5] font-sans text-foreground">
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-8 sm:px-6 lg:py-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {['Home', 'Pokémon', 'Darkness Ablaze'].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <a href="#" className="hover:text-[#0052cc]">{item}</a><ChevronRight className="size-4" />
            </span>
          ))}
          <span className="font-medium text-foreground">Charizard VMAX</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.03fr)_minmax(390px,.97fr)] lg:gap-12">
          <div className="grid gap-4 sm:grid-cols-[78px_minmax(0,1fr)]">
            <div className="order-2 flex gap-3 sm:order-1 sm:flex-col">
              {productImages.map((image, index) => (
                <button key={image} type="button" onClick={() => setSelectedImage(index)} aria-label={`View product image ${index + 1}`}
                  className={`flex aspect-[3/4] w-[70px] items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-1.5 transition sm:w-full ${selectedImage === index ? "border-[#0052cc] shadow-sm" : "border-transparent hover:border-[#0052cc]/40"}`}>
                  <img src={image} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
            <div className="order-1 flex min-h-[500px] items-center justify-center rounded-2xl border bg-white p-8 shadow-sm sm:order-2 lg:min-h-[620px]">
              <img src={productImages[selectedImage]} alt="Charizard VMAX Pokémon card" className="max-h-[560px] w-full object-contain drop-shadow-[0_18px_24px_rgba(24,24,27,0.22)]" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#0052cc]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0052cc]">Pokémon TCG</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Ultra Rare</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Charizard VMAX #020</h1>
              <p className="mt-2 text-muted-foreground">Sword & Shield — Darkness Ablaze · 020/189</p>
            </div>

            <Card className="gap-0 rounded-2xl border bg-white p-0 shadow-none">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-medium text-muted-foreground">Market price</p><p className="mt-1 text-4xl font-bold">{formatPrice(selectedCondition.price)}</p></div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right text-xs font-semibold text-emerald-700"><span className="block text-sm">▲ 4.8%</span>last 30 days</div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-sm">
                  <div><span className="block text-xs text-muted-foreground">Last sold</span><strong>฿12,650</strong></div>
                  <div><span className="block text-xs text-muted-foreground">Listed from</span><strong>฿12,900</strong></div>
                  <div><span className="block text-xs text-muted-foreground">Available</span><strong>18 cards</strong></div>
                </div>
              </CardContent>
            </Card>

            <div>
              <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Select condition</h2><button type="button" className="text-sm font-semibold text-[#0052cc] hover:underline">Condition guide</button></div>
              <div className="grid gap-3 sm:grid-cols-3">
                {conditions.map((condition) => (
                  <button key={condition.short} type="button" onClick={() => setSelectedCondition(condition)}
                    className={`rounded-xl border-2 bg-white p-3 text-left transition ${selectedCondition.short === condition.short ? "border-[#0052cc] ring-2 ring-[#0052cc]/10" : "border-border hover:border-[#0052cc]/40"}`}>
                    <span className="block text-sm font-bold">{condition.short}</span><span className="block text-xs text-muted-foreground">{condition.label}</span><span className="mt-2 block text-sm font-semibold">{formatPrice(condition.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button className="h-14 w-full rounded-full bg-[#0052cc] text-base font-bold text-white shadow-md hover:bg-[#0052cc]/90"><ShoppingCart className="size-5" />Buy now · {formatPrice(selectedCondition.price)}</Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 rounded-full bg-white font-semibold">Make an offer</Button>
              <Button type="button" variant="outline" onClick={() => setIsWatching((value) => !value)} className="h-12 rounded-full bg-white font-semibold">
                <Heart className={`size-4 ${isWatching ? "fill-[#C62828] text-[#C62828]" : ""}`} />{isWatching ? "Watching" : "Add to watchlist"}
              </Button>
            </div>
            <div className="grid grid-cols-3 divide-x rounded-2xl border bg-white px-2 py-4 text-center">
              <div className="px-2"><Truck className="mx-auto mb-2 size-5 text-[#0052cc]" /><p className="text-xs font-semibold">Tracked shipping</p></div>
              <div className="px-2"><ShieldCheck className="mx-auto mb-2 size-5 text-[#0052cc]" /><p className="text-xs font-semibold">Buyer protection</p></div>
              <div className="px-2"><BadgeCheck className="mx-auto mb-2 size-5 text-[#0052cc]" /><p className="text-xs font-semibold">Verified sellers</p></div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-[#0052cc]">18 available</p><h2 className="mt-1 text-2xl font-bold">Market listings</h2></div><button type="button" className="text-sm font-semibold text-[#0052cc] hover:underline">View all</button></div>
          <div className="flex flex-col divide-y">
            {listings.map((listing) => (
              <article key={listing.seller} className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[1.3fr_.8fr_.8fr_auto] sm:items-center">
                <div><div className="flex items-center gap-2 font-bold"><BadgeCheck className="size-4 text-[#0052cc]" />{listing.seller}</div><p className="mt-1 text-sm text-muted-foreground">★ {listing.rating}</p></div>
                <div><span className="block text-xs text-muted-foreground">Condition</span><strong className="text-sm">{listing.condition}</strong></div>
                <div><span className="block text-xs text-muted-foreground">Delivery</span><strong className="text-sm">{listing.delivery}</strong></div>
                <div className="flex items-center justify-between gap-4 sm:justify-end"><strong className="text-xl">{formatPrice(listing.price)}</strong><Button className="rounded-full bg-[#0052cc] px-5 text-white hover:bg-[#0052cc]/90">Add</Button></div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="gap-0 rounded-2xl border bg-white p-0 shadow-none"><CardContent className="p-6 sm:p-7">
            <div className="mb-6 flex items-center gap-3"><Sparkles className="size-5 text-[#0052cc]" /><h2 className="text-2xl font-bold">Card attributes</h2></div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
              {[['Card number','020/189'],['Rarity','Ultra Rare'],['Card type','Pokémon VMAX'],['Stage','VMAX'],['HP','330'],['Artist','5ban Graphics']].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
            </dl>
          </CardContent></Card>
          <Card className="gap-0 rounded-2xl border bg-white p-0 shadow-none"><CardContent className="p-6 sm:p-7">
            <div className="mb-6 flex items-center gap-3"><PackageCheck className="size-5 text-[#0052cc]" /><h2 className="text-2xl font-bold">Attacks</h2></div>
            <div className="space-y-5">
              <div className="border-b pb-5"><div className="flex justify-between"><strong>Claw Slash</strong><strong className="text-xl">100</strong></div><p className="mt-2 text-sm text-muted-foreground">A powerful slashing attack.</p></div>
              <div><div className="flex justify-between"><strong>G-Max Wildfire</strong><strong className="text-xl">300</strong></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Discard 2 Energy from this Pokémon. Your opponent's Active Pokémon is now Burned.</p></div>
            </div>
          </CardContent></Card>
        </section>
      </main>
    </div>
  )
}
