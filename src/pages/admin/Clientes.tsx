import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/DataTable";
import { FormModal } from "@/components/shared/FormModal";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  name: string;
  whatsapp: string;
  orders: number;
  total: string;
  lastOrder: string;
}

const columns: Column<Client>[] = [
  { key: "name", label: "Nome" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "orders", label: "Pedidos", render: (c) => <Badge variant="secondary">{c.orders}</Badge> },
  { key: "total", label: "Total gasto" },
  { key: "lastOrder", label: "Último pedido" },
];

export default function Clientes() {
  const [selected, setSelected] = useState<Client | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Visualize e gerencie seus clientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={[]}
            searchKey="name"
            searchPlaceholder="Buscar por nome ou WhatsApp..."
            emptyMessage="Nenhum cliente cadastrado ainda."
            onRowClick={setSelected}
          />
        </CardContent>
      </Card>

      <FormModal open={!!selected} onClose={() => setSelected(null)} title={`Cliente: ${selected?.name ?? ""}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">WhatsApp:</span> {selected.whatsapp}</div>
              <div><span className="text-muted-foreground">Total pedidos:</span> {selected.orders}</div>
              <div><span className="text-muted-foreground">Total gasto:</span> {selected.total}</div>
              <div><span className="text-muted-foreground">Último pedido:</span> {selected.lastOrder}</div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Histórico de Pedidos</h4>
              <p className="text-sm text-muted-foreground">Nenhum pedido registrado.</p>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
