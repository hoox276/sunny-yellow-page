import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Clientes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Visualize e gerencie seus clientes</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Lista de Clientes</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Nenhum cliente cadastrado ainda.</p>
        </CardContent>
      </Card>
    </div>
  );
}
