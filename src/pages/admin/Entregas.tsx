import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/DataTable";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Truck, MapPin } from "lucide-react";

interface Neighborhood {
  id: string; name: string; fee: number; estimated_time: string | null; is_active: boolean; company_id: string;
}

interface Driver {
  id: string; name: string; phone: string | null; is_active: boolean; company_id: string;
}

interface DeliveryStats {
  totalDeliveries: number;
  avgDeliveryTime: number;
  driverStats: { name: string; count: number }[];
}

export default function Entregas() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const companyId = profile?.company_id;

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<DeliveryStats>({ totalDeliveries: 0, avgDeliveryTime: 0, driverStats: [] });

  // Modal state
  const [editingNeighborhood, setEditingNeighborhood] = useState<Neighborhood | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showNeighborhoodModal, setShowNeighborhoodModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "neighborhood" | "driver"; id: string } | null>(null);

  // Form state
  const [nName, setNName] = useState("");
  const [nFee, setNFee] = useState("");
  const [nTime, setNTime] = useState("");
  const [nActive, setNActive] = useState(true);
  const [dName, setDName] = useState("");
  const [dPhone, setDPhone] = useState("");
  const [dActive, setDActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    const [{ data: hoods }, { data: drvs }, { data: deliveredOrders }] = await Promise.all([
      supabase.from("neighborhoods").select("*").eq("company_id", companyId).order("name"),
      supabase.from("drivers").select("*").eq("company_id", companyId).order("name"),
      supabase.from("orders").select("id, driver_id, created_at, delivered_at").eq("company_id", companyId).eq("status", "concluido").eq("type", "entrega"),
    ]);
    setNeighborhoods((hoods ?? []) as Neighborhood[]);
    setDrivers((drvs ?? []) as Driver[]);

    // Stats
    const orders = deliveredOrders ?? [];
    const driverMap: Record<string, number> = {};
    let totalTime = 0, timeCount = 0;
    orders.forEach((o: any) => {
      if (o.driver_id) driverMap[o.driver_id] = (driverMap[o.driver_id] || 0) + 1;
      if (o.delivered_at && o.created_at) {
        const diff = (new Date(o.delivered_at).getTime() - new Date(o.created_at).getTime()) / 60000;
        if (diff > 0 && diff < 300) { totalTime += diff; timeCount++; }
      }
    });
    const driverStatsArr = (drvs ?? []).map((d: any) => ({ name: d.name, count: driverMap[d.id] || 0 })).sort((a: any, b: any) => b.count - a.count);
    setStats({ totalDeliveries: orders.length, avgDeliveryTime: timeCount ? Math.round(totalTime / timeCount) : 0, driverStats: driverStatsArr });
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Neighborhood CRUD
  const openNeighborhoodModal = (n?: Neighborhood) => {
    if (n) {
      setEditingNeighborhood(n); setNName(n.name); setNFee(String(n.fee)); setNTime(n.estimated_time ?? ""); setNActive(n.is_active);
    } else {
      setEditingNeighborhood(null); setNName(""); setNFee(""); setNTime(""); setNActive(true);
    }
    setShowNeighborhoodModal(true);
  };

  const saveNeighborhood = async () => {
    if (!companyId || !nName.trim()) return;
    setSaving(true);
    const payload = { name: nName.trim(), fee: Number(nFee) || 0, estimated_time: nTime.trim() || null, is_active: nActive, company_id: companyId };
    if (editingNeighborhood) {
      await supabase.from("neighborhoods").update(payload).eq("id", editingNeighborhood.id);
    } else {
      await supabase.from("neighborhoods").insert(payload);
    }
    setSaving(false); setShowNeighborhoodModal(false); fetchData();
    toast({ title: editingNeighborhood ? "Bairro atualizado" : "Bairro criado" });
  };

  // Driver CRUD
  const openDriverModal = (d?: Driver) => {
    if (d) {
      setEditingDriver(d); setDName(d.name); setDPhone(d.phone ?? ""); setDActive(d.is_active);
    } else {
      setEditingDriver(null); setDName(""); setDPhone(""); setDActive(true);
    }
    setShowDriverModal(true);
  };

  const saveDriver = async () => {
    if (!companyId || !dName.trim()) return;
    setSaving(true);
    const payload = { name: dName.trim(), phone: dPhone.trim() || null, is_active: dActive, company_id: companyId };
    if (editingDriver) {
      await supabase.from("drivers").update(payload).eq("id", editingDriver.id);
    } else {
      await supabase.from("drivers").insert(payload);
    }
    setSaving(false); setShowDriverModal(false); fetchData();
    toast({ title: editingDriver ? "Entregador atualizado" : "Entregador criado" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "neighborhood") {
      await supabase.from("neighborhoods").delete().eq("id", deleteTarget.id);
    } else {
      await supabase.from("drivers").delete().eq("id", deleteTarget.id);
    }
    setDeleteTarget(null); fetchData();
    toast({ title: "Removido com sucesso" });
  };

  const neighborhoodCols: Column<Neighborhood>[] = [
    { key: "name", label: "Bairro" },
    { key: "fee", label: "Taxa", render: (n) => `R$ ${Number(n.fee).toFixed(2).replace(".", ",")}` },
    { key: "estimated_time", label: "Tempo estimado", render: (n) => n.estimated_time || "—" },
    { key: "is_active", label: "Status", render: (n) => <Badge variant={n.is_active ? "default" : "secondary"}>{n.is_active ? "Ativo" : "Inativo"}</Badge> },
    {
      key: "actions", label: "Ações", render: (n) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openNeighborhoodModal(n); }}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "neighborhood", id: n.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  const driverCols: Column<Driver>[] = [
    { key: "name", label: "Nome" },
    { key: "phone", label: "Telefone", render: (d) => d.phone || "—" },
    { key: "is_active", label: "Status", render: (d) => <Badge variant={d.is_active ? "default" : "secondary"}>{d.is_active ? "Ativo" : "Inativo"}</Badge> },
    {
      key: "actions", label: "Ações", render: (d) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openDriverModal(d); }}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "driver", id: d.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Entregas</h1>
        <p className="text-muted-foreground">Gerencie bairros, taxas e entregadores</p>
      </div>

      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Entregas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalDeliveries}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.avgDeliveryTime ? `${stats.avgDeliveryTime} min` : "—"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bairros Ativos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{neighborhoods.filter((n) => n.is_active).length}</div></CardContent>
        </Card>
      </div>

      {/* Driver stats */}
      {stats.driverStats.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Pedidos por Entregador</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.driverStats.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span>{d.name}</span>
                  <Badge variant="outline">{d.count} pedido(s)</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="bairros">
        <TabsList>
          <TabsTrigger value="bairros">Bairros e Taxas</TabsTrigger>
          <TabsTrigger value="entregadores">Entregadores</TabsTrigger>
        </TabsList>

        <TabsContent value="bairros">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bairros</CardTitle>
              <Button size="sm" onClick={() => openNeighborhoodModal()}><Plus className="mr-1 h-4 w-4" />Novo</Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={neighborhoodCols} data={neighborhoods} searchKey="name" searchPlaceholder="Buscar bairro..." emptyMessage="Nenhum bairro cadastrado." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregadores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Entregadores</CardTitle>
              <Button size="sm" onClick={() => openDriverModal()}><Plus className="mr-1 h-4 w-4" />Novo</Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={driverCols} data={drivers} searchKey="name" searchPlaceholder="Buscar entregador..." emptyMessage="Nenhum entregador cadastrado." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Neighborhood Modal */}
      <FormModal open={showNeighborhoodModal} onClose={() => setShowNeighborhoodModal(false)} title={editingNeighborhood ? "Editar Bairro" : "Novo Bairro"} onSubmit={saveNeighborhood} isLoading={saving}>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input placeholder="Nome do bairro" value={nName} onChange={(e) => setNName(e.target.value)} /></div>
          <div><Label>Taxa (R$)</Label><Input type="number" placeholder="0,00" step="0.01" value={nFee} onChange={(e) => setNFee(e.target.value)} /></div>
          <div><Label>Tempo estimado</Label><Input placeholder="Ex: 30-40 min" value={nTime} onChange={(e) => setNTime(e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={nActive} onCheckedChange={setNActive} />
            <Label>Ativo</Label>
          </div>
        </div>
      </FormModal>

      {/* Driver Modal */}
      <FormModal open={showDriverModal} onClose={() => setShowDriverModal(false)} title={editingDriver ? "Editar Entregador" : "Novo Entregador"} onSubmit={saveDriver} isLoading={saving}>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input placeholder="Nome do entregador" value={dName} onChange={(e) => setDName(e.target.value)} /></div>
          <div><Label>WhatsApp</Label><Input placeholder="(00) 00000-0000" value={dPhone} onChange={(e) => setDPhone(e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={dActive} onCheckedChange={setDActive} />
            <Label>Ativo</Label>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirmar exclusão"
        description="Tem certeza que deseja remover este registro? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}
