import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  FileText,
  Settings,
  LogOut,
  Zap,
  UserCircle,
  DollarSign,
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/superadmin" },
  { title: "Empresas", icon: Building2, path: "/superadmin/empresas" },
  { title: "Usuários", icon: Users, path: "/superadmin/usuarios" },
  { title: "Financeiro", icon: DollarSign, path: "/superadmin/financeiro" },
  { title: "Auditoria", icon: FileText, path: "/superadmin/auditoria" },
];

const systemItems = [
  { title: "Permissões", icon: Shield, path: "/superadmin/permissoes" },
  { title: "Configurações", icon: Settings, path: "/superadmin/configuracoes" },
  { title: "Meu Perfil", icon: UserCircle, path: "/superadmin/perfil" },
];

export function SuperAdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link to="/superadmin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive">
            <Zap className="h-4 w-4 text-destructive-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold font-['Space_Grotesk']">Menu</span>
            <span className="ml-1 text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">SUPER</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.path} tooltip={item.title}>
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.path} tooltip={item.title}>
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sair" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
