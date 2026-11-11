import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  Package,
  Pencil,
  Plus,
  RotateCw,
} from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/common";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth.queries";
import type { AuthUser } from "@/features/auth/auth.types";

import { initialsOf } from "../account.format";
import { formatAddressLines } from "../address.format";
import { useAddresses } from "../address.queries";
import type { Address } from "../address.types";
import { formatOrderDateTime, orderStage } from "../order-stage";
import { useBuyerOrders } from "../orders.queries";
import { EditProfileDialog } from "../components/EditProfileDialog";
import { translateError, useTranslate } from "@/lib/i18n";
import { checkoutMoney } from "@/features/cart/checkout.format";

function ProfileAvatar({
  initials,
  avatarUrl,
  name,
}: {
  initials: string;
  avatarUrl?: string | null;
  name: string;
}) {
  return (
    <Avatar className="size-28">
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
      <AvatarBadge className="size-6">
        <BadgeCheck />
      </AvatarBadge>
    </Avatar>
  );
}

function ProfileSummary({ user }: { user: AuthUser }) {
  const initials = initialsOf(user.displayName);

  return (
    <Card className="rounded-xl shadow-none">
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <ProfileAvatar
          initials={initials}
          avatarUrl={user.avatarUrl}
          name={user.displayName}
        />
        <div className="w-full">
          <h2 className="truncate text-2xl font-semibold">{user.displayName}</h2>
          <p className="truncate text-muted-foreground">{user.email}</p>
          {user.phone && (
            <p className="mt-1 text-xs text-muted-foreground">{user.phone}</p>
          )}
          {user.bio && (
            <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OrderStatus() {
  const { t } = useTranslate("buyer");
  const orders = useBuyerOrders(0, 1);
  const latestOrder = orders.data?.[0];
  const stage = latestOrder ? orderStage(latestOrder) : null;

  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{t("account.profile.latestOrder", "สถานะคำสั่งซื้อล่าสุด")}</CardTitle>
        <CardAction>
          <Button variant="link" nativeButton={false} render={<Link to="/account/orders" />}>
            {t("account.profile.viewAll", "ดูทั้งหมด")} <ArrowRight data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="min-h-52">
        {orders.isLoading ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-4 w-52 rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : orders.isError ? (
          <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{t("account.profile.latestFailed", "โหลดคำสั่งซื้อล่าสุดไม่สำเร็จ")}</p>
            <Button variant="outline" onClick={() => void orders.refetch()}>
              <RotateCw data-icon="inline-start" /> {t("account.profile.tryAgain", "ลองอีกครั้ง")}
            </Button>
          </div>
        ) : latestOrder && stage ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{t("account.details.orderNumber", "คำสั่งซื้อ #{number}", { number: latestOrder.orderNumber })}</p>
                <p className="text-sm text-muted-foreground">
                  {formatOrderDateTime(latestOrder.placedAt)}
                </p>
              </div>
              <Badge className={stage.badgeClassName}>{stage.label}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <span className="text-sm text-muted-foreground">{t("account.profile.orderTotal", "ยอดคำสั่งซื้อ")}</span>
              <span className="font-semibold">{checkoutMoney(latestOrder.grandTotal)}</span>
            </div>
            <Button variant="outline" nativeButton={false} className="w-full" render={<Link to={`/account/orders?orderId=${latestOrder.id}`} />}>
              {t("account.profile.viewOrder", "ดูรายละเอียดคำสั่งซื้อ")} <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        ) : (
          <div className="flex min-h-52 items-center justify-center">
            <EmptyState
              icon={Package}
              title={t("account.profile.noOrders", "ยังไม่มีคำสั่งซื้อล่าสุด")}
              description={t("account.profile.noOrdersHint", "การติดตามคำสั่งซื้อล่าสุดจะแสดงที่นี่หลังคุณสั่งซื้อ")}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type PrimaryAddressCardProps = {
  addresses?: Address[];
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
};

function PrimaryAddressCard({
  addresses,
  isLoading,
  isError,
  error,
  onRetry,
}: PrimaryAddressCardProps) {
  const { t } = useTranslate("buyer");
  // 1. Loading state
  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-none" aria-busy="true">
        <CardHeader>
          <Skeleton className="h-6 w-44 rounded-md" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-4 w-60 rounded-md" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-full rounded-md" />
        </CardFooter>
      </Card>
    );
  }

  // 2. Error state
  if (isError) {
    return (
      <Card className="rounded-xl shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <MapPin className="text-primary" /> {t("account.profile.primaryAddress", "ที่อยู่หลัก")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-muted-foreground">
          <p className="text-sm font-medium text-destructive">
            {t("account.profile.addressFailed", "โหลดที่อยู่ไม่สำเร็จ")}
          </p>
          <p className="text-sm">
            {translateError(error, t("account.profile.connectionHint", "กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"))}
          </p>
        </CardContent>
        {onRetry && (
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={onRetry}
            >
              <RotateCw data-icon="inline-start" /> {t("account.profile.tryAgain", "ลองอีกครั้ง")}
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  const primary =
    addresses?.find((a) => a.defaultShipping) ?? addresses?.[0] ?? null;

  // 3. Empty state
  if (!primary) {
    return (
      <Card className="rounded-xl shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <MapPin className="text-primary" /> {t("account.profile.primaryAddress", "ที่อยู่หลัก")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-muted-foreground">
          <p className="text-sm">
            {t("account.profile.noAddress", "ยังไม่มีที่อยู่จัดส่ง บันทึกที่อยู่หลักไว้เพื่อชำระเงินได้เร็วขึ้น")}
          </p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            render={<Link to="/account/addresses" />}
          >
            <Plus data-icon="inline-start" /> {t("account.address.addNew", "เพิ่มที่อยู่ใหม่")}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // 4. Data state
  const lines = formatAddressLines(primary);

  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <MapPin className="text-primary" /> {t("account.profile.primaryAddress", "ที่อยู่หลัก")}
        </CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("account.profile.editAddress", "แก้ไขที่อยู่")}
            render={<Link to="/account/addresses" />}
          >
            <Pencil />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 leading-7">
        <Badge className="w-fit">
          {primary.label ?? (primary.defaultShipping ? t("account.profile.default", "ค่าเริ่มต้น") : t("account.profile.primary", "หลัก"))}
        </Badge>
        <address className="not-italic">
          {primary.recipientName} | {primary.phone}
          <br />
          {lines.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </address>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          render={<Link to="/account/addresses" />}
        >
          <Plus data-icon="inline-start" /> {t("account.profile.manageAddresses", "จัดการที่อยู่")}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-8" aria-busy="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-9 w-48 rounded-md" />
          <Skeleton className="mt-2 h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md sm:self-start" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[352px_1fr]">
        <Card className="rounded-xl p-6 shadow-none">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="size-28 rounded-full" />
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-4 w-52 rounded-md" />
          </div>
        </Card>
        <Card className="rounded-xl p-6 shadow-none">
          <Skeleton className="h-6 w-48 rounded-md" />
          <div className="mt-12 flex items-center justify-center">
            <Skeleton className="h-20 w-64 rounded-md" />
          </div>
        </Card>
      </div>
      <Card className="rounded-xl p-6 shadow-none">
        <Skeleton className="h-6 w-44 rounded-md" />
        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-4 w-64 rounded-md" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
      </Card>
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslate("buyer");
  const { user, isLoading } = useAuth();
  const addressesQuery = useAddresses();
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  return (
    <>

        {isLoading || !user ? (
          <ProfileSkeleton />
        ) : (
          <div className="flex min-w-0 flex-col gap-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold">{t("account.profile.title", "โปรไฟล์ของฉัน")}</h1>
                <p className="mt-1 text-muted-foreground">
                  {t("account.profile.subtitle", "จัดการข้อมูลส่วนตัว ประวัติคำสั่งซื้อ และที่อยู่")}
                </p>
              </div>
              <Button
                className="sm:self-start"
                onClick={() => setIsEditingProfile(true)}
              >
                <Pencil data-icon="inline-start" /> {t("account.profile.edit.title", "แก้ไขโปรไฟล์")}
              </Button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[352px_1fr]">
              <ProfileSummary user={user} />
              <OrderStatus />
            </div>

            <PrimaryAddressCard
              addresses={addressesQuery.data}
              isLoading={addressesQuery.isLoading}
              isError={addressesQuery.isError}
              error={addressesQuery.error}
              onRetry={() => addressesQuery.refetch()}
            />

            <EditProfileDialog
              open={isEditingProfile}
              onOpenChange={setIsEditingProfile}
              user={user}
            />
          </div>
        )}
    </>
  );
}
