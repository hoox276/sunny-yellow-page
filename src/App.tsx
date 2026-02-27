import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Cadastro from "./pages/auth/Cadastro";
import Dashboard from "./pages/admin/Dashboard";
import Cardapio from "./pages/admin/Cardapio";
import Pedidos from "./pages/admin/Pedidos";
import Clientes from "./pages/admin/Clientes";
import Entregas from "./pages/admin/Entregas";
import Impressao from "./pages/admin/Impressao";
import QRCodePage from "./pages/admin/QRCode";
import Configuracoes from "./pages/admin/Configuracoes";
import CardapioPublico from "./pages/public/CardapioPublico";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<Index />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="cardapio" element={<Cardapio />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="entregas" element={<Entregas />} />
            <Route path="impressao" element={<Impressao />} />
            <Route path="qrcode" element={<QRCodePage />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>

          {/* Cardápio público */}
          <Route element={<PublicLayout />}>
            <Route path="/menu/:slug" element={<CardapioPublico />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
