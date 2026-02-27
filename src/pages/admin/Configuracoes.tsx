import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configure seu estabelecimento</p>
      </div>

      <Tabs defaultValue="loja">
        <TabsList>
          <TabsTrigger value="loja">Loja</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
        </TabsList>
        <TabsContent value="loja">
          <Card>
            <CardHeader><CardTitle>Dados da Loja</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Configure nome, endereço, logo e informações do estabelecimento.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="horarios">
          <Card>
            <CardHeader><CardTitle>Horários de Funcionamento</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Defina os horários de abertura e fechamento.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pagamentos">
          <Card>
            <CardHeader><CardTitle>Formas de Pagamento</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Configure Pix, dinheiro, cartão na entrega.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="entregas">
          <Card>
            <CardHeader><CardTitle>Configurações de Entrega</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Defina taxas, raios de entrega e tempo estimado.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="equipe">
          <Card>
            <CardHeader><CardTitle>Equipe</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Gerencie operadores e permissões.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
