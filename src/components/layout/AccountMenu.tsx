import { ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AccountAvatar, useAccountLinks } from "./nav-shared";

export function AccountMenu() {
  const { user, isAuthenticated, links, handleLogout, logoutPending } = useAccountLinks();
  return <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="ghost" aria-label="Account" className={isAuthenticated && user ? "h-10 max-w-48 rounded-full border border-border px-1 pr-3" : "size-10 rounded-full p-0"} />}>
      {isAuthenticated && user ? <><AccountAvatar user={user} /><span className="hidden max-w-24 truncate text-sm text-foreground md:inline">{user.displayName}</span><ChevronDownIcon className="hidden size-4 text-muted-foreground md:inline" /></> : <UserIcon className="size-5" />}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="flex w-56 flex-col gap-2 rounded-lg border border-border p-4 shadow-md ring-0">
      {isAuthenticated && user && <><DropdownMenuGroup><DropdownMenuLabel className="flex flex-col gap-0.5 px-2.5"><span className="truncate font-medium">{user.displayName}</span><span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span></DropdownMenuLabel></DropdownMenuGroup><DropdownMenuSeparator /></>}
      {links.map(({ label, to }) => <DropdownMenuItem key={to} className="cursor-pointer rounded-lg px-2.5" render={<Link to={to} />}>{label}</DropdownMenuItem>)}
      {isAuthenticated && <><DropdownMenuSeparator /><DropdownMenuItem className="cursor-pointer rounded-lg px-2.5" disabled={logoutPending} onClick={handleLogout}><LogOutIcon className="size-4" />{logoutPending ? "Logging out…" : "Log out"}</DropdownMenuItem></>}
    </DropdownMenuContent>
  </DropdownMenu>;
}
