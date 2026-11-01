import { cn } from "@/lib/utils";

import type { Game } from "../catalog.types";
import { gameInitials } from "../taxonomy.format";

type GameAvatarProps = {
  game: Pick<Game, "name" | "code" | "logoImageUrl">;
  /** `sm` ในรายการเกม (28px), `lg` ในการ์ดข้อมูลเกม (56px) */
  size: "sm" | "lg";
  highlighted?: boolean;
};

/** โลโก้เกมถ้ามี ไม่งั้นเป็นตัวย่อชื่อเกมบนพื้นสี */
export function GameAvatar({ game, size, highlighted }: GameAvatarProps) {
  const logo = game.logoImageUrl;
  const initials = gameInitials(game);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden font-semibold",
        size === "sm"
          ? "size-7 rounded-md text-[10px]"
          : "size-14 rounded-[10px] text-lg",
        size === "sm" && initials.length > 2 && "text-[8px]",
        logo
          ? "bg-card ring-1 ring-border"
          : highlighted
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-[#414755]",
      )}
    >
      {logo ? (
        <img src={logo} alt="" className="size-full object-contain" />
      ) : (
        initials
      )}
    </span>
  );
}
