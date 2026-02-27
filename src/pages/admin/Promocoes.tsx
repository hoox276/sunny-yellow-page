import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DataTable, Column } from "@/components/shared/DataTable";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Coupon {
  id: string; code: string; discount_type: string; discount_value: number;
  is_active: boolean; max_uses: number | null; current_uses: number;
  expires_at: string | null; min_order_value: number; max_uses_per_customer: number | null;
  category_id: string | null; company_id: string;
}

interface Category { id: string; name: string }

export default function Promocoes() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const companyId = profile?.company_id;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    const [{ data: cpns }, { data: cats }] = await Promise.all([
      supabase.from("coupons").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").eq("company_id", companyId).order("name"),
    ]);
    setCoupons((cpns ?? []) as Coupon[]);
    setCategories((cats ?? []) as Category[]);
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (c?: Coupon) => {
    if (c) {
      setEditing(c); setCode(c.code); setDiscountType(c.discount_type); setDiscountValue(String(c.discount_value));
      setIsActive(c.is_active); setMaxUses(c.max_uses ? String(c.max_uses) : "");
      setExpiresAt(c.expires_at ? c.expires_at.split("T")[0] : "");
      setMinOrderValue(c.min_order_value ? String(c.min_order_value) : "");
      setMaxUsesPerCustomer(c.max_uses_per_customer ? String(c.max_uses_per_customer) : "");
      setCategoryId(c.category_id ?? "");
    } else {
      setEditing(null); setCode(""); setDiscountType("percent"); setDiscountValue("");
      setIsActive(true); setMaxUses(""); setExpiresAt(""); setMinOrderValue("");
      setMaxUsesPerCustomer(""); setCategoryId("");
    }
    setShowModal(true);
  };

  const saveCoupon = async () => {
    if (!companyId || !code.trim() || !discountValue) return;
    setSaving(true);
    const payload = {
      company_id: companyId,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      is_active: isActive,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt ? `${expiresAt}T23:59:59Z` : null,
      min_order_value: Number(minOrderValue) || 0,
      max_uses_per_customer: maxUsesPerCustomer ? Number(maxUsesPerCustomer) : null,
      category_id: categoryId || null,
    };
    if (editing) {
      await supabase.from("coupons").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("coupons").insert(payload);
    }
    setSaving(false); setShowModal(false); fetchData();
    toast({ title: editing ? "Cupom atualizado" : "Cupom criado" });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("coupons").delete().eq("id", deleteId);
    setDeleteId(null); fetchData();
    toast({ title: "Cupom removido" });
  };

  const discountTypeLabels: Record<string, string> = { percent: "Percentual", fixed: "Valor fixo", free_delivery: "Frete grátis" };

  const columns: Column<Coupon>[] = [
    { key: "code", label: "Código", render: (c) => <span className="font-mono font-bold">{c.code}</span> },
    {
      key: "discount_type", label: "Desconto", render: (c) => {
        if (c.discount_type === "percent") return `${c.discount_value}%`;
        if (c.discount_type === "free_delivery") return "Frete grátis";
        return `R$ ${Number(c.discount_value).toFixed(2).replace(".", ",")}`;
      },
    },
    { key: "current_uses", label: "Usos", render: (c) => `${c.current_uses}${c.max_uses ? ` / ${c.max_uses}` : ""}` },
    { key: "expires_at", label: "Validade", render: (c) => c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "Sem limite" },
    { key: "is_active", label: "Status", render: (c) => <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Ativo" : "Inativo"}</Badge> },
    {
      key: "actions", label: "Ações", render: (c) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openModal(c); }}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promoções</h1>
          <p className="text-muted-foreground">Gerencie cupons e regras de desconto</p>
        </div>
        <Button size="sm" onClick={() => openModal()}><Plus className="mr-1 h-4 w-4" />Novo Cupom</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Cupons</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={coupons} searchKey="code" searchPlaceholder="Buscar cupom..." emptyMessage="Nenhum cupom cadastrado." />
        </CardContent>
      </Card>

      <FormModal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Editar Cupom" : "Novo Cupom"} onSubmit={saveCoupon} isLoading={saving}>
        <div className="space-y-3">
          <div><Label>Código</Label><Input placeholder="Ex: PROMO10" value={code} onChange={(e) => setCode(e.target.value)} className="uppercase" /></div>
          <div>
            <Label>Tipo de desconto</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
              <option value="percent">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
              <option value="free_delivery">Frete grátis</option>
            </select>
          </div>
          {discountType !== "free_delivery" && (
            <div><Label>{discountType === "percent" ? "Percentual (%)" : "Valor (R$)"}</Label><Input type="number" placeholder="0" step={discountType === "percent" ? "1" : "0.01"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} /></div>
          )}
          <div><Label>Valor mínimo do pedido (R$)</Label><Input type="number" placeholder="0,00" step="0.01" value={minOrderValue} onChange={(e) => setMinOrderValue(e.target.value)} /></div>
          <div><Label>Limite de usos total</Label><Input type="number" placeholder="0 = ilimitado" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} /></div>
          <div><Label>Limite por cliente</Label><Input type="number" placeholder="Sem limite" value={maxUsesPerCustomer} onChange={(e) => setMaxUsesPerCustomer(e.target.value)} /></div>
          <div><Label>Validade</Label><Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></div>
          {categories.length > 0 && (
            <div>
              <Label>Aplicar apenas à categoria</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Todas as categorias</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Ativo</Label>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Cupom"
        description="Tem certeza que deseja excluir este cupom?"
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}
