import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KanbanBoard, KanbanColumn } from "@/components/shared/KanbanBoard";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Printer, Bell } from "lucide-react";

type OrderStatus = "novo" | "em_preparo" | "pronto" | "saiu_entrega" | "concluido" | "cancelado";

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_whatsapp: string;
  type: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: string;
  change_for: number | null;
  address: string | null;
  estimated_minutes: number | null;
  cancel_reason: string | null;
  notes: string | null;
  created_at: string;
  driver_id: string | null;
  delivered_at: string | null;
}

interface Driver { id: string; name: string; phone: string | null; is_active: boolean }

interface OrderItem { id: string; product_name: string; quantity: number; unit_price: number; total: number; variations: any; addons: any; notes: string | null }

const statusConfig: { id: OrderStatus; label: string; color: string }[] = [
  { id: "novo", label: "Novo", color: "hsl(16 85% 55%)" },
  { id: "em_preparo", label: "Em Preparo", color: "hsl(38 92% 50%)" },
  { id: "pronto", label: "Pronto", color: "hsl(142 71% 45%)" },
  { id: "saiu_entrega", label: "Saiu p/ Entrega", color: "hsl(220 70% 55%)" },
  { id: "concluido", label: "Concluído", color: "hsl(220 9% 46%)" },
  { id: "cancelado", label: "Cancelado", color: "hsl(0 72% 51%)" },
];

const paymentLabels: Record<string, string> = { pix: "Pix", dinheiro: "Dinheiro", cartao_entrega: "Cartão na entrega" };
const typeLabels: Record<string, string> = { entrega: "Entrega", retirada: "Retirada", local: "No local" };

