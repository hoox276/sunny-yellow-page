import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ShoppingBag, TrendingUp } from "lucide-react";

const stats = [
  { title: "Empresas ativas", value: "0", icon: Building2 },
  { title: "Usuários totais", value: "0", icon: Users },
  { title: "Pedidos (30d)", value: "0", icon: ShoppingBag },
  { title: "MRR", value: "R$ 0,00", icon: TrendingUp },
];

export default function SuperDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard da Plataforma</h1>
        <p className="text-muted-foreground">Visão geral do SaaS</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
