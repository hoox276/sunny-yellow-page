import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export function SuperAdminHeader() {
  const { profile } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <Badge variant="destructive" className="text-[10px]">SUPER ADMIN</Badge>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {profile?.full_name || "Super Admin"}
        </span>
        <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-xs font-semibold text-destructive">
            {(profile?.full_name || "S").charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
