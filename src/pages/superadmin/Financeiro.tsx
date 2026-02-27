import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Financeiro() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Faturamento e cobranças da plataforma</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Resumo Financeiro</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Em breve.</p></CardContent>
      </Card>
    </div>
  );
}
