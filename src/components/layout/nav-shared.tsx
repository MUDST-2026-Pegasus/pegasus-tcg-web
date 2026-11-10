/* eslint-disable react-refresh/only-export-components -- shared navbar hook and avatar are intentionally colocated */
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast";
import { useAuth, useLogout } from "@/features/auth/auth.queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslate } from "@/lib/i18n";


export function useAccountLinks() {
  const { t } = useTranslate();
  const auth = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const sellerLink = auth.hasRole("SELLER")
    ? { label: t("account.sellerDashboard", "Seller Dashboard"), to: "/seller" }
    : { label: t("account.becomeSeller", "Become a Seller"), to: "/become-a-seller" };
  const links = auth.isAuthenticated
    ? [
        { label: t("account.myAccount", "My Account"), to: "/account/profile" },
        { label: t("account.myCollection", "My Collection"), to: "/account/collection" },
        sellerLink,
        ...(auth.hasRole("ADMIN")
          ? [{ label: t("account.adminDashboard", "Admin Dashboard"), to: "/admin" }]
          : []),
      ]
    : [
        { label: t("nav.login", "Log in"), to: "/login" },
        { label: t("nav.signup", "Sign up"), to: "/register" },
      ];
  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login", { replace: true });
    toast.add({ type: "success", title: t("account.loggedOut", "ออกจากระบบเรียบร้อยแล้ว") });
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
