import { translate, useLanguage } from "@/lib/language";
import { CircleUserRound, ClipboardList, Gavel, MapPin, GalleryVerticalEnd, TicketPercent } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** ข้อมูลผู้ใช้เท่าที่แถบนี้ต้องใช้ — หน้าไหนมี `useAuth()` แล้วแปลงด้วย `toSidebarUser` */
export type AccountSidebarUser = {
  initials: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

const ACCOUNT_LINKS = [
  { get label() { return translate("ภาพรวมบัญชี", "Account Overview"); }, to: "/account/profile", icon: CircleUserRound },
  { get label() { return translate("ประวัติคำสั่งซื้อ", "Order History"); }, to: "/account/orders", icon: ClipboardList },
  { get label() { return translate("การประมูลของฉัน", "My auctions"); }, to: "/account/auctions", icon: Gavel },
  { get label() { return translate("สมุดที่อยู่", "Address Book"); }, to: "/account/addresses", icon: MapPin },
  { get label() { return translate("My Coupons · โค้ดของฉัน", "My coupons"); }, to: "/account/coupons", icon: TicketPercent },
  { get label() { return translate("คอลเลกชันของฉัน", "My Collection"); }, to: "/account/collection", icon: GalleryVerticalEnd },
] as const;

export function AccountSidebar({ user }: { user: AccountSidebarUser }) {
  useLanguage();
  const { pathname } = useLocation();

  return (
    <Card className="h-fit gap-5 rounded-xl p-4 shadow-none lg:sticky lg:top-28">
      <CardHeader className="flex-row items-center gap-3 px-0">
        <Avatar className="size-14">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
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
