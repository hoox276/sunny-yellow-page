import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperConfiguracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configurações globais da plataforma</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Configurações Gerais</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Em breve.</p></CardContent>
      </Card>
    </div>
  );
}
