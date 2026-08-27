import { CircleUserRound, ClipboardList, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ACCOUNT_USER } from "@/features/account/account.fixture";

const ACCOUNT_LINKS = [
  { label: "Account Overview", to: "/account/profile", icon: CircleUserRound },
  { label: "Order History", to: "/account/orders", icon: ClipboardList },
  { label: "Address Book", to: "/account/addresses", icon: MapPin },
] as const;

export function AccountSidebar({ user }: { user: typeof ACCOUNT_USER }) {
  const { pathname } = useLocation();

  return (
    <Card className="h-fit gap-5 rounded-xl p-4 shadow-none lg:sticky lg:top-28">
      <CardHeader className="flex-row items-center gap-3 px-0">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">{user.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <CardTitle className="truncate text-lg font-semibold">{user.name}</CardTitle>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-0">
        {ACCOUNT_LINKS.map(({ label, to, icon: Icon }) => (
          <Button key={to} variant={pathname === to ? "default" : "ghost"} className="w-full justify-start" render={<Link to={to} />}>
            <Icon data-icon="inline-start" /> {label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
