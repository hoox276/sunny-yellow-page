import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/DataTable";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DollarSign, Plus, Lock } from "lucide-react";

interface Transaction { id: string; description: string; type: string; value: string; time: string }
const txColumns: Column<Transaction>[] = [
  { key: "time", label: "Hora" },
  { key: "description", label: "Descrição" },
  { key: "type", label: "Tipo" },
  { key: "value", label: "Valor" },
];

export default function Caixa() {
  const [showNewTx, setShowNewTx] = useState(false);
  const [showClose, setShowClose] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Caixa</h1>
          <p className="text-muted-foreground">Controle de lançamentos e fechamento</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowNewTx(true)}><Plus className="mr-1 h-4 w-4" />Lançamento</Button>
          <Button size="sm" variant="outline" onClick={() => setShowClose(true)}><Lock className="mr-1 h-4 w-4" />Fechar Caixa</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">R$ 0,00</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">R$ 0,00</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">R$ 0,00</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Lançamentos do dia</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={txColumns} data={[]} emptyMessage="Nenhum lançamento hoje." />
        </CardContent>
      </Card>

      <FormModal open={showNewTx} onClose={() => setShowNewTx(false)} title="Novo Lançamento" onSubmit={() => setShowNewTx(false)}>
        <div className="space-y-3">
          <div><Label>Descrição</Label><Input placeholder="Descrição do lançamento" /></div>
          <div><Label>Tipo</Label><Input placeholder="Entrada ou Saída" /></div>
          <div><Label>Valor (R$)</Label><Input type="number" placeholder="0,00" step="0.01" /></div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={showClose}
        onClose={() => setShowClose(false)}
        onConfirm={() => setShowClose(false)}
        title="Fechar Caixa"
        description="Tem certeza que deseja fechar o caixa do dia? Esta ação não pode ser desfeita."
        confirmLabel="Fechar Caixa"
        variant="destructive"
      />
    </div>
  );
}
