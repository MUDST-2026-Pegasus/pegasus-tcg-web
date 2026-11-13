import {
  CircleUserRound,
  ClipboardList,
  Gavel,
  MapPin,
  GalleryVerticalEnd,
  TicketPercent,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslate } from "@/lib/i18n";

/** ข้อมูลผู้ใช้เท่าที่แถบนี้ต้องใช้ — หน้าไหนมี `useAuth()` แล้วแปลงด้วย `toSidebarUser` */
export type AccountSidebarUser = {
  initials: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};


export function AccountSidebar({ user }: { user: AccountSidebarUser }) {
  const { pathname } = useLocation();
  const { t } = useTranslate("buyer");
  const accountLinks = [
    { label: t("account.nav.overview", "ภาพรวมบัญชี"), to: "/account/profile", icon: CircleUserRound },
    { label: t("account.nav.orders", "ประวัติคำสั่งซื้อ"), to: "/account/orders", icon: ClipboardList },
    { label: t("account.nav.auctions", "การประมูล"), to: "/account/auctions", icon: Gavel },
    { label: t("account.nav.addresses", "สมุดที่อยู่"), to: "/account/addresses", icon: MapPin },
    { label: t("account.nav.coupons", "โค้ดของฉัน"), to: "/account/coupons", icon: TicketPercent },
    { label: t("account.nav.collection", "คอลเลกชันของฉัน"), to: "/account/collection", icon: GalleryVerticalEnd },
  ];

  return (
    <Card className="h-fit gap-5 rounded-xl p-4 shadow-none lg:sticky lg:top-28">
      <CardHeader className="flex-row items-center gap-3 px-0">
        <Avatar className="size-14">
          {user.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          )}
          <AvatarFallback className="text-lg">{user.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <CardTitle className="truncate text-lg font-semibold">
            {user.name}
          </CardTitle>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-0">
        {accountLinks.map(({ label, to, icon: Icon }) => (
          <Button
            key={to}
            variant={pathname === to ? "default" : "ghost"}
            className="w-full justify-start"
            render={<Link to={to} />}
          >
            <Icon data-icon="inline-start" /> {label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
