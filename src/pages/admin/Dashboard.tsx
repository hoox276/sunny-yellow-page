import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, DollarSign, Clock, TrendingUp, AlertTriangle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OperationalAlert {
  type: "warning" | "error";
  title: string;
  description: string;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ todayOrders: 0, inProgress: 0, revenue: 0, avgTicket: 0 });
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.company_id) return;
    const companyId = profile.company_id;

    const load = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [ordersRes, inProgressRes, categoriesRes, neighborhoodsRes, productsRes] = await Promise.all([
        supabase.from("orders").select("id, total, customer_name, status, created_at").eq("company_id", companyId).gte("created_at", todayISO).order("created_at", { ascending: false }),
        supabase.from("orders").select("id").eq("company_id", companyId).in("status", ["novo", "em_preparo", "pronto", "saiu_entrega"]),
        supabase.from("categories").select("id").eq("company_id", companyId).eq("is_active", true),
        supabase.from("neighborhoods").select("id").eq("company_id", companyId).eq("is_active", true),
        supabase.from("products").select("id").eq("company_id", companyId).eq("is_active", true),
      ]);

      const orders = ordersRes.data ?? [];
      const completedToday = orders.filter((o) => o.status === "concluido");
      const revenue = completedToday.reduce((s, o) => s + Number(o.total), 0);

      setStats({
        todayOrders: orders.length,
        inProgress: inProgressRes.data?.length ?? 0,
        revenue,
        avgTicket: completedToday.length > 0 ? revenue / completedToday.length : 0,
      });

      setRecentOrders(orders.slice(0, 5));

      // Operational alerts
      const newAlerts: OperationalAlert[] = [];
      if ((productsRes.data?.length ?? 0) === 0) {
        newAlerts.push({ type: "error", title: "Cardápio vazio", description: "Nenhum produto ativo. Adicione produtos para receber pedidos." });
      }
      if ((categoriesRes.data?.length ?? 0) === 0) {
        newAlerts.push({ type: "warning", title: "Sem categorias", description: "Crie pelo menos uma categoria para organizar o cardápio." });
      }
      if ((neighborhoodsRes.data?.length ?? 0) === 0) {
        newAlerts.push({ type: "warning", title: "Taxas de entrega não configuradas", description: "Configure bairros e taxas em Entregas para aceitar pedidos de entrega." });
      }
      setAlerts(newAlerts);
    };
    load();
  }, [profile?.company_id]);

  const statCards = [
    { title: "Pedidos hoje", value: String(stats.todayOrders), icon: ShoppingBag },
    { title: "Em andamento", value: String(stats.inProgress), icon: Clock },
    { title: "Faturamento", value: `R$ ${stats.revenue.toFixed(2).replace(".", ",")}`, icon: DollarSign },
    { title: "Ticket médio", value: `R$ ${stats.avgTicket.toFixed(2).replace(".", ",")}`, icon: TrendingUp },
  ];

  const statusLabel: Record<string, string> = { novo: "Novo", em_preparo: "Preparo", pronto: "Pronto", saiu_entrega: "Saiu", concluido: "Concluído", cancelado: "Cancelado" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {/* Operational Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <Alert key={i} variant={alert.type === "error" ? "destructive" : "default"} className={alert.type === "warning" ? "border-warning bg-warning/5" : ""}>
              {alert.type === "error" ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4 text-warning" />}
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Últimos pedidos</CardTitle></CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum pedido hoje. Compartilhe o link do cardápio!</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">R$ {Number(order.total).toFixed(2).replace(".", ",")}</span>
                    <Badge variant="secondary">{statusLabel[order.status] ?? order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
