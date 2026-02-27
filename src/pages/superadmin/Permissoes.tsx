import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Permissoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Permissões</h1>
        <p className="text-muted-foreground">Gerencie permissões por perfil</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Matriz de Permissões</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Em breve.</p></CardContent>
      </Card>
    </div>
  );
}