export default function Pedidos() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [estimatedMin, setEstimatedMin] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCountRef = useRef(0);

  const companyId = profile?.company_id;

  const fetchOrders = useCallback(async () => {
    if (!companyId) return;
    const [{ data }, { data: drvs }] = await Promise.all([
      supabase.from("orders").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
      supabase.from("drivers").select("*").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);
    const newOrders = (data ?? []) as Order[];
    
    // Alert for new orders
    const newCount = newOrders.filter((o) => o.status === "novo").length;
    if (newCount > prevCountRef.current && prevCountRef.current > 0) {
      toast({ title: "🔔 Novo pedido!", description: "Um novo pedido foi recebido." });
    }
    prevCountRef.current = newCount;
    
    setOrders(newOrders);
    setDrivers((drvs ?? []) as Driver[]);
    setLoading(false);
  }, [companyId, toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Realtime
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `company_id=eq.${companyId}` }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, fetchOrders]);

  const loadOrderItems = async (orderId: string) => {
    const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    setOrderItems((data ?? []) as OrderItem[]);
  };

  const handleSelectOrder = (order: Order) => {
    setSelected(order);
    loadOrderItems(order.id);
  };

  const updateStatus = async (orderId: string, fromStatus: OrderStatus, toStatus: OrderStatus) => {
    const updatePayload: any = { status: toStatus };
    if (toStatus === "em_preparo" && estimatedMin) updatePayload.estimated_minutes = Number(estimatedMin);
    if (toStatus === "saiu_entrega" && selectedDriverId) {
      updatePayload.driver_id = selectedDriverId;
    }
    if (toStatus === "concluido" && fromStatus === "saiu_entrega") {
      updatePayload.delivered_at = new Date().toISOString();
    }
    await supabase.from("orders").update(updatePayload).eq("id", orderId);
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: user?.id,
    });
    toast({ title: `Pedido movido para ${statusConfig.find((s) => s.id === toStatus)?.label}` });
    if (selected?.id === orderId) setSelected((prev) => prev ? { ...prev, status: toStatus, driver_id: selectedDriverId || prev.driver_id } : null);
    setEstimatedMin("");
    setSelectedDriverId("");
  };

  const handleCancel = async () => {
    if (!selected || !cancelReason.trim()) return;
    await supabase.from("orders").update({ status: "cancelado" as const, cancel_reason: cancelReason }).eq("id", selected.id);
    await supabase.from("order_status_history").insert({
      order_id: selected.id,
      from_status: selected.status,
      to_status: "cancelado" as const,
      changed_by: user?.id,
      notes: cancelReason,
    });
    // Audit log
    await supabase.from("audit_logs").insert({
      user_id: user?.id,
      company_id: companyId,
      action: "cancel_order",
      resource: "orders",
      resource_id: selected.id,
      new_value: { cancel_reason: cancelReason },
    });
    setShowCancel(false);
    setCancelReason("");
    setSelected(null);
    toast({ title: "Pedido cancelado" });
  };

  const handlePrint = () => {
    if (!selected) return;
    const printWin = window.open("", "_blank", "width=400,height=600");
    if (!printWin) return;
    printWin.document.write(`
      <html><head><title>Comanda #${selected.order_number}</title>
      <style>body{font-family:monospace;font-size:12px;padding:10px;max-width:300px;margin:0 auto}
      .sep{border-top:1px dashed #000;margin:8px 0}h2{margin:0;text-align:center}
      .row{display:flex;justify-content:space-between}.bold{font-weight:bold}</style></head><body>
      <h2>PEDIDO #${selected.order_number}</h2>
      <div class="sep"></div>
      <p><strong>${selected.customer_name}</strong><br>${selected.customer_whatsapp}</p>
      <p>${typeLabels[selected.type]}${selected.address ? ` - ${selected.address}` : ""}</p>
      <div class="sep"></div>
      ${orderItems.map((i) => `<div class="row"><span>${i.quantity}x ${i.product_name}</span><span>R$ ${Number(i.total).toFixed(2)}</span></div>${i.notes ? `<p style="font-size:10px;color:#666">Obs: ${i.notes}</p>` : ""}`).join("")}
      <div class="sep"></div>
      <div class="row"><span>Subtotal</span><span>R$ ${Number(selected.subtotal).toFixed(2)}</span></div>
      ${Number(selected.delivery_fee) > 0 ? `<div class="row"><span>Entrega</span><span>R$ ${Number(selected.delivery_fee).toFixed(2)}</span></div>` : ""}
      <div class="row bold"><span>TOTAL</span><span>R$ ${Number(selected.total).toFixed(2)}</span></div>
      <div class="sep"></div>
      <p>Pagamento: ${paymentLabels[selected.payment_method] ?? selected.payment_method}${selected.change_for ? ` (Troco p/ R$ ${Number(selected.change_for).toFixed(2)})` : ""}</p>
      <p style="text-align:center;font-size:10px;margin-top:16px">MenuRápido</p>
      </body></html>
    `);
    printWin.document.close();
    printWin.print();
  };

  const columns: KanbanColumn<Order>[] = statusConfig.map((s) => ({
    id: s.id,
    label: s.label,
    color: s.color,
    items: orders.filter((o) => o.status === s.id),
  }));

  const nextStatus: Record<string, OrderStatus> = {
    novo: "em_preparo",
    em_preparo: "pronto",
    pronto: "saiu_entrega",
    saiu_entrega: "concluido",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Acompanhe e gerencie pedidos em tempo real</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="mr-1 h-4 w-4" />Atualizar</Button>
      </div>

      <KanbanBoard
        columns={columns}
        onCardClick={(item) => handleSelectOrder(item as Order)}
        renderCard={(order: Order) => (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">#{order.order_number}</span>
              <Badge variant="outline" className="text-[10px]">{new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</Badge>
            </div>
            <p className="text-sm truncate">{order.customer_name}</p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{typeLabels[order.type]}</span>
              <span className="font-medium text-foreground">R$ {Number(order.total).toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
        )}
      />

      {/* Order Detail Modal */}
      <FormModal open={!!selected} onClose={() => setSelected(null)} title={`Pedido #${selected?.order_number ?? ""}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Cliente:</span> {selected.customer_name}</div>
              <div><span className="text-muted-foreground">WhatsApp:</span> {selected.customer_whatsapp}</div>
              <div><span className="text-muted-foreground">Tipo:</span> {typeLabels[selected.type]}</div>
              <div><span className="text-muted-foreground">Pagamento:</span> {paymentLabels[selected.payment_method]}</div>
              {selected.address && <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {selected.address}</div>}
              {selected.notes && <div className="col-span-2"><span className="text-muted-foreground">Obs:</span> {selected.notes}</div>}
            </div>

            <Separator />
            <h4 className="font-semibold text-sm">Itens</h4>
            <div className="space-y-1">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span>{item.quantity}x {item.product_name}</span>
                    {item.notes && <p className="text-xs text-muted-foreground italic">Obs: {item.notes}</p>}
                  </div>
                  <span>R$ {Number(item.total).toFixed(2).replace(".", ",")}</span>
                </div>
              ))}
            </div>

            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {Number(selected.subtotal).toFixed(2).replace(".", ",")}</span></div>
              {Number(selected.delivery_fee) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Entrega</span><span>R$ {Number(selected.delivery_fee).toFixed(2).replace(".", ",")}</span></div>}
              <div className="flex justify-between font-bold"><span>Total</span><span>R$ {Number(selected.total).toFixed(2).replace(".", ",")}</span></div>
            </div>

            {/* Estimated time when accepting */}
            {selected.status === "novo" && (
              <div>
                <Label>Tempo estimado (min)</Label>
                <Input type="number" placeholder="30" value={estimatedMin} onChange={(e) => setEstimatedMin(e.target.value)} />
              </div>
            )}

            {/* Driver assignment when sending for delivery */}
            {selected.status === "pronto" && selected.type === "entrega" && drivers.length > 0 && (
              <div>
                <Label>Atribuir entregador</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}>
                  <option value="">Selecione o entregador</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}

            {/* Show assigned driver */}
            {selected.driver_id && (
              <div className="text-sm">
                <span className="text-muted-foreground">Entregador: </span>
                <span className="font-medium">{drivers.find((d) => d.id === selected.driver_id)?.name ?? "—"}</span>
              </div>
            )}

            <Separator />
            <div className="flex gap-2 flex-wrap">
              {nextStatus[selected.status] && (
                <Button size="sm" onClick={() => updateStatus(selected.id, selected.status, nextStatus[selected.status])}>
                  {selected.status === "novo" ? "Aceitar" : `Mover para ${statusConfig.find((s) => s.id === nextStatus[selected.status])?.label}`}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="mr-1 h-4 w-4" />Imprimir</Button>
              {selected.status !== "cancelado" && selected.status !== "concluido" && (
                <Button size="sm" variant="destructive" onClick={() => setShowCancel(true)}>Cancelar</Button>
              )}
            </div>
          </div>
        )}
      </FormModal>

      {/* Cancel Dialog */}
      <FormModal open={showCancel} onClose={() => setShowCancel(false)} title="Cancelar Pedido" onSubmit={handleCancel} submitLabel="Confirmar Cancelamento">
        <div>
          <Label>Motivo do cancelamento</Label>
          <Input placeholder="Informe o motivo..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        </div>
      </FormModal>
    </div>
  );
}
