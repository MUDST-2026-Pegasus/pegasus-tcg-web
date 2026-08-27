import {
  ArrowRight, BadgeCheck, Check, CreditCard, Diamond, MapPin, Package, Pencil,
  Plus, Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AccountSidebar } from "@/features/account/components/AccountSidebar";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function ProfileAvatar() {
  return (
    <Avatar className="size-28">
      <AvatarFallback className="text-3xl">SJ</AvatarFallback>
      <AvatarBadge className="size-6"><BadgeCheck /></AvatarBadge>
    </Avatar>
  );
}

function ProfileSummary() {
  return (
    <Card className="rounded-xl shadow-none">
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <ProfileAvatar />
        <div>
          <h2 className="text-2xl font-semibold">Somchai Jaidee</h2>
          <p className="text-muted-foreground">somchai.j@example.com</p>
        </div>
        <Separator className="my-3" />
        <div className="grid w-full grid-cols-2 gap-4 text-left">
          <div>
            <p className="text-xs text-muted-foreground">Membership Tier</p>
            <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-primary">
              <Diamond className="fill-primary" /> Elite
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Reward Points</p>
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
        <CardTitle className="text-xl font-semibold">Latest Order Status</CardTitle>
        <CardAction>
          <Button variant="link" render={<Link to="/account/orders" />}>
            View All <ArrowRight data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-52 items-center overflow-x-auto">
        <div className="grid min-w-[520px] w-full grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] items-start">
          <StatusStep icon={CreditCard} label="Awaiting Payment" count="0" active />
          <StatusLine active />
          <StatusStep icon={Package} label="To Ship" count="1" active />
          <StatusLine />
          <StatusStep icon={Truck} label="In Transit" />
          <StatusLine />
          <StatusStep icon={Check} label="Completed" />
        </div>
      </CardContent>
    </Card>
  );
}

function PrimaryAddress() {
  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold"><MapPin className="text-primary" /> Primary Address</CardTitle>
        <CardAction><Button variant="ghost" size="icon" aria-label="Edit address"><Pencil /></Button></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 leading-7">
        <Badge className="w-fit">Home</Badge>
        <address className="not-italic">
          Somchai Jaidee | (+66) 89-123-4567<br />
          123/45 Sukhumvit Soi 1, Sukhumvit Road<br />
          Khlong Toei Nuea, Watthana<br />
          Bangkok 10110
        </address>
      </CardContent>
      <CardFooter>
        <Button className="w-full" render={<Link to="/account/addresses" />}><Plus data-icon="inline-start" /> Add New Address</Button>
      </CardFooter>
    </Card>
  );
}

export function ProfilePage() {
  return (
    <div className="bg-muted/60 px-4 py-10 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar />
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">My Profile</h1>
              <p className="mt-1 text-muted-foreground">Manage your personal information, order history, and benefits.</p>
            </div>
            <Button className="sm:self-start"><Pencil data-icon="inline-start" /> Edit Profile</Button>
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
