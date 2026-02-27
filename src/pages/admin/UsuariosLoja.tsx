import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, Column } from "@/components/shared/DataTable";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

interface StoreUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const roleLabels: Record<string, string> = {
  admin_loja: "Admin",
  gerente: "Gerente",
  atendente: "Atendente",
  cozinha: "Cozinha",
  entregador: "Entregador",
  financeiro: "Financeiro",
};

const columns: Column<StoreUser>[] = [
  { key: "name", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "role", label: "Perfil", render: (u) => <Badge variant="outline">{roleLabels[u.role] ?? u.role}</Badge> },
  { key: "active", label: "Status", render: (u) => <Badge variant={u.active ? "default" : "secondary"}>{u.active ? "Ativo" : "Inativo"}</Badge> },
];

export default function UsuariosLoja() {
  const [showModal, setShowModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<StoreUser | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários da Loja</h1>
          <p className="text-muted-foreground">Gerencie usuários e permissões</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="mr-1 h-4 w-4" />Novo Usuário</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Equipe</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={[
              ...columns,
              {
                key: "actions",
                label: "",
                render: (u) => (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteUser(u); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ),
              },
            ]}
            data={[]}
            searchKey="name"
            searchPlaceholder="Buscar usuário..."
            emptyMessage="Nenhum usuário cadastrado."
          />
        </CardContent>
      </Card>

      <FormModal open={showModal} onClose={() => setShowModal(false)} title="Novo Usuário" onSubmit={() => setShowModal(false)}>
        <div className="space-y-3">
          <div><Label>Nome completo</Label><Input placeholder="Nome" /></div>
          <div><Label>E-mail</Label><Input type="email" placeholder="email@exemplo.com" /></div>
          <div><Label>Perfil</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {Object.entries(roleLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={() => setDeleteUser(null)}
        title="Remover Usuário"
        description={`Tem certeza que deseja remover ${deleteUser?.name ?? "este usuário"}?`}
        confirmLabel="Remover"
        variant="destructive"
      />
    </div>
  );
}
