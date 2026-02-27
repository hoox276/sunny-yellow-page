import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Entregas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Entregas</h1>
        <p className="text-muted-foreground">Gerencie entregas, retiradas e consumo local</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Entregas em andamento</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Nenhuma entrega em andamento.</p>
        </CardContent>
      </Card>
    </div>
  );
}
