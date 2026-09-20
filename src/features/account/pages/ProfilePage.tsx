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
import { getErrorMessage } from "@/lib/api";

import { initialsOf, toSidebarUser } from "../account.format";
import { formatAddressLines } from "../address.format";
import { useAddresses } from "../address.queries";
import type { Address } from "../address.types";
import { AccountSidebar } from "../components/AccountSidebar";
import { EditProfileDialog } from "../components/EditProfileDialog";

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
      <CardContent className="flex min-h-52 items-center justify-center">
        <EmptyState
          icon={Package}
          title="No recent orders"
          description="Your latest order tracking will appear here once you make a purchase."
        />
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
            <MapPin className="text-primary" /> Primary Address
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-muted-foreground">
          <p className="text-sm font-medium text-destructive">
            Could not load your address
          </p>
          <p className="text-sm">
            {getErrorMessage(error, "Please check your connection and try again.")}
          </p>
        </CardContent>
        {onRetry && (
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={onRetry}
            >
              <RotateCw data-icon="inline-start" /> Try again
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
            <MapPin className="text-primary" /> Primary Address
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-muted-foreground">
          <p className="text-sm">
            No shipping address saved yet. Save a primary destination for faster checkout.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            render={<Link to="/account/addresses" />}
          >
            <Plus data-icon="inline-start" /> Add New Address
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
          <MapPin className="text-primary" /> Primary Address
        </CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit address"
            render={<Link to="/account/addresses" />}
          >
            <Pencil />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 leading-7">
        <Badge className="w-fit">
          {primary.label ?? (primary.defaultShipping ? "Default" : "Primary")}
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
          <Plus data-icon="inline-start" /> Manage Addresses
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
  const { user, isLoading } = useAuth();
  const addressesQuery = useAddresses();
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  return (
    <div className="bg-muted/60 px-4 py-10 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar user={toSidebarUser(user)} />

        {isLoading || !user ? (
          <ProfileSkeleton />
        ) : (
          <div className="flex min-w-0 flex-col gap-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold">My Profile</h1>
                <p className="mt-1 text-muted-foreground">
                  Manage your personal information, order history, and addresses.
                </p>
              </div>
              <Button
                className="sm:self-start"
                onClick={() => setIsEditingProfile(true)}
              >
                <Pencil data-icon="inline-start" /> Edit Profile
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
      </div>
    </div>
  );
}
