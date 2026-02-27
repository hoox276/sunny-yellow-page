import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormModal } from "@/components/shared/FormModal";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Plus } from "lucide-react";

// --- Categorias ---
interface Category { id: string; name: string; order: number }
const catColumns: Column<Category>[] = [
  { key: "name", label: "Nome" },
  { key: "order", label: "Ordem" },
];

// --- Produtos ---
interface Product { id: string; name: string; price: string; category: string }
const prodColumns: Column<Product>[] = [
  { key: "name", label: "Nome" },
  { key: "category", label: "Categoria" },
  { key: "price", label: "Preço" },
];

// --- Variações ---
interface Variation { id: string; name: string; product: string }
const varColumns: Column<Variation>[] = [
  { key: "name", label: "Nome" },
  { key: "product", label: "Produto" },
];

// --- Adicionais ---
interface Addon { id: string; name: string; price: string }
const addonColumns: Column<Addon>[] = [
  { key: "name", label: "Nome" },
  { key: "price", label: "Preço" },
];

// --- Combos ---
interface Combo { id: string; name: string; price: string; items: number }
const comboColumns: Column<Combo>[] = [
  { key: "name", label: "Nome" },
  { key: "price", label: "Preço" },
  { key: "items", label: "Itens" },
];

type ModalType = "categoria" | "produto" | "variacao" | "adicional" | "combo" | null;

export default function Cardapio() {
  const [modal, setModal] = useState<ModalType>(null);

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
              <Button size="sm" onClick={() => setModal("categoria")}><Plus className="mr-1 h-4 w-4" />Nova</Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={catColumns} data={[]} searchKey="name" searchPlaceholder="Buscar categoria..." emptyMessage="Nenhuma categoria cadastrada." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Produtos</CardTitle>
              <Button size="sm" onClick={() => setModal("produto")}><Plus className="mr-1 h-4 w-4" />Novo</Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={prodColumns} data={[]} searchKey="name" searchPlaceholder="Buscar produto..." emptyMessage="Nenhum produto cadastrado." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variacoes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Variações</CardTitle>
              <Button size="sm" onClick={() => setModal("variacao")}><Plus className="mr-1 h-4 w-4" />Nova</Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={varColumns} data={[]} searchKey="name" searchPlaceholder="Buscar variação..." emptyMessage="Nenhuma variação cadastrada." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adicionais">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Adicionais</CardTitle>
              <Button size="sm" onClick={() => setModal("adicional")}><Plus className="mr-1 h-4 w-4" />Novo</Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={addonColumns} data={[]} searchKey="name" searchPlaceholder="Buscar adicional..." emptyMessage="Nenhum adicional cadastrado." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Combos</CardTitle>
              <Button size="sm" onClick={() => setModal("combo")}><Plus className="mr-1 h-4 w-4" />Novo</Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={comboColumns} data={[]} searchKey="name" searchPlaceholder="Buscar combo..." emptyMessage="Nenhum combo cadastrado." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal genérico de criação */}
      <FormModal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={
          modal === "categoria" ? "Nova Categoria" :
          modal === "produto" ? "Novo Produto" :
          modal === "variacao" ? "Nova Variação" :
          modal === "adicional" ? "Novo Adicional" :
          modal === "combo" ? "Novo Combo" : ""
        }
        onSubmit={() => setModal(null)}
      >
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input placeholder="Nome do item" />
          </div>
          {(modal === "produto" || modal === "adicional" || modal === "combo") && (
            <div>
              <Label>Preço (R$)</Label>
              <Input type="number" placeholder="0,00" step="0.01" />
            </div>
          )}
          {modal === "produto" && (
            <div>
              <Label>Categoria</Label>
              <Input placeholder="Selecione a categoria" />
            </div>
          )}
          {modal === "variacao" && (
            <div>
              <Label>Produto</Label>
              <Input placeholder="Selecione o produto" />
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
}
