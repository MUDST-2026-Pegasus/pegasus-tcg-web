import { ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountAvatar, useAccountLinks } from "./nav-shared";

export function AccountMenu() {
  const {
    user,
    isAuthenticated,
    isLoading,
    links,
    handleLogout,
    logoutPending,
  } = useAccountLinks();
  if (isLoading)
    return (
      <div
        aria-label="Loading account"
        className="flex h-10 w-10 items-center rounded-full border border-border p-1 lg:w-[130px] lg:pr-3"
      >
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <Skeleton className="ml-2 hidden h-2 flex-1 rounded-full lg:block" />
      </div>
    );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            aria-label="Account"
            className={
              isAuthenticated && user
                ? "h-10 size-10 rounded-full border border-border p-1 data-popup-open:bg-muted data-popup-open:ring-2 data-popup-open:ring-ring/40 lg:size-auto lg:max-w-48 lg:pr-3"
                : "size-10 rounded-full p-0 data-popup-open:bg-muted data-popup-open:ring-2 data-popup-open:ring-ring/40"
            }
          />
        }
      >
        {isAuthenticated && user ? (
          <>
            <AccountAvatar user={user} />
            <span className="hidden max-w-[16ch] truncate text-sm text-foreground lg:inline">
              {user.displayName}
            </span>
            <ChevronDownIcon className="hidden size-4 text-muted-foreground lg:inline" />
          </>
        ) : (
          <UserIcon className="size-5" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="flex w-56 flex-col gap-2 rounded-lg border border-border p-4 shadow-md ring-0"
      >
        {isAuthenticated && user && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5 px-2.5">
                <span className="truncate font-medium">{user.displayName}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        {links.map(({ label, to }) => (
          <DropdownMenuItem
            key={to}
            className="cursor-pointer rounded-lg px-2.5"
            render={<Link to={to} />}
          >
            {label}
          </DropdownMenuItem>
        ))}
        {isAuthenticated && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-2.5"
              disabled={logoutPending}
              onClick={handleLogout}
            >
              <LogOutIcon className="size-4" />
              {logoutPending ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
