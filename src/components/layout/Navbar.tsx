import { SearchIcon, ShoppingCartIcon, UserIcon } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "HOME", to: "/" },
  { label: "ALL PRODUCTS", to: "/products" },
  { label: "SALE", to: "/sale" },
  { label: "NEW ARRIVALS", to: "/new-arrivals" },
  { label: "POKEMON", to: "/pokemon" },
  { label: "ONE PIECE", to: "/one-piece" },
] as const;

const ACCOUNT_MENU = [
  { label: "My Account", to: "/account/profile" },
  { label: "Seller Dashboard", to: "/seller" },
  { label: "Become a Seller", to: "/become-a-seller" },
  { label: "Admin Dashboard", to: "/admin" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 h-20 border-b border-border bg-white px-10 py-3.5 backdrop-blur-[6px]">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-10">
        <Link
          to="/"
          aria-label="Pegasus TCG — กลับหน้าแรก"
          className="flex h-full cursor-pointer items-center text-2xl font-bold uppercase leading-none tracking-[-1.2px] text-sky-700"
        >
          pegasus
        </Link>

        <nav className="flex h-full items-center justify-center gap-8">
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

        <div className="flex h-full items-center gap-5">
          {/* Language switch */}
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

          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            className="flex cursor-pointer items-center justify-center text-sky-700 hover:text-sky-700"
          >
            <SearchIcon className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cart"
            className="flex cursor-pointer items-center justify-center text-sky-700 hover:text-sky-700"
          >
            <ShoppingCartIcon className="size-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Account"
                  className="flex cursor-pointer items-center justify-center text-sky-700 hover:text-sky-700"
                />
              }
            >
              <UserIcon className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="flex w-56 flex-col gap-2 rounded-lg border border-border p-4 shadow-md ring-0"
            >
              {ACCOUNT_MENU.map(({ label, to }) => (
                <DropdownMenuItem
                  key={to}
                  className="cursor-pointer rounded-lg px-2.5"
                  render={<Link to={to} />}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
