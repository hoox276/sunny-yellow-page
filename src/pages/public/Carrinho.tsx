import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Carrinho() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal, totalItems, couponCode, setCouponCode } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">Seu carrinho está vazio</p>
        <Button onClick={() => navigate(`/menu/${slug}`)}>Voltar ao cardápio</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 bg-background border-b px-4 py-3 z-10">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/menu/${slug}`)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-bold font-['Space_Grotesk']">Carrinho ({totalItems})</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 mt-4 space-y-3">
        {items.map((item) => {
          const itemTotal = (item.unitPrice + item.variations.reduce((s, v) => s + v.priceModifier, 0) + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity;
          return (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{item.productName}</h3>
                    {item.variations.length > 0 && <p className="text-xs text-muted-foreground">{item.variations.map((v) => v.optionName).join(", ")}</p>}
                    {item.addons.length > 0 && <p className="text-xs text-muted-foreground">+ {item.addons.map((a) => a.name).join(", ")}</p>}
                    {item.notes && <p className="text-xs text-muted-foreground italic">"{item.notes}"</p>}
                    <p className="text-sm font-bold text-primary mt-1">R$ {itemTotal.toFixed(2).replace(".", ",")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                    </Button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Separator />

        <div>
          <Label className="text-sm">Cupom de desconto</Label>
          <div className="flex gap-2 mt-1">
            <Input placeholder="Código do cupom" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
            <Button variant="outline" size="sm">Aplicar</Button>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2).replace(".", ",")}</span></div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="mx-auto max-w-lg">
          <Button className="w-full font-bold" size="lg" onClick={() => navigate(`/menu/${slug}/checkout`)}>
            Finalizar pedido • R$ {subtotal.toFixed(2).replace(".", ",")}
          </Button>
        </div>
      </div>
    </div>
  );
}
