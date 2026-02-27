import { ShoppingBag, DollarSign, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { title: "Pedidos hoje", value: "0", icon: ShoppingBag, change: "+0%" },
  { title: "Faturamento", value: "R$ 0,00", icon: DollarSign, change: "+0%" },
  { title: "Clientes", value: "0", icon: Users, change: "+0%" },
  { title: "Ticket médio", value: "R$ 0,00", icon: TrendingUp, change: "+0%" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change} vs ontem</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Nenhum pedido ainda. Compartilhe o link do cardápio para começar!</p>
        </CardContent>
      </Card>
    </div>
  );
}
