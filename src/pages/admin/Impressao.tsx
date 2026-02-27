import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Impressao() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impressão</h1>
        <p className="text-muted-foreground">Configure impressão de comandas e setores de produção</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Impressoras</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Nenhuma impressora configurada.</p>
        </CardContent>
      </Card>
    </div>
  );
}
