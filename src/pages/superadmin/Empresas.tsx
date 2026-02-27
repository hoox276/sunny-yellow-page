import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Empresas() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">Gerencie todas as empresas da plataforma</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Nova Empresa</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Lista de Empresas</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Nenhuma empresa cadastrada.</p></CardContent>
      </Card>
    </div>
  );
}
