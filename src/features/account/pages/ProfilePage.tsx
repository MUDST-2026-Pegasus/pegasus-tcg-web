import {
  ArrowRight, BadgeCheck, Check, CircleUserRound, ClipboardList, CreditCard,
  Diamond, MapPin, Package, Pencil, Plus, Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function ProfileAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <Avatar className={compact ? "size-14" : "size-28"}>
      <AvatarFallback className={compact ? "text-lg" : "text-3xl"}>สช</AvatarFallback>
      {!compact && <AvatarBadge className="size-6"><BadgeCheck /></AvatarBadge>}
    </Avatar>
  );
}

function AccountMenu() {
  return (
    <Card className="h-fit gap-5 rounded-xl p-4 shadow-none lg:sticky lg:top-28">
      <CardHeader className="flex-row items-center gap-3 px-0">
        <ProfileAvatar compact />
        <div className="min-w-0">
          <CardTitle className="truncate text-lg font-semibold">สมชาย ใจดี</CardTitle>
          <p className="truncate text-sm text-muted-foreground">somchai.j@example.com</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-0">
        <Button className="w-full justify-start" render={<Link to="/account/profile" />}>
          <CircleUserRound data-icon="inline-start" /> ภาพรวมบัญชี
        </Button>
        <Button variant="ghost" className="w-full justify-start" render={<Link to="/account/orders" />}>
          <ClipboardList data-icon="inline-start" /> ประวัติการสั่งซื้อ
        </Button>
        <Button variant="ghost" className="w-full justify-start" render={<Link to="/account/addresses" />}>
          <MapPin data-icon="inline-start" /> สมุดที่อยู่
        </Button>
      </CardContent>
    </Card>
  );
}

function ProfileSummary() {
  return (
    <Card className="rounded-xl shadow-none">
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <ProfileAvatar />
        <div>
          <h2 className="text-2xl font-semibold">สมชาย ใจดี</h2>
          <p className="text-muted-foreground">somchai.j@example.com</p>
        </div>
        <Separator className="my-3" />
        <div className="grid w-full grid-cols-2 gap-4 text-left">
          <div>
            <p className="text-xs text-muted-foreground">ระดับสมาชิก</p>
            <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-primary">
              <Diamond className="fill-primary" /> Elite
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">คะแนนสะสม</p>
            <p className="mt-1 text-2xl font-semibold">2,450</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type StatusStepProps = {
  icon: typeof CreditCard;
  label: string;
  count?: string;
  active?: boolean;
};

function StatusStep({ icon: Icon, label, count, active }: StatusStepProps) {
  return (
    <div className="flex min-w-16 flex-col items-center gap-3 text-center">
      <div className={active ? "relative flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm" : "relative flex size-12 items-center justify-center rounded-full border-2 border-muted-foreground/40 text-muted-foreground"}>
        <Icon />
        {count && (
          <Badge variant={count === "0" ? "destructive" : "default"} className="absolute -right-2 -top-2 size-5 p-0">
            {count}
          </Badge>
        )}
      </div>
      <span className={active ? "text-xs font-medium" : "text-xs text-muted-foreground"}>{label}</span>
    </div>
  );
}

function StatusLine({ active = false }: { active?: boolean }) {
  return <div className={active ? "mt-6 h-1 bg-primary" : "mt-6 h-1 bg-muted"} />;
}

function OrderStatus() {
  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">สถานะการสั่งซื้อล่าสุด</CardTitle>
        <CardAction>
          <Button variant="link" render={<Link to="/account/orders" />}>
            ดูทั้งหมด <ArrowRight data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-52 items-center overflow-x-auto">
        <div className="grid min-w-[520px] w-full grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] items-start">
          <StatusStep icon={CreditCard} label="ที่ต้องชำระ" count="0" active />
          <StatusLine active />
          <StatusStep icon={Package} label="ที่ต้องจัดส่ง" count="1" active />
          <StatusLine />
          <StatusStep icon={Truck} label="กำลังจัดส่ง" />
          <StatusLine />
          <StatusStep icon={Check} label="สำเร็จ" />
        </div>
      </CardContent>
    </Card>
  );
}

function PrimaryAddress() {
  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold"><MapPin className="text-primary" /> ที่อยู่หลัก</CardTitle>
        <CardAction><Button variant="ghost" size="icon" aria-label="แก้ไขที่อยู่"><Pencil /></Button></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 leading-7">
        <Badge className="w-fit">บ้าน</Badge>
        <address className="not-italic">
          สมชาย ใจดี | (+66) 89-123-4567<br />
          123/45 ซอยสุขุมวิท 1 ถนนสุขุมวิท<br />
          แขวงคลองเตยนเหนือ เขตวัฒนา<br />
          กรุงเทพมหานคร 10110
        </address>
      </CardContent>
      <CardFooter>
        <Button className="w-full" render={<Link to="/account/addresses" />}><Plus data-icon="inline-start" /> เพิ่มที่อยู่ใหม่</Button>
      </CardFooter>
    </Card>
  );
}

export function ProfilePage() {
  return (
    <div className="bg-muted/60 px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountMenu />
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">โปรไฟล์ของฉัน</h1>
              <p className="mt-1 text-muted-foreground">จัดการข้อมูลส่วนตัว ประวัติการสั่งซื้อ และสิทธิพิเศษของคุณ</p>
            </div>
            <Button className="sm:self-start"><Pencil data-icon="inline-start" /> แก้ไขโปรไฟล์</Button>
          </div>
          <div className="grid gap-6 xl:grid-cols-[352px_1fr]">
            <ProfileSummary />
            <OrderStatus />
          </div>
          <PrimaryAddress />
        </div>
      </div>
    </div>
  );
}
