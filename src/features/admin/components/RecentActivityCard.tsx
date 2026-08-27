import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  ActivityItem,
  ActivityStatus,
} from "@/features/admin/admin.types";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<ActivityStatus, string> = {
  pending: "bg-[#fdf0dd] text-[#b45309]",
  attention: "bg-[#fbe9e8] text-[#d0342c]",
  success: "bg-[#e3f4ec] text-[#12805c]",
};

const AVATAR_ACCENT: Record<ActivityItem["avatarAccent"], string> = {
  teal: "bg-[#0d9488]",
  red: "bg-[#d0342c]",
  primary: "bg-primary",
  green: "bg-[#12805c]",
};

type RecentActivityCardProps = {
  title: string;
  description: string;
  items: ActivityItem[];
  actionLabel: string;
};

export function RecentActivityCard({
  title,
  description,
  items,
  actionLabel,
}: RecentActivityCardProps) {
  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0 lg:w-[400px]">
      <div className="flex flex-col gap-0.5 px-[18px] pt-[18px] pb-3.5">
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <ul className="flex flex-col">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 border-t border-[#eef1f2] px-[18px] py-3 first:border-t-0"
          >
            <Avatar className="size-7 shrink-0">
              <AvatarFallback
                className={cn(
                  "text-sm text-white",
                  AVATAR_ACCENT[item.avatarAccent],
                )}
              >
                {item.initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-foreground">
                  {item.name}
                </p>
                <p className="text-[11px] text-[#9aa5ad]">{item.time}</p>
              </div>
              <p className="text-xs leading-[17px] text-[#414755]">
                {item.message}
              </p>
              <Badge
                className={cn(
                  "h-5 w-fit rounded-full px-2 text-[11px]",
                  STATUS_BADGE[item.status],
                )}
              >
                {item.statusLabel}
              </Badge>
            </div>
          </li>
        ))}
      </ul>

      <div className="px-[18px] pt-3 pb-4">
        <Button variant="ghost" className="rounded-md px-2.5">
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}
