import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Usuarios() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">Todos os usuários da plataforma</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Lista de Usuários</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Nenhum usuário encontrado.</p></CardContent>
      </Card>
    </div>
  );
}
