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

/** เมนูใต้ไอคอนผู้ใช้ — อ้างจาก Figma node 939:222 (Account Menu) */
const ACCOUNT_MENU = [
  { label: "My Account", to: "/account/profile" },
  { label: "Seller Dashboard", to: "/seller" },
  { label: "Become a Seller", to: "/become-a-seller" },
  { label: "Admin Dashboard", to: "/admin" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 h-20 border-b border-border bg-background/90 backdrop-blur-[6px]">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link
          to="/"
          aria-label="Pegasus TCG — กลับหน้าแรก"
          className="cursor-pointer text-2xl font-black tracking-[-1.2px] text-primary"
        >
          PEGASUS
        </Link>
        <nav className="flex items-center">
          {NAV_LINKS.map(({ label, to }, index) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={cn(
                "rounded-lg pt-1 pr-2 pb-1.5 text-sm whitespace-nowrap",
                index === 0 ? "pl-2" : "pl-8",
              )}
            >
              {({ isActive }) => (
                <span className="inline-flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      isActive
                        ? "font-semibold text-primary"
                        : "font-normal text-foreground",
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      "h-0.5 w-full rounded-b-full",
                      isActive ? "bg-primary" : "bg-transparent",
                    )}
                  />
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            className="cursor-pointer"
          >
            <SearchIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cart"
            className="cursor-pointer"
          >
            <ShoppingCartIcon />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Account"
                  className="cursor-pointer"
                />
              }
            >
              <UserIcon />
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
