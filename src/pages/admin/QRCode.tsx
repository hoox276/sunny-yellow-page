import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function QRCodePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR Code</h1>
        <p className="text-muted-foreground">Gere QR Codes para o cardápio digital</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Seus QR Codes</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Configure o cardápio primeiro para gerar QR Codes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
