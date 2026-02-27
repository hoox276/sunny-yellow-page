import { useState } from "react";
import { KanbanBoard, KanbanColumn } from "@/components/shared/KanbanBoard";
import { FormModal } from "@/components/shared/FormModal";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  customer: string;
  total: string;
  items: number;
  time: string;
}

const emptyColumns: KanbanColumn<Order>[] = [
  { id: "novo", label: "Novo", color: "hsl(16 85% 55%)", items: [] },
  { id: "preparo", label: "Em Preparo", color: "hsl(38 92% 50%)", items: [] },
  { id: "pronto", label: "Pronto", color: "hsl(142 71% 45%)", items: [] },
  { id: "saiu", label: "Saiu p/ Entrega", color: "hsl(220 70% 55%)", items: [] },
  { id: "concluido", label: "Concluído", color: "hsl(220 9% 46%)", items: [] },
  { id: "cancelado", label: "Cancelado", color: "hsl(0 72% 51%)", items: [] },
];

export default function Pedidos() {
  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Acompanhe e gerencie os pedidos em tempo real</p>
      </div>

      <KanbanBoard
        columns={emptyColumns}
        onCardClick={(item) => setSelected(item as Order)}
        renderCard={(order: Order) => (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">#{order.id}</span>
              <Badge variant="outline" className="text-xs">{order.time}</Badge>
            </div>
            <p className="text-sm">{order.customer}</p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{order.items} itens</span>
              <span className="font-medium text-foreground">{order.total}</span>
            </div>
          </div>
        )}
      />

      <FormModal open={!!selected} onClose={() => setSelected(null)} title={`Pedido #${selected?.id ?? ""}`}>
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Cliente:</span> {selected.customer}</div>
              <div><span className="text-muted-foreground">Total:</span> {selected.total}</div>
              <div><span className="text-muted-foreground">Itens:</span> {selected.items}</div>
              <div><span className="text-muted-foreground">Hora:</span> {selected.time}</div>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
