import { NavLink } from "react-router-dom";

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
} from "#components/ui/sidebar";
import type { NavGroup } from "#lib/nav-config";

type AppSidebarProps = {
  /** ป้ายใต้โลโก้ เช่น "ADMIN" หรือ "SELLER" */
  role: string;
  groups: NavGroup[];
};

export function AppSidebar({ role, groups }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-0 px-4 py-4">
        <span className="text-xl font-black tracking-[-1px] text-primary">
          PEGASUS
        </span>
        <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
          {role}
        </span>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ label, to, icon: Icon, end }) => (
                  <SidebarMenuItem key={to}>
                    <NavLink to={to} end={end}>
                      {({ isActive }) => (
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={label}
                          render={<span />}
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
    </Sidebar>
  );
}
