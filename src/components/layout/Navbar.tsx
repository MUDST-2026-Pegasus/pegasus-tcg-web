import { SearchIcon, ShoppingCartIcon, UserIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Button } from "#components/ui/button";
import { cn } from "#lib/utils";

const NAV_LINKS = [
  { label: "HOME", to: "/" },
  { label: "ALL PRODUCTS", to: "/products" },
  { label: "SALE", to: "/sale" },
  { label: "NEW ARRIVALS", to: "/new-arrivals" },
  { label: "POKEMON", to: "/pokemon" },
  { label: "ONE PIECE", to: "/one-piece" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-[6px]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-12 py-4">
        <span className="text-2xl font-black tracking-[-1.2px] text-primary">
          PEGASUS
        </span>
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
          <Button variant="ghost" size="icon" aria-label="Search">
            <SearchIcon />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Cart">
            <ShoppingCartIcon />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Account">
            <UserIcon />
          </Button>
        </div>
      </div>
    </header>
  );
}
