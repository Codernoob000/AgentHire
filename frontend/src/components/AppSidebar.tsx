import { LayoutDashboard, FileText, Users, Sparkles, LogIn, UserCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Post Project", url: "/post-project", icon: FileText },
  { title: "Freelancers", url: "/freelancers", icon: Users },
  { title: "AI Match", url: "/recommend", icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-5">
          {!collapsed && (
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Agent<span className="text-primary">Hire</span>
            </h1>
          )}
          {collapsed && <span className="text-primary font-bold text-lg">A</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">John Doe</span>
              <span className="text-xs text-muted-foreground truncate">john@agenthire.io</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/login"
                end
                className="hover:bg-sidebar-accent/50"
                activeClassName="bg-sidebar-accent text-primary font-medium"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {!collapsed && <span>Login</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
