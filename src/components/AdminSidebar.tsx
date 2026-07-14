import { LayoutDashboard, Package, TrendingUp, ArrowLeft, FolderOpen, Gift, Tag, BoxSelect, Megaphone, ShoppingCart, LogOut, Settings, MessageSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Catégories", url: "/admin/categories", icon: FolderOpen },
  { title: "Produits", url: "/admin/products", icon: Package },
  { title: "Packs", url: "/admin/packs", icon: Gift },
  { title: "Promotions", url: "/admin/promotions", icon: Tag },
  { title: "Commandes", url: "/admin/orders", icon: ShoppingCart },
  { title: "Avis Clients", url: "/admin/feedbacks", icon: MessageSquare },
  { title: "Paramètres", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs tracking-[0.15em] uppercase">
            {!collapsed && "Administration"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={() => setOpenMobile(false)}>
                    <Link
                      to={item.url}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                        location.pathname === item.url
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => setOpenMobile(false)}>
                  <a 
                    href={window.location.hostname.startsWith('admin.') ? "https://aliaacare.com" : "/"} 
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted/50 mt-4"
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Retour au site</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors w-full">
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Déconnexion</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
