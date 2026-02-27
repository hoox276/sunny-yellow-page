import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

// ==================== Types ====================
interface Category { id: string; name: string; description: string | null; sort_order: number; is_active: boolean; schedule_start: string | null; schedule_end: string | null }
interface Product {
  id: string; name: string; description: string | null; price: number; category_id: string;
  image_urls: string[]; is_active: boolean; is_featured: boolean; is_out_of_stock: boolean; sort_order: number;
}
interface VarGroup { id: string; product_id: string; name: string; type: string; min_selections: number; max_selections: number; is_required: boolean }
interface VarOption { id: string; group_id: string; name: string; price_modifier: number; is_active: boolean }
interface AddonGroup { id: string; product_id: string; name: string; min_selections: number; max_selections: number }
interface AddonItem { id: string; group_id: string; name: string; price: number; is_active: boolean }
interface Combo { id: string; name: string; description: string | null; price: number; is_active: boolean; image_url: string | null }

type ModalType = "category" | "product" | "varGroup" | "varOption" | "addonGroup" | "addonItem" | "combo" | null;

export default function Cardapio() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const companyId = profile?.company_id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [varGroups, setVarGroups] = useState<VarGroup[]>([]);
  const [varOptions, setVarOptions] = useState<VarOption[]>([]);
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
  const [addonItems, setAddonItems] = useState<AddonItem[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);

  const [modal, setModal] = useState<ModalType>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsOutOfStock, setFormIsOutOfStock] = useState(false);
  const [formScheduleStart, setFormScheduleStart] = useState("");
  const [formScheduleEnd, setFormScheduleEnd] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formType, setFormType] = useState("unica");
  const [formMin, setFormMin] = useState("0");
  const [formMax, setFormMax] = useState("1");
  const [formIsRequired, setFormIsRequired] = useState(true);
  const [formGroupId, setFormGroupId] = useState("");
  const [formPriceModifier, setFormPriceModifier] = useState("0");

  const fetch = useCallback(async () => {
    if (!companyId) return;
    const [c, p, vg, vo, ag, ai, co] = await Promise.all([
      supabase.from("categories").select("*").eq("company_id", companyId).order("sort_order"),
      supabase.from("products").select("*").eq("company_id", companyId).order("sort_order"),
      supabase.from("variation_groups").select("*").eq("company_id", companyId).order("sort_order"),
      supabase.from("variation_options").select("*").order("sort_order"),
      supabase.from("addon_groups").select("*").eq("company_id", companyId).order("sort_order"),
      supabase.from("addon_items").select("*").order("sort_order"),
      supabase.from("combos").select("*").eq("company_id", companyId).order("sort_order"),
    ]);
    setCategories((c.data ?? []) as Category[]);
    setProducts((p.data ?? []) as Product[]);
    setVarGroups((vg.data ?? []) as VarGroup[]);
    setVarOptions((vo.data ?? []) as VarOption[]);
    setAddonGroups((ag.data ?? []) as AddonGroup[]);
    setAddonItems((ai.data ?? []) as AddonItem[]);
    setCombos((co.data ?? []) as Combo[]);
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  const resetForm = () => {
    setFormName(""); setFormDesc(""); setFormPrice(""); setFormCategoryId(""); setFormIsActive(true);
    setFormIsFeatured(false); setFormIsOutOfStock(false); setFormScheduleStart(""); setFormScheduleEnd("");
    setFormProductId(""); setFormType("unica"); setFormMin("0"); setFormMax("1"); setFormIsRequired(true);
    setFormGroupId(""); setFormPriceModifier("0"); setEditId(null);
  };

  const openModal = (type: ModalType, editData?: any) => {
    resetForm();
    setModal(type);
    if (editData) {
      setEditId(editData.id);
      setFormName(editData.name ?? "");
      setFormDesc(editData.description ?? "");
      setFormPrice(String(editData.price ?? editData.price_modifier ?? "0"));
      setFormCategoryId(editData.category_id ?? "");
      setFormIsActive(editData.is_active ?? true);
      setFormIsFeatured(editData.is_featured ?? false);
      setFormIsOutOfStock(editData.is_out_of_stock ?? false);
      setFormScheduleStart(editData.schedule_start ?? "");
      setFormScheduleEnd(editData.schedule_end ?? "");
      setFormProductId(editData.product_id ?? "");
      setFormType(editData.type ?? "unica");
      setFormMin(String(editData.min_selections ?? "0"));
      setFormMax(String(editData.max_selections ?? "1"));
      setFormIsRequired(editData.is_required ?? true);
      setFormGroupId(editData.group_id ?? "");
      setFormPriceModifier(String(editData.price_modifier ?? "0"));
    }
  };

  const auditLog = async (action: string, resource: string, resourceId: string, oldVal?: any, newVal?: any) => {
    await supabase.from("audit_logs").insert({
      user_id: user?.id, company_id: companyId, action, resource, resource_id: resourceId,
      old_value: oldVal ?? null, new_value: newVal ?? null,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "category") {
        const data = { name: formName.trim(), description: formDesc.trim() || null, is_active: formIsActive, schedule_start: formScheduleStart || null, schedule_end: formScheduleEnd || null, company_id: companyId! };
        if (editId) {
          await supabase.from("categories").update(data).eq("id", editId);
          await auditLog("update_category", "categories", editId, null, data);
        } else {
          await supabase.from("categories").insert(data);
        }
      } else if (modal === "product") {
        const data = { name: formName.trim(), description: formDesc.trim() || null, price: Number(formPrice), category_id: formCategoryId, is_active: formIsActive, is_featured: formIsFeatured, is_out_of_stock: formIsOutOfStock, company_id: companyId! };
        if (editId) {
          await supabase.from("products").update(data).eq("id", editId);
          await auditLog("update_product", "products", editId, null, data);
        } else {
          await supabase.from("products").insert(data);
        }
      } else if (modal === "varGroup") {
        const data = { name: formName.trim(), product_id: formProductId, type: formType as any, min_selections: Number(formMin), max_selections: Number(formMax), is_required: formIsRequired, company_id: companyId! };
        if (editId) { await supabase.from("variation_groups").update(data).eq("id", editId); }
        else { await supabase.from("variation_groups").insert(data); }
      } else if (modal === "varOption") {
        const data = { name: formName.trim(), group_id: formGroupId, price_modifier: Number(formPriceModifier), is_active: formIsActive };
        if (editId) { await supabase.from("variation_options").update(data).eq("id", editId); }
        else { await supabase.from("variation_options").insert(data); }
      } else if (modal === "addonGroup") {
        const data = { name: formName.trim(), product_id: formProductId, min_selections: Number(formMin), max_selections: Number(formMax), company_id: companyId! };
        if (editId) { await supabase.from("addon_groups").update(data).eq("id", editId); }
        else { await supabase.from("addon_groups").insert(data); }
      } else if (modal === "addonItem") {
        const data = { name: formName.trim(), group_id: formGroupId, price: Number(formPrice), is_active: formIsActive };
        if (editId) { await supabase.from("addon_items").update(data).eq("id", editId); }
        else { await supabase.from("addon_items").insert(data); }
      } else if (modal === "combo") {
        const data = { name: formName.trim(), description: formDesc.trim() || null, price: Number(formPrice), is_active: formIsActive, company_id: companyId! };
        if (editId) {
          await supabase.from("combos").update(data).eq("id", editId);
          await auditLog("update_combo", "combos", editId, null, data);
        } else {
          await supabase.from("combos").insert(data);
        }
      }
      toast({ title: editId ? "Atualizado com sucesso" : "Criado com sucesso" });
      setModal(null);
      resetForm();
      fetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { type, id, name } = deleteTarget;
    const table = type === "category" ? "categories" : type === "product" ? "products" : type === "combo" ? "combos" : type === "varGroup" ? "variation_groups" : type === "varOption" ? "variation_options" : type === "addonGroup" ? "addon_groups" : "addon_items";
    await supabase.from(table).delete().eq("id", id);
    await auditLog(`delete_${type}`, table, id, { name });
    toast({ title: "Removido com sucesso" });
    setDeleteTarget(null);
    fetch();
  };

  const toggleActive = async (table: string, id: string, current: boolean) => {
    await supabase.from(table as any).update({ is_active: !current }).eq("id", id);
    await auditLog(`toggle_${table}`, table, id, { is_active: current }, { is_active: !current });
    fetch();
  };

  // Column definitions
  const catCols: Column<Category>[] = [
    { key: "sort_order", label: "#", render: (c) => <span className="text-muted-foreground">{c.sort_order}</span> },
    { key: "name", label: "Nome" },
    { key: "is_active", label: "Ativo", render: (c) => <Switch checked={c.is_active} onCheckedChange={() => toggleActive("categories", c.id, c.is_active)} /> },
    { key: "schedule", label: "Horário", render: (c) => c.schedule_start ? `${c.schedule_start} - ${c.schedule_end}` : "Sempre" },
    { key: "actions", label: "", render: (c) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openModal("category", c); }}><Pencil className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "category", id: c.id, name: c.name }); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
      </div>
    )},
  ];

  const prodCols: Column<Product>[] = [
    { key: "name", label: "Nome" },
    { key: "category_id", label: "Categoria", render: (p) => categories.find((c) => c.id === p.category_id)?.name ?? "-" },
    { key: "price", label: "Preço", render: (p) => `R$ ${Number(p.price).toFixed(2).replace(".", ",")}` },
    { key: "is_active", label: "Ativo", render: (p) => <Switch checked={p.is_active} onCheckedChange={() => toggleActive("products", p.id, p.is_active)} /> },
    { key: "is_out_of_stock", label: "Estoque", render: (p) => <Switch checked={!p.is_out_of_stock} onCheckedChange={() => supabase.from("products").update({ is_out_of_stock: !p.is_out_of_stock }).eq("id", p.id).then(() => fetch())} /> },
    { key: "actions", label: "", render: (p) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openModal("product", p); }}><Pencil className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "product", id: p.id, name: p.name }); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
      </div>
    )},
  ];

  const comboCols: Column<Combo>[] = [
    { key: "name", label: "Nome" },
    { key: "price", label: "Preço", render: (c) => `R$ ${Number(c.price).toFixed(2).replace(".", ",")}` },
    { key: "is_active", label: "Ativo", render: (c) => <Switch checked={c.is_active} onCheckedChange={() => toggleActive("combos", c.id, c.is_active)} /> },
    { key: "actions", label: "", render: (c) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openModal("combo", c); }}><Pencil className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "combo", id: c.id, name: c.name }); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
      </div>
    )},
  ];

  const modalTitle = modal === "category" ? (editId ? "Editar Categoria" : "Nova Categoria") :
    modal === "product" ? (editId ? "Editar Produto" : "Novo Produto") :
    modal === "varGroup" ? (editId ? "Editar Grupo de Variação" : "Novo Grupo de Variação") :
    modal === "varOption" ? (editId ? "Editar Opção" : "Nova Opção") :
    modal === "addonGroup" ? (editId ? "Editar Grupo de Adicional" : "Novo Grupo de Adicional") :
    modal === "addonItem" ? (editId ? "Editar Adicional" : "Novo Adicional") :
    modal === "combo" ? (editId ? "Editar Combo" : "Novo Combo") : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cardápio</h1>
        <p className="text-muted-foreground">Gerencie categorias, produtos, variações, adicionais e combos</p>
      </div>

      <Tabs defaultValue="categorias">
        <TabsList className="flex-wrap">
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="variacoes">Variações</TabsTrigger>
          <TabsTrigger value="adicionais">Adicionais</TabsTrigger>
          <TabsTrigger value="combos">Combos</TabsTrigger>
        </TabsList>

        <TabsContent value="categorias">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Categorias</CardTitle>
              <Button size="sm" onClick={() => openModal("category")}><Plus className="mr-1 h-4 w-4" />Nova</Button>
            </CardHeader>
            <CardContent><DataTable columns={catCols} data={categories} searchKey="name" searchPlaceholder="Buscar..." emptyMessage="Nenhuma categoria." /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Produtos</CardTitle>
              <Button size="sm" onClick={() => openModal("product")}><Plus className="mr-1 h-4 w-4" />Novo</Button>
            </CardHeader>
            <CardContent><DataTable columns={prodCols} data={products} searchKey="name" searchPlaceholder="Buscar..." emptyMessage="Nenhum produto." /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variacoes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Grupos de Variação</CardTitle>
              <Button size="sm" onClick={() => openModal("varGroup")}><Plus className="mr-1 h-4 w-4" />Novo Grupo</Button>
            </CardHeader>
            <CardContent>
              {varGroups.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum grupo de variação.</p> : (
                <div className="space-y-4">
                  {varGroups.map((vg) => (
                    <div key={vg.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-sm">{vg.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({vg.type === "unica" ? "Escolha única" : "Múltipla"} • {vg.min_selections}-{vg.max_selections})</span>
                          <span className="text-xs text-muted-foreground ml-2">Produto: {products.find((p) => p.id === vg.product_id)?.name ?? "-"}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openModal("varGroup", vg)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget({ type: "varGroup", id: vg.id, name: vg.name })}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setFormGroupId(vg.id); openModal("varOption"); }}>+ Opção</Button>
                        </div>
                      </div>
                      {varOptions.filter((vo) => vo.group_id === vg.id).map((vo) => (
                        <div key={vo.id} className="flex items-center justify-between pl-4 py-1 text-sm">
                          <span>{vo.name} {Number(vo.price_modifier) !== 0 && <span className="text-muted-foreground">(+R$ {Number(vo.price_modifier).toFixed(2).replace(".", ",")})</span>}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openModal("varOption", vo)}><Pencil className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteTarget({ type: "varOption", id: vo.id, name: vo.name })}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adicionais">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Grupos de Adicionais</CardTitle>
              <Button size="sm" onClick={() => openModal("addonGroup")}><Plus className="mr-1 h-4 w-4" />Novo Grupo</Button>
            </CardHeader>
            <CardContent>
              {addonGroups.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum grupo de adicional.</p> : (
                <div className="space-y-4">
                  {addonGroups.map((ag) => (
                    <div key={ag.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-sm">{ag.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">(Mín: {ag.min_selections}, Máx: {ag.max_selections})</span>
                          <span className="text-xs text-muted-foreground ml-2">Produto: {products.find((p) => p.id === ag.product_id)?.name ?? "-"}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openModal("addonGroup", ag)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget({ type: "addonGroup", id: ag.id, name: ag.name })}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setFormGroupId(ag.id); openModal("addonItem"); }}>+ Adicional</Button>
                        </div>
                      </div>
                      {addonItems.filter((ai) => ai.group_id === ag.id).map((ai) => (
                        <div key={ai.id} className="flex items-center justify-between pl-4 py-1 text-sm">
                          <span>{ai.name} <span className="text-muted-foreground">(R$ {Number(ai.price).toFixed(2).replace(".", ",")})</span></span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openModal("addonItem", ai)}><Pencil className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteTarget({ type: "addonItem", id: ai.id, name: ai.name })}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Combos</CardTitle>
              <Button size="sm" onClick={() => openModal("combo")}><Plus className="mr-1 h-4 w-4" />Novo</Button>
            </CardHeader>
            <CardContent><DataTable columns={comboCols} data={combos} searchKey="name" searchPlaceholder="Buscar..." emptyMessage="Nenhum combo." /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Unified Modal */}
      <FormModal open={modal !== null} onClose={() => { setModal(null); resetForm(); }} title={modalTitle} onSubmit={handleSave} isLoading={saving}>
        <div className="space-y-3">
          {/* Name (all) */}
          <div><Label>Nome</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome" /></div>

          {/* Description (category, product, combo) */}
          {(modal === "category" || modal === "product" || modal === "combo") && (
            <div><Label>Descrição</Label><Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Descrição" /></div>
          )}

          {/* Price (product, addonItem, combo) */}
          {(modal === "product" || modal === "addonItem" || modal === "combo") && (
            <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} /></div>
          )}

          {/* Price modifier (varOption) */}
          {modal === "varOption" && (
            <div><Label>Modificador de preço (R$)</Label><Input type="number" step="0.01" value={formPriceModifier} onChange={(e) => setFormPriceModifier(e.target.value)} /></div>
          )}

          {/* Category select (product) */}
          {modal === "product" && (
            <div><Label>Categoria</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}>
                <option value="">Selecione</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Product select (varGroup, addonGroup) */}
          {(modal === "varGroup" || modal === "addonGroup") && (
            <div><Label>Produto</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formProductId} onChange={(e) => setFormProductId(e.target.value)}>
                <option value="">Selecione</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* Group select (varOption, addonItem) */}
          {modal === "varOption" && (
            <div><Label>Grupo</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formGroupId} onChange={(e) => setFormGroupId(e.target.value)}>
                <option value="">Selecione</option>
                {varGroups.map((vg) => <option key={vg.id} value={vg.id}>{vg.name}</option>)}
              </select>
            </div>
          )}
          {modal === "addonItem" && (
            <div><Label>Grupo</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formGroupId} onChange={(e) => setFormGroupId(e.target.value)}>
                <option value="">Selecione</option>
                {addonGroups.map((ag) => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
              </select>
            </div>
          )}

          {/* Variation type (varGroup) */}
          {modal === "varGroup" && (
            <div><Label>Tipo</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formType} onChange={(e) => setFormType(e.target.value)}>
                <option value="unica">Escolha única</option>
                <option value="multipla">Múltipla escolha</option>
              </select>
            </div>
          )}

          {/* Min/Max (varGroup, addonGroup) */}
          {(modal === "varGroup" || modal === "addonGroup") && (
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Mín. seleções</Label><Input type="number" value={formMin} onChange={(e) => setFormMin(e.target.value)} /></div>
              <div><Label>Máx. seleções</Label><Input type="number" value={formMax} onChange={(e) => setFormMax(e.target.value)} /></div>
            </div>
          )}

          {/* Schedule (category) */}
          {modal === "category" && (
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Horário início</Label><Input type="time" value={formScheduleStart} onChange={(e) => setFormScheduleStart(e.target.value)} /></div>
              <div><Label>Horário fim</Label><Input type="time" value={formScheduleEnd} onChange={(e) => setFormScheduleEnd(e.target.value)} /></div>
            </div>
          )}

          {/* Active toggle (category, product, varOption, addonItem, combo) */}
          {(modal === "category" || modal === "product" || modal === "varOption" || modal === "addonItem" || modal === "combo") && (
            <div className="flex items-center gap-2"><Switch checked={formIsActive} onCheckedChange={setFormIsActive} /><Label>Ativo</Label></div>
          )}

          {/* Featured, out of stock (product) */}
          {modal === "product" && (
            <>
              <div className="flex items-center gap-2"><Switch checked={formIsFeatured} onCheckedChange={setFormIsFeatured} /><Label>Destaque</Label></div>
              <div className="flex items-center gap-2"><Switch checked={formIsOutOfStock} onCheckedChange={setFormIsOutOfStock} /><Label>Em falta</Label></div>
            </>
          )}
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remover item"
        description={`Tem certeza que deseja remover "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        variant="destructive"
      />
    </div>
  );
}
