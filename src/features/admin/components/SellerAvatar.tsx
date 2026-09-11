import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SellerAvatarAccent } from "@/features/admin/admin.types";
import { cn } from "@/lib/utils";

const AVATAR_ACCENT: Record<SellerAvatarAccent, string> = {
  teal: "bg-[#0d9488]",
  primary: "bg-[#0058bc]",
  amber: "bg-[#b45309]",
  red: "bg-[#d0342c]",
  slate: "bg-[#9aa5ad]",
};

type SellerAvatarProps = {
  initials: string;
  accent: SellerAvatarAccent;
  className?: string;
};

/**
 * วงกลมตัวย่อชื่อผู้สมัคร ใช้ทั้งในคิวทางซ้าย (38px) และการ์ดรายละเอียด (52px)
 * ดีไซน์ไม่มีเส้นขอบรอบวงกลม เลยปิดเส้นที่ ui/avatar ใส่มาให้เป็นค่าเริ่มต้น
 */
export function SellerAvatar({
  initials,
  accent,
  className,
}: SellerAvatarProps) {
  return (
    <Avatar className={cn("shrink-0 after:border-0", className)}>
      <AvatarFallback
        className={cn("text-sm text-white", AVATAR_ACCENT[accent])}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
