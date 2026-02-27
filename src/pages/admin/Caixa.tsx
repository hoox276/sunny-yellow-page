import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/DataTable";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Lock, Download } from "lucide-react";

interface CashTransaction {
  id: string; type: string; category: string; description: string;
  payment_method: string | null; amount: number; created_at: string; order_id: string | null;
}

interface CashClosing {
  id: string; total_entries: number; total_exits: number; total_balance: number;
  payment_breakdown: any; manual_balance: number | null; notes: string | null;
  period_start: string; period_end: string; created_at: string;
}

const paymentLabels: Record<string, string> = { pix: "Pix", dinheiro: "Dinheiro", cartao_entrega: "Cartão", "": "Outros" };

export default function Caixa() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const companyId = profile?.company_id;

  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [showNewTx, setShowNewTx] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [txDesc, setTxDesc] = useState("");
  const [txType, setTxType] = useState<"entrada" | "saida">("entrada");
  const [txCategory, setTxCategory] = useState("manual");
  const [txAmount, setTxAmount] = useState("");
  const [txPayment, setTxPayment] = useState("");

  // Close form
  const [closeManualBalance, setCloseManualBalance] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  // Date filter
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    const dayStart = `${filterDate}T00:00:00`;
    const dayEnd = `${filterDate}T23:59:59`;

    const [{ data: txs }, { data: cls }] = await Promise.all([
      supabase.from("cash_transactions").select("*").eq("company_id", companyId).gte("created_at", dayStart).lte("created_at", dayEnd).order("created_at", { ascending: false }),
      supabase.from("cash_closings").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(10),
    ]);
    setTransactions((txs ?? []) as CashTransaction[]);
    setClosings((cls ?? []) as CashClosing[]);
  }, [companyId, filterDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-sync completed orders
  const syncOrderTransactions = useCallback(async () => {
    if (!companyId) return;
    const dayStart = `${filterDate}T00:00:00`;
    const dayEnd = `${filterDate}T23:59:59`;
    const { data: completedOrders } = await supabase.from("orders").select("id, order_number, total, payment_method").eq("company_id", companyId).eq("status", "concluido").gte("created_at", dayStart).lte("created_at", dayEnd);
    
    if (!completedOrders?.length) return;
    
    const existingOrderIds = transactions.filter((t) => t.order_id).map((t) => t.order_id);
    const newOrders = completedOrders.filter((o) => !existingOrderIds.includes(o.id));
    
    if (newOrders.length > 0) {
      const inserts = newOrders.map((o) => ({
        company_id: companyId,
        order_id: o.id,
        type: "entrada" as const,
        category: "pedido",
        description: `Pedido #${o.order_number}`,
        payment_method: o.payment_method,
        amount: Number(o.total),
        created_by: user?.id,
      }));
      await supabase.from("cash_transactions").insert(inserts);
      fetchData();
      toast({ title: `${newOrders.length} lançamento(s) sincronizado(s)` });
    }
  }, [companyId, filterDate, transactions, user?.id, fetchData, toast]);

  useEffect(() => { syncOrderTransactions(); }, [syncOrderTransactions]);

  const entries = transactions.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
  const exits = transactions.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);
  const balance = entries - exits;

  // Breakdown by payment method
  const breakdown: Record<string, number> = {};
  transactions.filter((t) => t.type === "entrada").forEach((t) => {
    const key = t.payment_method || "outros";
    breakdown[key] = (breakdown[key] || 0) + Number(t.amount);
  });

  const saveTransaction = async () => {
    if (!companyId || !txDesc.trim() || !txAmount) return;
    setSaving(true);
    await supabase.from("cash_transactions").insert({
      company_id: companyId,
      type: txType,
      category: txCategory,
      description: txDesc.trim(),
      payment_method: txPayment || null,
      amount: Number(txAmount),
      created_by: user?.id,
    });
    // Audit
    await supabase.from("audit_logs").insert({
      user_id: user?.id, company_id: companyId, action: "cash_transaction",
      resource: "cash_transactions", new_value: { type: txType, amount: txAmount, description: txDesc },
    });
    setSaving(false); setShowNewTx(false); fetchData();
    setTxDesc(""); setTxAmount(""); setTxCategory("manual"); setTxType("entrada"); setTxPayment("");
    toast({ title: "Lançamento registrado" });
  };

  const handleClose = async () => {
    if (!companyId) return;
    setSaving(true);
    const dayStart = `${filterDate}T00:00:00`;
    const dayEnd = `${filterDate}T23:59:59`;
    await supabase.from("cash_closings").insert({
      company_id: companyId, closed_by: user?.id,
      total_entries: entries, total_exits: exits, total_balance: balance,
      payment_breakdown: breakdown,
      manual_balance: closeManualBalance ? Number(closeManualBalance) : null,
      notes: closeNotes.trim() || null,
      period_start: dayStart, period_end: dayEnd,
    });
    await supabase.from("audit_logs").insert({
      user_id: user?.id, company_id: companyId, action: "cash_close",
      resource: "cash_closings", new_value: { entries, exits, balance, manual_balance: closeManualBalance },
    });
    setSaving(false); setShowClose(false); fetchData();
    setCloseManualBalance(""); setCloseNotes("");
    toast({ title: "Caixa fechado com sucesso" });
  };

  const exportCSV = () => {
    const header = "Hora,Descrição,Tipo,Método,Valor\n";
    const rows = transactions.map((t) =>
      `${new Date(t.created_at).toLocaleTimeString("pt-BR")},${t.description},${t.type},${t.payment_method || ""},${Number(t.amount).toFixed(2)}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `caixa-${filterDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const txColumns: Column<CashTransaction>[] = [
    { key: "created_at", label: "Hora", render: (t) => new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
    { key: "description", label: "Descrição" },
    { key: "type", label: "Tipo", render: (t) => <Badge variant={t.type === "entrada" ? "default" : "destructive"}>{t.type === "entrada" ? "Entrada" : "Saída"}</Badge> },
    { key: "payment_method", label: "Método", render: (t) => paymentLabels[t.payment_method ?? ""] || t.payment_method || "—" },
    { key: "amount", label: "Valor", render: (t) => `R$ ${Number(t.amount).toFixed(2).replace(".", ",")}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Caixa</h1>
          <p className="text-muted-foreground">Controle de lançamentos e fechamento</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input type="date" className="w-auto" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          <Button size="sm" onClick={() => setShowNewTx(true)}><Plus className="mr-1 h-4 w-4" />Lançamento</Button>
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1 h-4 w-4" />Exportar</Button>
          <Button size="sm" variant="outline" onClick={() => setShowClose(true)}><Lock className="mr-1 h-4 w-4" />Fechar Caixa</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">R$ {entries.toFixed(2).replace(".", ",")}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">R$ {exits.toFixed(2).replace(".", ",")}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">R$ {balance.toFixed(2).replace(".", ",")}</div></CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Entradas por Método</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(breakdown).map(([method, value]) => (
                <div key={method} className="flex justify-between text-sm p-2 rounded bg-muted/50">
                  <span>{paymentLabels[method] || method}</span>
                  <span className="font-medium">R$ {value.toFixed(2).replace(".", ",")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="lancamentos">
        <TabsList>
          <TabsTrigger value="lancamentos">Lançamentos do Dia</TabsTrigger>
          <TabsTrigger value="fechamentos">Fechamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos">
          <Card>
            <CardHeader><CardTitle>Lançamentos — {new Date(filterDate + "T12:00:00").toLocaleDateString("pt-BR")}</CardTitle></CardHeader>
            <CardContent>
              <DataTable columns={txColumns} data={transactions} emptyMessage="Nenhum lançamento neste dia." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fechamentos">
          <Card>
            <CardHeader><CardTitle>Histórico de Fechamentos</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {closings.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nenhum fechamento registrado.</p> : closings.map((c) => (
                  <div key={c.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{new Date(c.period_start).toLocaleDateString("pt-BR")}</span>
                      <span>Saldo: R$ {Number(c.total_balance).toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Entradas: R$ {Number(c.total_entries).toFixed(2).replace(".", ",")}</span>
                      <span>Saídas: R$ {Number(c.total_exits).toFixed(2).replace(".", ",")}</span>
                    </div>
                    {c.manual_balance !== null && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Saldo informado: </span>
                        <span className="font-medium">R$ {Number(c.manual_balance).toFixed(2).replace(".", ",")}</span>
                        <span className="text-muted-foreground ml-2">
                          (Divergência: R$ {(Number(c.manual_balance) - Number(c.total_balance)).toFixed(2).replace(".", ",")})
                        </span>
                      </div>
                    )}
                    {c.notes && <p className="text-xs text-muted-foreground italic">{c.notes}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Transaction Modal */}
      <FormModal open={showNewTx} onClose={() => setShowNewTx(false)} title="Novo Lançamento" onSubmit={saveTransaction} isLoading={saving}>
        <div className="space-y-3">
          <div><Label>Descrição</Label><Input placeholder="Descrição do lançamento" value={txDesc} onChange={(e) => setTxDesc(e.target.value)} /></div>
          <div>
            <Label>Tipo</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={txType} onChange={(e) => setTxType(e.target.value as any)}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>
          <div>
            <Label>Categoria</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={txCategory} onChange={(e) => setTxCategory(e.target.value)}>
              <option value="manual">Manual</option>
              <option value="ajuste">Ajuste</option>
              <option value="estorno">Estorno</option>
              <option value="despesa">Despesa</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <div>
            <Label>Método de Pagamento</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={txPayment} onChange={(e) => setTxPayment(e.target.value)}>
              <option value="">Nenhum</option>
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_entrega">Cartão</option>
            </select>
          </div>
          <div><Label>Valor (R$)</Label><Input type="number" placeholder="0,00" step="0.01" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} /></div>
        </div>
      </FormModal>

      {/* Close Cash Modal */}
      <FormModal open={showClose} onClose={() => setShowClose(false)} title="Fechar Caixa" onSubmit={handleClose} submitLabel="Confirmar Fechamento" isLoading={saving}>
        <div className="space-y-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Entradas</span><span className="text-success font-medium">R$ {entries.toFixed(2).replace(".", ",")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Saídas</span><span className="text-destructive font-medium">R$ {exits.toFixed(2).replace(".", ",")}</span></div>
            <Separator />
            <div className="flex justify-between font-bold"><span>Saldo do sistema</span><span>R$ {balance.toFixed(2).replace(".", ",")}</span></div>
          </div>
          <div><Label>Saldo informado manualmente (R$)</Label><Input type="number" placeholder="0,00" step="0.01" value={closeManualBalance} onChange={(e) => setCloseManualBalance(e.target.value)} /></div>
          <div><Label>Observações</Label><Input placeholder="Observações sobre o fechamento" value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} /></div>
        </div>
      </FormModal>
    </div>
  );
}
