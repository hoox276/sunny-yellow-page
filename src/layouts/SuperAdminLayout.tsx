import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/superadmin/SuperAdminSidebar";
import { SuperAdminHeader } from "@/components/superadmin/SuperAdminHeader";
import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export function SuperAdminLayout() {
  return (
    <ProtectedRoute requireSuperAdmin>
      <SidebarProvider>
        <SuperAdminSidebar />
        <SidebarInset>
          <SuperAdminHeader />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
