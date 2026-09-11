import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Link } from "react-router-dom";

import arcaneDeckBox from "@/assets/home/arcane-deck-box.jpg";
import aurasphereMouse from "@/assets/home/aurasphere-mouse.jpg";
import celestialGuardianBox from "@/assets/home/celestial-guardian-box.jpg";
import galacticGuardiansBox from "@/assets/home/galactic-guardians-box.jpg";
import megaEvolutionPitchBlack from "@/assets/home/mega-evolution-pitch-black.jpg";
import pegasusCollectorBox from "@/assets/home/pegasus-collector-box.jpg";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type SearchProduct = {
  id: string;
  type: string;
  title: string;
  price: string;
  image: string;
  imageAlt: string;
  category: string;
  condition: string;
  numericPrice: number;
};

const products: SearchProduct[] = [
  { id: "charizard-vmax-020", type: "Single Card", title: "Charizard VMAX #020", price: "฿12,900", numericPrice: 12900, category: "Pokémon", condition: "Near Mint (NM)", image: arcaneDeckBox, imageAlt: "Charizard VMAX collectible card" },
  { id: "one-piece-op09", type: "Booster Box", title: "ONE PIECE OP-09 Booster Box", price: "฿1,150", numericPrice: 1150, category: "One Piece", condition: "Mint (MT)", image: aurasphereMouse, imageAlt: "ONE PIECE OP-09 booster box" },
  { id: "pikachu-ar", type: "Single Card", title: "Pikachu AR", price: "฿2,790", numericPrice: 2790, category: "Pokémon", condition: "Excellent (EX)", image: galacticGuardiansBox, imageAlt: "Pikachu AR collectible card" },
  { id: "mega-evolution-booster", type: "Booster Box", title: "MEGA Evolution Booster Box", price: "฿4,290", numericPrice: 4290, category: "Pokémon", condition: "Near Mint (NM)", image: megaEvolutionPitchBlack, imageAlt: "MEGA Evolution booster box" },
  { id: "pokemon-151-bundle", type: "Sealed Product", title: "Pokémon 151 Collector Bundle", price: "฿2,490", numericPrice: 2490, category: "Pokémon", condition: "Mint (MT)", image: pegasusCollectorBox, imageAlt: "Pokémon 151 collector bundle" },
  { id: "luffy-gear-5", type: "Single Card", title: "Luffy Gear 5", price: "฿3,450", numericPrice: 3450, category: "One Piece", condition: "Near Mint (NM)", image: aurasphereMouse, imageAlt: "Luffy Gear 5 collectible card" },
  { id: "pegasus-sleeves", type: "Accessories", title: "Pegasus Perfect Fit Sleeves", price: "฿280", numericPrice: 280, category: "Magic: The Gathering", condition: "Mint (MT)", image: celestialGuardianBox, imageAlt: "Pegasus perfect fit card sleeves" },
  { id: "talingchan-deck", type: "Deck", title: "Battle of Talingchan Deck", price: "฿290", numericPrice: 290, category: "Yu-Gi-Oh!", condition: "Excellent (EX)", image: arcaneDeckBox, imageAlt: "Battle of Talingchan card deck" },
];

const categories = ["Pokémon", "Yu-Gi-Oh!", "Magic: The Gathering"];
const conditions = ["Mint (MT)", "Near Mint (NM)", "Excellent (EX)"];

function SearchProductCard({ product }: { product: SearchProduct }) {
  return (
    <Card className="h-[231px] gap-3 rounded-[11px] py-[15px] shadow-none ring-1 ring-foreground/5">
      <CardContent className="px-[19px]">
        <div className="h-[92px] overflow-hidden rounded-lg bg-muted">
          <img
            src={product.image}
            alt={product.imageAlt}
            className="size-full object-contain"
          />
        </div>
      </CardContent>
      <CardHeader className="gap-2 px-[19px]">
        <Badge variant="secondary" className="h-4 rounded-full px-2 text-[9px]">
          {product.type}
        </Badge>
        <CardTitle className="line-clamp-2 h-[37px] text-xs leading-[18px] font-semibold">
          {product.title}
        </CardTitle>
      </CardHeader>
      <CardFooter className="mt-auto px-[19px]">
        <p className="text-base leading-[22px] font-semibold text-primary">
          {product.price}
        </p>
      </CardFooter>
    </Card>
  );
}

