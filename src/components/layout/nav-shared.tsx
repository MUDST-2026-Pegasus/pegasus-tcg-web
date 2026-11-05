/* eslint-disable react-refresh/only-export-components -- shared navbar hook and avatar are intentionally colocated */
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast";
import { useAuth, useLogout } from "@/features/auth/auth.queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const guestLinks = [{ label: "Log in", to: "/login" }, { label: "Sign up", to: "/register" }];

export function useAccountLinks() {
  const auth = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const links = auth.isAuthenticated ? [
    { label: "My Account", to: "/account/profile" },
    { label: "My Collection", to: "/account/collection" },
    auth.hasRole("SELLER") ? { label: "Seller Dashboard", to: "/seller" } : { label: "Become a Seller", to: "/become-a-seller" },
    ...(auth.hasRole("ADMIN") ? [{ label: "Admin Dashboard", to: "/admin" }] : []),
  ] : guestLinks;
  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login", { replace: true });
    toast.add({ type: "success", title: "ออกจากระบบเรียบร้อยแล้ว" });
  };
  return { ...auth, links, handleLogout, logoutPending: logout.isPending };
}

export function AccountAvatar({ user, size = "default" }: { user: { displayName: string; avatarUrl: string | null }; size?: "default" | "lg" }) {
  const name = user.displayName || "Account";
  const initials = name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return <Avatar size={size} className="after:hidden"><AvatarImage src={user.avatarUrl ?? undefined} alt={name} /><AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback></Avatar>;
}
