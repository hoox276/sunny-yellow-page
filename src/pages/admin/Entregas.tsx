import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/DataTable";
import { FormModal } from "@/components/shared/FormModal";
import { Plus } from "lucide-react";

interface Neighborhood { id: string; name: string; fee: string; estimatedTime: string }
const neighborhoodCols: Column<Neighborhood>[] = [
  { key: "name", label: "Bairro" },
  { key: "fee", label: "Taxa" },
  { key: "estimatedTime", label: "Tempo estimado" },
];

interface Driver { id: string; name: string; phone: string; status: string }
const driverCols: Column<Driver>[] = [
  { key: "name", label: "Nome" },
  { key: "phone", label: "Telefone" },
  { key: "status", label: "Status" },
];

type ModalType = "bairro" | "entregador" | null;

export default function Entregas() {
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Entregas</h1>
        <p className="text-muted-foreground">Gerencie bairros, taxas e entregadores</p>
      </div>

      <Tabs defaultValue="bairros">
        <TabsList>
          <TabsTrigger value="bairros">Bairros e Taxas</TabsTrigger>
          <TabsTrigger value="entregadores">Entregadores</TabsTrigger>
        </TabsList>

        <TabsContent value="bairros">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bairros</CardTitle>
              <Button size="sm" onClick={() => setModal("bairro")}><Plus className="mr-1 h-4 w-4" />Novo</Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={neighborhoodCols} data={[]} searchKey="name" searchPlaceholder="Buscar bairro..." emptyMessage="Nenhum bairro cadastrado." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregadores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Entregadores</CardTitle>
              <Button size="sm" onClick={() => setModal("entregador")}><Plus className="mr-1 h-4 w-4" />Novo</Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={driverCols} data={[]} searchKey="name" searchPlaceholder="Buscar entregador..." emptyMessage="Nenhum entregador cadastrado." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FormModal open={modal !== null} onClose={() => setModal(null)} title={modal === "bairro" ? "Novo Bairro" : "Novo Entregador"} onSubmit={() => setModal(null)}>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input placeholder={modal === "bairro" ? "Nome do bairro" : "Nome do entregador"} /></div>
          {modal === "bairro" ? (
            <>
              <div><Label>Taxa (R$)</Label><Input type="number" placeholder="0,00" step="0.01" /></div>
              <div><Label>Tempo estimado</Label><Input placeholder="Ex: 30-40 min" /></div>
            </>
          ) : (
            <div><Label>Telefone</Label><Input placeholder="(00) 00000-0000" /></div>
          )}
        </div>
      </FormModal>
    </div>
  );
}
