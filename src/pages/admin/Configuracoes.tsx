import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configure seu estabelecimento</p>
      </div>

      <Tabs defaultValue="loja">
        <TabsList className="flex-wrap">
          <TabsTrigger value="loja">Dados da Loja</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="entrega">Taxa Padrão</TabsTrigger>
          <TabsTrigger value="visual">Identidade Visual</TabsTrigger>
          <TabsTrigger value="link">Link e QR Code</TabsTrigger>
        </TabsList>

        <TabsContent value="loja">
          <Card>
            <CardHeader><CardTitle>Dados da Loja</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Nome da loja</Label><Input placeholder="Minha Loja" /></div>
                <div><Label>Telefone</Label><Input placeholder="(00) 00000-0000" /></div>
                <div><Label>E-mail</Label><Input type="email" placeholder="loja@email.com" /></div>
                <div><Label>Endereço</Label><Input placeholder="Rua, número, bairro" /></div>
              </div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios">
          <Card>
            <CardHeader><CardTitle>Horários de Funcionamento</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">{day}</span>
                  <Input className="w-24" placeholder="08:00" />
                  <span className="text-muted-foreground">às</span>
                  <Input className="w-24" placeholder="22:00" />
                </div>
              ))}
              <Button className="mt-2">Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos">
          <Card>
            <CardHeader><CardTitle>Formas de Pagamento</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito"].map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <input type="checkbox" id={m} className="rounded" />
                    <label htmlFor={m} className="text-sm">{m}</label>
                  </div>
                ))}
                <Separator />
                <div><Label>Chave Pix</Label><Input placeholder="Sua chave Pix" /></div>
                <Button>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entrega">
          <Card>
            <CardHeader><CardTitle>Taxa Padrão de Entrega</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Taxa padrão (R$)</Label><Input type="number" placeholder="5,00" step="0.01" /></div>
              <div><Label>Tempo estimado padrão</Label><Input placeholder="30-45 min" /></div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual">
          <Card>
            <CardHeader><CardTitle>Identidade Visual</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Logo (URL)</Label><Input placeholder="https://..." /></div>
              <div><Label>Cor primária</Label><Input type="color" className="w-16 h-10" /></div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link">
          <Card>
            <CardHeader><CardTitle>Link Público e QR Code</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Slug do cardápio</Label>
                <Input placeholder="minha-loja" />
                <p className="text-xs text-muted-foreground mt-1">O link ficará: /menu/minha-loja</p>
              </div>
              <div className="flex items-center justify-center h-48 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-sm">QR Code será gerado aqui</p>
              </div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
