import { CircleUserRound, ClipboardList, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACCOUNT_LINKS = [
  { label: "ภาพรวมบัญชี", to: "/account/profile", icon: CircleUserRound },
  { label: "ประวัติการสั่งซื้อ", to: "/account/orders", icon: ClipboardList },
  { label: "สมุดที่อยู่", to: "/account/addresses", icon: MapPin },
] as const;

export function AccountSidebar() {
  const { pathname } = useLocation();

  return (
    <Card className="h-fit gap-5 rounded-xl p-4 shadow-none lg:sticky lg:top-28">
      <CardHeader className="flex-row items-center gap-3 px-0">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">สช</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <CardTitle className="truncate text-lg font-semibold">สมชาย ใจดี</CardTitle>
          <p className="truncate text-sm text-muted-foreground">somchai.j@example.com</p>
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
