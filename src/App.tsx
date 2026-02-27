import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminLayout } from "@/layouts/AdminLayout";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { PublicLayout } from "@/layouts/PublicLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Cadastro from "./pages/auth/Cadastro";
import RecuperarSenha from "./pages/auth/RecuperarSenha";
import ResetPassword from "./pages/auth/ResetPassword";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Cardapio from "./pages/admin/Cardapio";
import Pedidos from "./pages/admin/Pedidos";
import Clientes from "./pages/admin/Clientes";
import Entregas from "./pages/admin/Entregas";
import Caixa from "./pages/admin/Caixa";
import Promocoes from "./pages/admin/Promocoes";
import Configuracoes from "./pages/admin/Configuracoes";
import UsuariosLoja from "./pages/admin/UsuariosLoja";

// Super Admin pages
import SuperDashboard from "./pages/superadmin/SuperDashboard";
import Empresas from "./pages/superadmin/Empresas";
import Usuarios from "./pages/superadmin/Usuarios";
import FinanceiroSA from "./pages/superadmin/Financeiro";
import Auditoria from "./pages/superadmin/Auditoria";
import Permissoes from "./pages/superadmin/Permissoes";
import SuperConfiguracoes from "./pages/superadmin/SuperConfiguracoes";

// Shared
import Perfil from "./pages/shared/Perfil";

// Public
import CardapioPublico from "./pages/public/CardapioPublico";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Index />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin da Loja */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="cardapio" element={<Cardapio />} />
              <Route path="pedidos" element={<Pedidos />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="entregas" element={<Entregas />} />
              <Route path="caixa" element={<Caixa />} />
              <Route path="promocoes" element={<Promocoes />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="usuarios" element={<UsuariosLoja />} />
              <Route path="perfil" element={<Perfil />} />
            </Route>

            {/* Super Admin */}
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<SuperDashboard />} />
              <Route path="empresas" element={<Empresas />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="financeiro" element={<FinanceiroSA />} />
              <Route path="auditoria" element={<Auditoria />} />
              <Route path="permissoes" element={<Permissoes />} />
              <Route path="configuracoes" element={<SuperConfiguracoes />} />
              <Route path="perfil" element={<Perfil />} />
            </Route>

            {/* Cardápio público */}
            <Route element={<PublicLayout />}>
              <Route path="/menu/:slug" element={<CardapioPublico />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
