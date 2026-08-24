import { NavLink } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavGroup } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

const DASHBOARD_BLUE_TEXT = "text-[#0058bc]";
const DASHBOARD_BLUE_BG = "bg-[#0058bc]";

const NAV_ACTIVE =
  "data-active:bg-[#e8f1fc] data-active:font-medium data-active:text-[#0058bc] data-active:hover:bg-[#e8f1fc] data-active:hover:text-[#0058bc]";
const NAV_HOVER = "hover:bg-[#eef1f2] hover:text-foreground";

type AppSidebarProps = {
  role: string;
  groups: NavGroup[];
};

export function AppSidebar({ role, groups }: AppSidebarProps) {
  const { isMobile } = useSidebar();

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className="h-auto self-stretch border-r border-sidebar-border"
    >
      <div className="sticky top-[var(--navbar-h,75px)] flex max-h-[calc(100svh-var(--navbar-h,75px))] flex-col">
        <SidebarHeader className="gap-0 border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-[17px] font-bold tracking-[-0.4px]",
                DASHBOARD_BLUE_TEXT,
              )}
            >
              DASHBOARD
            </span>
            <Badge
              className={cn(
                "h-5 rounded-[5px] px-2 text-[9px] font-medium text-white",
                DASHBOARD_BLUE_BG,
              )}
            >
              {role}
            </Badge>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {groups.map((group) => (
            <SidebarGroup key={group.label} className="gap-0.5 px-0 py-0">
              <SidebarGroupLabel className="h-auto px-2.5 pt-3 pb-1.5 text-[10px] font-semibold tracking-[0.6px] text-[#9aa5ad] uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map(({ label, to, icon: Icon, end }) => (
                    <SidebarMenuItem key={to}>
                      <NavLink to={to} end={end}>
                        {({ isActive }) => (
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={label}
                            render={<span />}
                            className={cn(
                              "h-auto gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-normal text-[#414755]",
                              NAV_HOVER,
                              NAV_ACTIVE,
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
      </div>
    </Sidebar>
  );
}
