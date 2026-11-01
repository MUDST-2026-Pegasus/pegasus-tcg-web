import { SearchIcon, ShoppingCartIcon } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { AccountMenu } from "@/components/layout/AccountMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/features/cart/cart.queries";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "HOME", to: "/" },
  { label: "ALL PRODUCTS", to: "/products" },
  { label: "POKEMON", to: "/pokemon" },
  { label: "ONE PIECE", to: "/one-piece" },
] as const;

export function Navbar() {
  const { data: cart } = useCart();
  const cartQuantity = cart?.totalQuantity ?? 0;

  return (
    <header className="sticky top-0 z-40 h-20 border-b border-border bg-white px-4 py-3.5 backdrop-blur-[6px] lg:px-10">
      {/* คอลัมน์ซ้าย-ขวากว้างเท่ากัน เมนูจึงอยู่กึ่งกลางหน้าเสมอ แม้โลโก้กับกลุ่มไอคอนกว้างไม่เท่ากัน */}
      <div className="mx-auto grid h-full max-w-[1280px] min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        <Link
          to="/"
          aria-label="Pegasus TCG — กลับหน้าแรก"
          className="flex h-full min-w-0 cursor-pointer items-center justify-self-start text-xl sm:text-2xl font-bold uppercase leading-none tracking-[-1.2px] text-sky-700"
        >
          pegasus
        </Link>

        <nav className="hidden h-full items-center justify-center gap-8 lg:flex">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className="relative flex h-8 items-center whitespace-nowrap px-2"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "text-sm font-bold uppercase leading-none tracking-wide",
                      isActive ? "text-sky-700" : "text-zinc-700",
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      "absolute bottom-0 left-0 h-[2px] w-full rounded-full",
                      isActive ? "bg-sky-700" : "bg-transparent",
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex h-full items-center gap-1 justify-self-end sm:gap-3 lg:gap-5">
          {/* Language switch — ปิดไว้ก่อนจนกว่าจะมีระบบ i18n จริง [TCG-467]
          <button
            type="button"
            aria-label="Switch language"
            className="flex h-full w-20 items-center justify-between"
          >
            <span className="leading-none text-xs font-bold text-sky-700">
              TH
            </span>
            <span className="relative flex h-5 w-10 items-center rounded-xl bg-sky-700">
              <span className="absolute left-[2px] size-4 rounded-full bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.18)]" />
            </span>
            <span className="leading-none text-xs font-semibold text-gray-500">
              EN
            </span>
          </button>
          */}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            className="flex cursor-pointer items-center justify-center text-sky-700 hover:text-sky-700"
            nativeButton={false}
            render={<Link to="/search" />}
          >
            <SearchIcon className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={cart ? `ตะกร้าสินค้า มีสินค้า ${cartQuantity} ชิ้น` : "ตะกร้าสินค้า"}
            className="relative flex cursor-pointer items-center justify-center overflow-visible text-sky-700 hover:text-sky-700"
            nativeButton={false}
            render={<Link to="/cart" />}
          >
            <ShoppingCartIcon className="size-5" />
            {cartQuantity > 0 && (
              <Badge
                aria-hidden="true"
                className="absolute -right-1.5 -top-1.5 h-5 min-w-5 rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
              >
                {cartQuantity > 99 ? "99+" : cartQuantity}
              </Badge>
            )}
          </Button>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
