import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type StoreTabsProps = {
  activeTab: string;
  listingsTotal?: number;
  collectionTotal?: number;
  ratingCount?: number;
  isNonSeller?: boolean;
};

export function StoreTabs({
  activeTab,
  listingsTotal,
  collectionTotal,
  ratingCount,
  isNonSeller = false,
}: StoreTabsProps) {
  return (
    <TabsList
      aria-label="Store tabs"
      className="flex h-auto! w-full items-center justify-start gap-6 sm:gap-8 rounded-none border-b border-border bg-transparent p-0 overflow-x-auto"
    >
      <TabsTrigger
        value="products"
        aria-label={`สินค้าที่วางขาย (${listingsTotal ?? 0})`}
        className={cn(
          "flex-none! w-auto! h-12 rounded-none border-0 border-b-2 bg-transparent! px-1 pb-3 pt-2 text-sm sm:text-base font-medium transition-colors hover:text-foreground after:hidden!",
          activeTab === "products"
            ? "border-primary! text-primary! font-semibold"
            : "border-transparent! text-muted-foreground hover:border-border",
        )}
      >
        <span>สินค้าที่วางขาย</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums transition-colors",
            activeTab === "products"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {listingsTotal ?? "—"}
        </span>
      </TabsTrigger>

      <TabsTrigger
        value="collection"
        aria-label={`คอลเลกชัน (${collectionTotal ?? 0})`}
        className={cn(
          "flex-none! w-auto! h-12 rounded-none border-0 border-b-2 bg-transparent! px-1 pb-3 pt-2 text-sm sm:text-base font-medium transition-colors hover:text-foreground after:hidden!",
          activeTab === "collection"
            ? "border-primary! text-primary! font-semibold"
            : "border-transparent! text-muted-foreground hover:border-border",
        )}
      >
        <span>คอลเลกชัน</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums transition-colors",
            activeTab === "collection"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {collectionTotal ?? "—"}
        </span>
      </TabsTrigger>

      {!isNonSeller && (
        <TabsTrigger
          value="reviews"
          aria-label={`รีวิวจากผู้ซื้อ (${ratingCount ?? 0})`}
          className={cn(
            "flex-none! w-auto! h-12 rounded-none border-0 border-b-2 bg-transparent! px-1 pb-3 pt-2 text-sm sm:text-base font-medium transition-colors hover:text-foreground after:hidden!",
            activeTab === "reviews"
              ? "border-primary! text-primary! font-semibold"
              : "border-transparent! text-muted-foreground hover:border-border",
          )}
        >
          <span>รีวิวจากผู้ซื้อ</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums transition-colors",
              activeTab === "reviews"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {ratingCount ?? "—"}
          </span>
        </TabsTrigger>
      )}
    </TabsList>
  );
}
