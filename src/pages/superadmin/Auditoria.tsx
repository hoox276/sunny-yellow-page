import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Auditoria() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoria</h1>
        <p className="text-muted-foreground">Logs de ações críticas na plataforma</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Logs de Auditoria</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Nenhum log registrado.</p></CardContent>
      </Card>
    </div>
  );
}