export function SearchResultsPage() {
  const [searchInput, setSearchInput] = useState("Charizard");
  const [query, setQuery] = useState("Charizard");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Pokémon"]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(["Near Mint (NM)"]);
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [appliedPrice, setAppliedPrice] = useState({ minimum: "", maximum: "" });
  const [sortBy, setSortBy] = useState("featured");
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const results = useMemo(() => {
    if (!hasInteracted) return products;

    const normalizedQuery = query.toLocaleLowerCase();
    const minimum = Number(appliedPrice.minimum) || 0;
    const maximum = Number(appliedPrice.maximum) || Number.POSITIVE_INFINITY;
    const filtered = products.filter((product) => {
      const matchesQuery = !normalizedQuery || `${product.title} ${product.type}`.toLocaleLowerCase().includes(normalizedQuery);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const matchesCondition = selectedConditions.length === 0 || selectedConditions.includes(product.condition);
      return matchesQuery && matchesCategory && matchesCondition && product.numericPrice >= minimum && product.numericPrice <= maximum;
    });
    if (sortBy === "price-low") return [...filtered].sort((a, b) => a.numericPrice - b.numericPrice);
    if (sortBy === "price-high") return [...filtered].sort((a, b) => b.numericPrice - a.numericPrice);
    return filtered;
  }, [appliedPrice, hasInteracted, query, selectedCategories, selectedConditions, sortBy]);

  const toggleOption = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
    setHasInteracted(true);
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  return (
    <div className="min-h-[783px] bg-muted font-sans">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[21px] px-[21px] pt-8 pb-14">
        <Breadcrumb>
          <BreadcrumbList className="text-[12px]">
            <BreadcrumbItem><BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Search Results</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex flex-col gap-[7px] border-b border-border pb-[22px]">
          <h1 className="text-[32px] leading-[39px] font-bold tracking-[-0.02em] text-foreground">
            Search results for &quot;{query || "All products"}&quot;
          </h1>
          <p className="text-[12px] leading-[18px] text-muted-foreground">{hasInteracted ? results.length : 24} results · Updates automatically 300 ms after you stop typing</p>
        </header>

        <div className="grid items-start gap-[28px] pt-[7px] lg:grid-cols-[228px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-[28px]" aria-label="Search filters">
            <FieldSet>
              <FieldLegend className="text-lg font-semibold">Category</FieldLegend>
              <div className="flex flex-col gap-3">
                {categories.map((category) => {
                  const id = `category-${category.toLocaleLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
                  return <Field key={category} orientation="horizontal"><Checkbox id={id} checked={selectedCategories.includes(category)} onCheckedChange={() => toggleOption(category, selectedCategories, setSelectedCategories)} className="rounded-none" /><FieldLabel htmlFor={id} className="font-normal text-muted-foreground">{category}</FieldLabel></Field>;
                })}
              </div>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend className="text-lg font-semibold">Price Range</FieldLegend>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <Input type="number" inputMode="numeric" min="0" aria-label="Minimum price" placeholder="$  Min" value={minimumPrice} onChange={(event) => setMinimumPrice(event.target.value)} className="rounded-none border-border bg-background" />
                <span className="text-muted-foreground">-</span>
                <Input type="number" inputMode="numeric" min="0" aria-label="Maximum price" placeholder="$  Max" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} className="rounded-none border-border bg-background" />
              </div>
              <Button type="button" className="w-full rounded-md" onClick={() => { setHasInteracted(true); setAppliedPrice({ minimum: minimumPrice, maximum: maximumPrice }); }}>Apply Filter</Button>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend className="text-lg font-semibold">Condition</FieldLegend>
              <div className="flex flex-col gap-3">
                {conditions.map((condition) => {
                  const id = `condition-${condition.toLocaleLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
                  return <Field key={condition} orientation="horizontal"><Checkbox id={id} checked={selectedConditions.includes(condition)} onCheckedChange={() => toggleOption(condition, selectedConditions, setSelectedConditions)} className="rounded-none" /><FieldLabel htmlFor={id} className="font-normal text-muted-foreground">{condition}</FieldLabel></Field>;
                })}
              </div>
            </FieldSet>
          </aside>

          <section className="min-w-0" aria-label="Search results">
            <div className="mb-[21px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-[341px]">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" aria-label="Search products" value={searchInput} onChange={(event) => { setHasInteracted(true); setSearchInput(event.target.value); }} className="rounded-md border-border bg-background pl-10" />
              </div>
              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                <span>Sort by:</span>
                <Select value={sortBy} onValueChange={(value) => { setHasInteracted(true); setSortBy(value ?? "featured"); }}>
                  <SelectTrigger className="w-48 rounded-md border-border bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup><SelectItem value="featured">Featured</SelectItem><SelectItem value="price-low">Price: Low to High</SelectItem><SelectItem value="price-high">Price: High to Low</SelectItem></SelectGroup></SelectContent>
                </Select>
              </div>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 gap-[21px] sm:grid-cols-2 xl:grid-cols-4">
                {results.map((product) => <SearchProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-xl border border-border bg-background p-8 text-center text-muted-foreground">No products match the selected filters.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
