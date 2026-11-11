import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ChevronRightIcon,
  LogOutIcon,
  PercentIcon,
  MenuIcon,
  SearchIcon,
  ShoppingCartIcon,
  SparklesIcon,
  GavelIcon,
  StoreIcon,
  XIcon,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { AccountAvatar, useAccountLinks } from "@/components/layout/nav-shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/features/cart/cart.queries";
import { useGameList } from "@/features/catalog/catalog.queries";
import { useSales } from "@/features/sale/sale.queries";
import { useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitch() {
  return (
    <button
      type="button"
      disabled
      aria-label="Switch language"
      className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
    >
      <span className="text-primary">TH</span>
      <span className="flex h-[22px] w-10 items-center rounded-full bg-primary p-[3px]">
        <span className="size-4 rounded-full bg-background" />
      </span>
      <span>EN</span>
    </button>
  );
}

function Logo({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslate();
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label={t("nav.logoAria", "Pegasus TCG — กลับหน้าแรก")}
      className="flex shrink-0 items-center gap-2"
    >
      <img
        src="/site-icon.jpg"
        alt=""
        className="size-9 rounded-full object-cover"
      />
      <span className="text-[22px] font-extrabold tracking-[-0.8px] text-primary">
        PEGASUS
      </span>
    </Link>
  );
}

export function Navbar() {
  const { t } = useTranslate();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: cart } = useCart();
  const { data: games } = useGameList();
  const { data: sales } = useSales();
  const {
    user,
    isAuthenticated,
    isLoading,
    sellerLink,
    links,
    handleLogout,
    logoutPending,
  } = useAccountLinks();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<{ key: string; value: string } | null>(
    null,
  );
  const query =
    draft?.key === location.key ? draft.value : (searchParams.get("q") ?? "");
  const setQuery = (value: string) => setDraft({ key: location.key, value });
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const isSearch = location.pathname === "/search";
  const currentGame = searchParams.get("game");
  const newest = searchParams.get("sort") === "newest";
  const pokemonSlug =
    games?.find((g) => g.code === "POKEMON")?.slug ?? "pokemon-tcg";
  const onePieceSlug =
    games?.find((g) => g.code === "ONE_PIECE")?.slug ?? "one-piece-card-game";
  const navLinks = [
    { label: t("nav.home", "หน้าแรก"), to: "/", active: location.pathname === "/" },
    {
      label: t("nav.allProducts", "สินค้าทั้งหมด"),
      to: "/search",
      active: isSearch && !currentGame && !newest,
    },
    {
      label: "Pokémon",
      to: `/search?game=${encodeURIComponent(pokemonSlug)}`,
      active: isSearch && currentGame === pokemonSlug,
    },
    {
      label: "One Piece",
      to: `/search?game=${encodeURIComponent(onePieceSlug)}`,
      active: isSearch && currentGame === onePieceSlug,
    },
    {
      label: t("nav.newArrivals", "มาใหม่"),
      to: "/search?sort=newest",
      active: isSearch && !currentGame && newest,
      icon: SparklesIcon,
    },
    // ระบบประมูล [TCG-636]
    {
      label: t("nav.auction", "ประมูล"),
      to: "/auctions",
      active: location.pathname.startsWith("/auctions"),
      icon: GavelIcon,
    },
    // Sale pill shows only while a sale campaign is live [TCG-683]
    ...(sales && sales.length > 0
      ? [
          {
            label: t("nav.sale", "ลดราคา"),
            to: "/sale",
            active: location.pathname.startsWith("/sale"),
            icon: PercentIcon,
          },
        ]
      : []),
  ];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.key === "/" &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !(
          target instanceof Element &&
          target.closest("input, textarea, [contenteditable='true']")
        )
      ) {
        event.preventDefault();
        (window.innerWidth < 768
          ? mobileSearchRef
          : searchRef
        ).current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = isSearch
      ? new URLSearchParams(searchParams)
      : new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.delete("page");
    navigate(`/search${params.size ? `?${params}` : ""}`);
  };
  const blurSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") event.currentTarget.blur();
  };
  const quantity = cart?.totalQuantity ?? 0;
  const cartButton = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        cart
          ? t("nav.cartWithCount", "ตะกร้าสินค้า มีสินค้า {count} ชิ้น", { count: quantity })
          : t("nav.cart", "ตะกร้าสินค้า")
      }
      className="relative size-10 shrink-0 overflow-visible md:order-first"
      nativeButton={false}
      render={<Link to="/cart" />}
    >
      <ShoppingCartIcon className="size-5" />
      {quantity > 0 && (
        <Badge
          aria-hidden="true"
          className="absolute -right-1 -top-1 h-[18px] min-w-[18px] rounded-full border-2 border-background bg-destructive px-1 text-[10px] text-white"
        >
          {quantity > 99 ? "99+" : quantity}
        </Badge>
      )}
    </Button>
  );
  const pills = navLinks.map(({ label, to, active, icon: Icon }, index) => (
    <span key={to} className="flex shrink-0 items-center">
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "bg-primary/10 font-semibold text-primary hover:bg-primary/10"
            : "font-medium text-foreground hover:bg-muted",
        )}
      >
        {Icon && <Icon className="size-4" />}
        {label}
      </Link>
      {index === 3 && <span className="mx-2 h-5 w-px bg-border" />}
    </span>
  ));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-1 px-2 md:h-16 md:gap-6 md:px-6 lg:gap-8 lg:px-10">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("nav.openMenu", "เปิดเมนู")}
                className="size-10 shrink-0 md:hidden"
              />
            }
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="!w-[312px] max-w-[calc(100vw-40px)] p-0 md:hidden"
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <SheetTitle>
                <Logo onClick={() => setDrawerOpen(false)} />
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("nav.closeMenu", "ปิดเมนู")}
                onClick={() => setDrawerOpen(false)}
              >
                <XIcon className="size-5" />
              </Button>
            </div>
            <div className="border-b border-border px-4 py-3">
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2 w-36" />
                  </div>
                </div>
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <AccountAvatar user={user} size="lg" />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {user.displayName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {t("nav.loginHint", "เข้าสู่ระบบเพื่อดูคำสั่งซื้อและคอลเลกชันของคุณ")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 rounded-full"
                      nativeButton={false}
                      render={
                        <Link
                          to="/login"
                          onClick={() => setDrawerOpen(false)}
                        />
                      }
                    >
                      {t("nav.login", "เข้าสู่ระบบ")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full"
                      nativeButton={false}
                      render={
                        <Link
                          to="/register"
                          onClick={() => setDrawerOpen(false)}
                        />
                      }
                    >
                      {t("nav.signup", "สมัครสมาชิก")}
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
              <div className="px-2 text-xs font-bold tracking-widest text-muted-foreground">
                {t("nav.shop", "ช้อป")}
              </div>
              {navLinks.map(({ label, to, active, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setDrawerOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active &&
                      "bg-primary/10 font-semibold text-primary hover:bg-primary/10",
                  )}
                >
                  {Icon && <Icon className="size-4" />}
                  <span className="flex-1">{label}</span>
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </Link>
              ))}
              {!isLoading && isAuthenticated && (
                <>
                  <div className="mt-6 px-2 text-xs font-bold tracking-widest text-muted-foreground">
                    {t("nav.account", "บัญชี")}
                  </div>
                  {links.map(({ label, to }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setDrawerOpen(false)}
                      className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {to === sellerLink.to && <StoreIcon className="size-4" />}
                      <span className="flex-1">{label}</span>
                      <ChevronRightIcon className="size-4 text-muted-foreground" />
                    </Link>
                  ))}
                </>
              )}
            </div>
            {isAuthenticated && (
              <div className="border-t border-border p-4 text-right">
                <Button
                  variant="ghost"
                  disabled={logoutPending}
                  onClick={() => {
                    setDrawerOpen(false);
                    void handleLogout();
                  }}
                >
                  <LogOutIcon className="size-4" />
                  {t("nav.logout", "ออกจากระบบ")}
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
        <Logo />
        <form
          onSubmit={submitSearch}
          role="search"
          className="group hidden h-11 min-w-0 max-w-[640px] flex-1 items-center gap-2 rounded-full border border-border bg-muted px-4 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring md:flex"
        >
          <SearchIcon className="size-[18px] shrink-0 text-muted-foreground" />
          <input
            ref={searchRef}
            aria-label={t("nav.search", "ค้นหา")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={blurSearch}
            placeholder={t("nav.searchPlaceholder", "ค้นหาการ์ด ชุดการ์ด หรือร้านค้า…")}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground group-focus-within:hidden">
            /
          </kbd>
        </form>
        <div className="ml-auto flex items-center gap-1">
          <AccountMenu />
          {cartButton}
        </div>
      </div>
      <form
        onSubmit={submitSearch}
        role="search"
        className="mx-4 mb-2.5 flex h-10 items-center gap-2 rounded-full border border-border bg-muted px-4 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring md:hidden"
      >
        <SearchIcon className="size-[18px] text-muted-foreground" />
        <input
          ref={mobileSearchRef}
          aria-label={t("nav.search", "ค้นหา")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={blurSearch}
          placeholder={t("nav.searchPlaceholder", "ค้นหาการ์ด ชุดการ์ด หรือร้านค้า…")}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </form>
      <nav
        aria-label={t("nav.categories", "หมวดหมู่สินค้า")}
        className="h-11 overflow-x-auto border-t border-border [scrollbar-width:none] md:h-11"
      >
        <div className="mx-auto flex h-full min-w-max max-w-[1440px] items-center gap-1 px-3 md:px-6 lg:px-8">
          {pills}
          {!isLoading && isAuthenticated && (
            <Link
              to={sellerLink.to}
              className="ml-auto hidden h-8 items-center gap-1.5 rounded-lg px-2 text-sm whitespace-nowrap text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
            >
              <StoreIcon className="size-4" />
              {sellerLink.to === "/seller"
                ? sellerLink.label
                : t("nav.becomeSeller", "สมัครเป็นผู้ขาย")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
