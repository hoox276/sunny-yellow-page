import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Download, Trash2, Shield } from "lucide-react";

export default function Configuracoes() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!profile?.company_id) return;
    supabase.from("companies").select("*").eq("id", profile.company_id).single().then(({ data }) => {
      if (data) {
        setCompany(data);
        setName(data.name || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setAddress(data.address || "");
      }
    });
  }, [profile?.company_id]);

  const saveCompanyData = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    const { error } = await supabase.from("companies").update({ name: name.trim().slice(0, 100), phone: phone.trim().slice(0, 20), email: email.trim().slice(0, 100), address: address.trim().slice(0, 200) }).eq("id", profile.company_id);
    setLoading(false);
    toast({ title: error ? "Erro ao salvar" : "Dados salvos!", variant: error ? "destructive" : "default" });
  };

  // LGPD: Export company data
  const exportData = async () => {
    if (!profile?.company_id) return;
    const companyId = profile.company_id;

    const [orders, products, categories, customers, transactions] = await Promise.all([
      supabase.from("orders").select("*").eq("company_id", companyId),
      supabase.from("products").select("*").eq("company_id", companyId),
      supabase.from("categories").select("*").eq("company_id", companyId),
      supabase.from("orders").select("customer_name, customer_whatsapp, address").eq("company_id", companyId),
      supabase.from("cash_transactions").select("*").eq("company_id", companyId),
    ]);

    const exportObj = {
      exported_at: new Date().toISOString(),
      company: company,
      categories: categories.data ?? [],
      products: products.data ?? [],
      orders: orders.data ?? [],
      unique_customers: customers.data ?? [],
      cash_transactions: transactions.data ?? [],
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dados-empresa-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Dados exportados com sucesso!" });
  };

  // LGPD: Request data deletion
  const requestDeletion = async () => {
    if (!profile?.company_id || !user) return;
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      company_id: profile.company_id,
      action: "delete",
      resource: "lgpd_deletion_request",
      reason: deleteReason.trim().slice(0, 500) || "Solicitação de exclusão de dados",
      new_value: { requested_at: new Date().toISOString(), company_name: company?.name },
    });
    setShowDeleteConfirm(false);
    setDeleteReason("");
    toast({ title: "Solicitação registrada", description: "Sua solicitação de exclusão foi registrada e será analisada." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configure seu estabelecimento</p>
      </div>

      <Tabs defaultValue="loja">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="loja">Dados da Loja</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="entrega">Taxa Padrão</TabsTrigger>
          <TabsTrigger value="visual">Identidade Visual</TabsTrigger>
          <TabsTrigger value="link">Link e QR Code</TabsTrigger>
          <TabsTrigger value="lgpd">LGPD</TabsTrigger>
        </TabsList>

        <TabsContent value="loja">
          <Card>
            <CardHeader><CardTitle>Dados da Loja</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Nome da loja</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Minha Loja" maxLength={100} /></div>
                <div><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" maxLength={20} /></div>
                <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="loja@email.com" maxLength={100} /></div>
                <div><Label>Endereço</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro" maxLength={200} /></div>
              </div>
              <Button onClick={saveCompanyData} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios">
          <Card>
            <CardHeader><CardTitle>Horários de Funcionamento</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">{day}</span>
                  <Input className="w-24" placeholder="08:00" />
                  <span className="text-muted-foreground">às</span>
                  <Input className="w-24" placeholder="22:00" />
                </div>
              ))}
              <Button className="mt-2">Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos">
          <Card>
            <CardHeader><CardTitle>Formas de Pagamento</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito"].map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <input type="checkbox" id={m} className="rounded" />
                    <label htmlFor={m} className="text-sm">{m}</label>
                  </div>
                ))}
                <Separator />
                <div><Label>Chave Pix</Label><Input placeholder="Sua chave Pix" /></div>
                <Button>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entrega">
          <Card>
            <CardHeader><CardTitle>Taxa Padrão de Entrega</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Taxa padrão (R$)</Label><Input type="number" placeholder="5,00" step="0.01" /></div>
              <div><Label>Tempo estimado padrão</Label><Input placeholder="30-45 min" /></div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual">
          <Card>
            <CardHeader><CardTitle>Identidade Visual</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Logo (URL)</Label><Input placeholder="https://..." /></div>
              <div><Label>Cor primária</Label><Input type="color" className="w-16 h-10" /></div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link">
          <Card>
            <CardHeader><CardTitle>Link Público e QR Code</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Slug do cardápio</Label>
                <Input placeholder="minha-loja" value={company?.slug ?? ""} readOnly />
                <p className="text-xs text-muted-foreground mt-1">O link ficará: /menu/{company?.slug ?? "minha-loja"}</p>
              </div>
              <div className="flex items-center justify-center h-48 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-sm">QR Code será gerado aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lgpd">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Exportar Dados (LGPD)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Exporte todos os dados da sua empresa em formato JSON, incluindo pedidos, produtos, categorias e transações financeiras.</p>
                <Button onClick={exportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" /> Exportar dados da empresa
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Solicitar Exclusão de Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Solicite a exclusão completa dos dados da sua empresa. A solicitação será registrada e processada conforme a LGPD.</p>
                <div>
                  <Label>Motivo (opcional)</Label>
                  <Textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} placeholder="Descreva o motivo da solicitação..." maxLength={500} />
                </div>
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Solicitar exclusão
                </Button>
              </CardContent>
            </Card>
          </div>

          <ConfirmDialog
            open={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            title="Confirmar solicitação de exclusão"
            description="Esta ação registrará uma solicitação formal de exclusão dos dados da sua empresa. A equipe de suporte entrará em contato para confirmar o processo. Deseja continuar?"
            confirmLabel="Confirmar solicitação"
            variant="destructive"
            onConfirm={requestDeletion}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
