import { NavLink } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import type { SellerProfile } from "@/features/seller/seller.types";
import { sellerNav } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

const NAV_ACTIVE =
  "data-active:bg-[#e6f4f2] data-active:font-medium data-active:text-teal-600 data-active:hover:bg-[#e6f4f2] data-active:hover:text-teal-600";
const NAV_HOVER = "hover:bg-gray-100 hover:text-gray-700";
const NAV_DANGER =
  "text-red-600 hover:bg-red-50 hover:text-red-600 data-active:bg-red-50 data-active:text-red-600 data-active:hover:bg-red-50 data-active:hover:text-red-600";

type SellerSidebarProps = {
  profile: SellerProfile;
};

/**
 * Sidebar เฉพาะฝั่งผู้ขาย — ดีไซน์/ขนาดตัวอักษรลอกจาก Figma node 432:6773
 * แยกจาก AppSidebar ของ admin ตรง ๆ เพื่อให้ปรับหน้าตาได้อิสระโดยไม่ต้องกังวลเรื่องผลกระทบข้ามฝั่ง
 */
export function SellerSidebar({ profile }: SellerSidebarProps) {
  const { isMobile } = useSidebar();

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className="h-auto self-stretch border-r border-zinc-200 bg-neutral-50"
    >
      <div className="sticky top-[var(--navbar-h,75px)] flex h-full max-h-[calc(100svh-var(--navbar-h,75px))] flex-col px-3 py-4">
        <SidebarHeader className="gap-0 px-0.5 pt-1 pb-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-bold text-sky-700">
              DASHBOARD
            </span>
            <Badge className="h-5 rounded-[5px] bg-teal-600 px-2 py-0.5 text-[9px] leading-4 font-medium text-white">
              SELLER
            </Badge>
          </div>
        </SidebarHeader>

        <SidebarSeparator className="mx-0 bg-zinc-200" />

        <SidebarContent>
          {sellerNav.map((group) => (
            <SidebarGroup key={group.label} className="gap-0.5 px-0 py-0">
              <SidebarGroupLabel className="h-auto px-2.5 pt-3 pb-1.5 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map(({ label, to, icon: Icon, end, tone }) => (
                    <SidebarMenuItem key={to}>
                      <NavLink to={to} end={end}>
                        {({ isActive }) => (
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={label}
                            render={<span />}
                            className={cn(
                              "h-auto gap-2.5 rounded-lg px-2.5 py-2 text-xs font-normal text-gray-700 [&_svg]:size-6",
                              tone === "danger"
                                ? NAV_DANGER
                                : [NAV_HOVER, NAV_ACTIVE],
                            )}
                          >
                            <Icon />
                            <span>{label}</span>
                          </SidebarMenuButton>
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="gap-0 p-0">
          <SidebarSeparator className="mx-0 mb-3 bg-zinc-200" />
          <div className="flex items-center gap-2.5 px-0.5 pt-0.5 pb-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-teal-600 text-sm font-normal text-white">
                {profile.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-950">
                {profile.username}
              </span>
              <span className="text-xs font-normal text-gray-500">
                {profile.verifiedLabel}
              </span>
            </div>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
