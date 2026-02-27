import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Pedidos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Acompanhe e gerencie os pedidos</p>
      </div>

      <Tabs defaultValue="novos">
        <TabsList>
          <TabsTrigger value="novos">Novos</TabsTrigger>
          <TabsTrigger value="preparo">Em Preparo</TabsTrigger>
          <TabsTrigger value="prontos">Prontos</TabsTrigger>
          <TabsTrigger value="entregues">Entregues</TabsTrigger>
        </TabsList>
        <TabsContent value="novos">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Nenhum pedido novo.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preparo">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Nenhum pedido em preparo.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="prontos">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Nenhum pedido pronto.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="entregues">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Nenhum pedido entregue.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
