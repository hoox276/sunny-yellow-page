import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, Column } from "@/components/shared/DataTable";
import { FormModal } from "@/components/shared/FormModal";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface Coupon { id: string; code: string; discount: string; type: string; uses: number; active: boolean }

const columns: Column<Coupon>[] = [
  { key: "code", label: "Código" },
  { key: "discount", label: "Desconto" },
  { key: "type", label: "Tipo" },
  { key: "uses", label: "Usos" },
  { key: "active", label: "Status", render: (c) => <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Ativo" : "Inativo"}</Badge> },
];

export default function Promocoes() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promoções</h1>
          <p className="text-muted-foreground">Gerencie cupons e regras de desconto</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="mr-1 h-4 w-4" />Novo Cupom</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Cupons</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={[]} searchKey="code" searchPlaceholder="Buscar cupom..." emptyMessage="Nenhum cupom cadastrado." />
        </CardContent>
      </Card>

      <FormModal open={showModal} onClose={() => setShowModal(false)} title="Novo Cupom" onSubmit={() => setShowModal(false)}>
        <div className="space-y-3">
          <div><Label>Código</Label><Input placeholder="Ex: PROMO10" /></div>
          <div><Label>Tipo</Label><Input placeholder="Percentual ou Valor fixo" /></div>
          <div><Label>Desconto</Label><Input placeholder="Ex: 10% ou R$ 5,00" /></div>
          <div><Label>Limite de usos</Label><Input type="number" placeholder="0 = ilimitado" /></div>
        </div>
      </FormModal>
    </div>
  );
}
