import { LogOutIcon, UserIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useLogout } from "@/features/auth/auth.queries";

const GUEST_MENU = [
  { label: "Log in", to: "/login" },
  { label: "Sign up", to: "/register" },
] as const;

/** การซ่อนลิงก์ไม่ใช่การกัน — คนกดเข้าไปตรง ๆ ยังโดน `RequireAuth` กันอยู่ดี */
export function AccountMenu() {
  const navigate = useNavigate();
  const { user, isAuthenticated, hasRole } = useAuth();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/", { replace: true });
  };

  return (
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
        {isAuthenticated && user ? (
          <>
            {/* Base UI: GroupLabel ต้องอยู่ใน Group ไม่งั้น context หายแล้วหน้าพัง */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5 px-2.5">
                <span className="truncate font-medium text-foreground">
                  {user.displayName}
                </span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-2.5"
              render={<Link to="/account/profile" />}
            >
              My Account
            </DropdownMenuItem>

            {hasRole("SELLER") ? (
              <DropdownMenuItem
                className="cursor-pointer rounded-lg px-2.5"
                render={<Link to="/seller" />}
              >
                Seller Dashboard
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="cursor-pointer rounded-lg px-2.5"
                render={<Link to="/become-a-seller" />}
              >
                Become a Seller
              </DropdownMenuItem>
            )}

            {hasRole("ADMIN") && (
              <DropdownMenuItem
                className="cursor-pointer rounded-lg px-2.5"
                render={<Link to="/admin" />}
              >
                Admin Dashboard
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-2.5"
              disabled={logout.isPending}
              onClick={handleLogout}
            >
              <LogOutIcon className="size-4" />
              {logout.isPending ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </>
        ) : (
          GUEST_MENU.map(({ label, to }) => (
            <DropdownMenuItem
              key={to}
              className="cursor-pointer rounded-lg px-2.5"
              render={<Link to={to} />}
            >
              {label}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
