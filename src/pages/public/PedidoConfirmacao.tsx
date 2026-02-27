import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ArrowLeft } from "lucide-react";

const statusLabels: Record<string, { label: string; color: string }> = {
  novo: { label: "Recebido", color: "bg-primary" },
  em_preparo: { label: "Em Preparo", color: "bg-warning" },
  pronto: { label: "Pronto", color: "bg-success" },
  saiu_entrega: { label: "Saiu para Entrega", color: "bg-blue-500" },
  concluido: { label: "Concluído", color: "bg-muted" },
  cancelado: { label: "Cancelado", color: "bg-destructive" },
};

export default function PedidoConfirmacao() {
  const { slug, orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("id", orderId ?? "").single();
      if (o) {
        setOrder(o);
        const { data: oi } = await supabase.from("order_items").select("*").eq("order_id", o.id);
        setItems(oi ?? []);
      }
      setLoading(false);
    };
    load();

    // Realtime order status
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (payload) => {
        setOrder(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!order) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Pedido não encontrado.</p></div>;

  const status = statusLabels[order.status] ?? { label: order.status, color: "bg-muted" };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-6 text-center">
        <CheckCircle className="h-12 w-12 mx-auto mb-2" />
        <h1 className="text-xl font-bold font-['Space_Grotesk']">Pedido Confirmado!</h1>
        <p className="text-sm opacity-80 mt-1">Pedido #{order.order_number}</p>
      </header>

      <main className="mx-auto max-w-lg px-4 mt-4 space-y-4 pb-8">
        {/* Status */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <Badge className={`${status.color} text-primary-foreground`}>{status.label}</Badge>
          </CardContent>
        </Card>

        {order.estimated_minutes && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Previsão</p>
              <p className="text-lg font-bold">{order.estimated_minutes} minutos</p>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Itens do pedido</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.product_name}</span>
                <span className="font-medium">R$ {Number(item.total).toFixed(2).replace(".", ",")}</span>
              </div>
            ))}
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {Number(order.subtotal).toFixed(2).replace(".", ",")}</span></div>
              {Number(order.delivery_fee) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Entrega</span><span>R$ {Number(order.delivery_fee).toFixed(2).replace(".", ",")}</span></div>}
              {Number(order.discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="text-success">-R$ {Number(order.discount).toFixed(2).replace(".", ",")}</span></div>}
              <div className="flex justify-between font-bold"><span>Total</span><span>R$ {Number(order.total).toFixed(2).replace(".", ",")}</span></div>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full" asChild>
          <Link to={`/menu/${slug}`}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao cardápio</Link>
        </Button>
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Powered by MenuRápido
      </footer>
    </div>
  );
}
