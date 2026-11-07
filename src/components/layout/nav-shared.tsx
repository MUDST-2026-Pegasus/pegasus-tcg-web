/* eslint-disable react-refresh/only-export-components -- shared navbar hook and avatar are intentionally colocated */
import { useLanguage } from "@/lib/language";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast";
import { useAuth, useLogout } from "@/features/auth/auth.queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const guestLinks = [
  { label: "Log in", to: "/login" },
  { label: "Sign up", to: "/register" },
];

export function useAccountLinks() {
  const { text } = useLanguage();
  const auth = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const sellerLink = auth.hasRole("SELLER")
    ? { label: text("แดชบอร์ดผู้ขาย", "Seller Dashboard"), to: "/seller" }
    : { label: text("สมัครเป็นผู้ขาย", "Become a Seller"), to: "/become-a-seller" };
  const links = auth.isAuthenticated
    ? [
        { label: text("บัญชีของฉัน", "My Account"), to: "/account/profile" },
        { label: text("คอลเลกชันของฉัน", "My Collection"), to: "/account/collection" },
        sellerLink,
        ...(auth.hasRole("ADMIN")
          ? [{ label: text("แดชบอร์ดผู้ดูแล", "Admin Dashboard"), to: "/admin" }]
          : []),
      ]
    : guestLinks.map((link) => ({ ...link, label: link.to === "/login" ? text("เข้าสู่ระบบ", "Log in") : text("สมัครสมาชิก", "Sign up") }));
  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login", { replace: true });
    toast.add({ type: "success", title: text("ออกจากระบบเรียบร้อยแล้ว", "You have been logged out") });
  };
  return {
    ...auth,
    sellerLink,
    links,
    handleLogout,
    logoutPending: logout.isPending,
  };
}

export function AccountAvatar({
  user,
  size = "default",
}: {
  user: { displayName: string; avatarUrl: string | null };
  size?: "default" | "lg";
}) {
  const name = user.displayName || "Account";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Avatar size={size} className="after:hidden">
      <AvatarImage src={user.avatarUrl ?? undefined} alt={name} />
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
