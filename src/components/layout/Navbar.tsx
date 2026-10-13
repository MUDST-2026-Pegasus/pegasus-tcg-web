import { SearchIcon, ShoppingCartIcon } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { AccountMenu } from "@/components/layout/AccountMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "HOME", to: "/" },
  { label: "ALL PRODUCTS", to: "/products" },
  { label: "POKEMON", to: "/pokemon" },
  { label: "ONE PIECE", to: "/one-piece" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 h-20 border-b border-border bg-white px-10 py-3.5 backdrop-blur-[6px]">
      {/* คอลัมน์ซ้าย-ขวากว้างเท่ากัน เมนูจึงอยู่กึ่งกลางหน้าเสมอ แม้โลโก้กับกลุ่มไอคอนกว้างไม่เท่ากัน */}
      <div className="mx-auto grid h-full max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-10">
        <Link
          to="/"
          aria-label="Pegasus TCG — กลับหน้าแรก"
          className="flex h-full cursor-pointer items-center justify-self-start text-2xl font-bold uppercase leading-none tracking-[-1.2px] text-sky-700"
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

        <div className="flex h-full items-center gap-5 justify-self-end">
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
            aria-label="Cart"
            className="flex cursor-pointer items-center justify-center text-sky-700 hover:text-sky-700"
            nativeButton={false}
            render={<Link to="/cart" />}
          >
            <ShoppingCartIcon className="size-5" />
          </Button>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
