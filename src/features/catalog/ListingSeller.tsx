import { BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf } from "@/features/account/account.format";
import type { PublicListingDto } from "./catalog.types";
import { formatSellerReputation } from "./listing.format";

export function ListingSeller({ seller, productSlug }: { seller: PublicListingDto["seller"]; productSlug: string }) {
  const profileHref = `/u/${encodeURIComponent(seller.username)}?from=${encodeURIComponent(productSlug)}`;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link to={profileHref} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <Avatar size="default">
          {seller.avatarUrl && <AvatarImage src={seller.avatarUrl} alt="" />}
          <AvatarFallback>{initialsOf(seller.displayName || seller.username)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          {seller.verified && <BadgeCheck aria-label="ร้านค้ายืนยันแล้ว" className="size-4 shrink-0 fill-primary text-white" />}
          <Link
            to={profileHref}
            className="truncate text-sm font-bold hover:text-primary hover:underline"
          >
            {seller.displayName || seller.username}
          </Link>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{formatSellerReputation(seller)}</p>
      </div>
    </div>
  );
}
