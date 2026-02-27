import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Neighborhood { id: string; name: string; fee: number; estimated_time: string | null }

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, subtotal, discount, clearCart } = useCart();

  const [companyId, setCompanyId] = useState<string>("");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [orderType, setOrderType] = useState<"entrega" | "retirada" | "local">("entrega");
  const [address, setAddress] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [addressRef, setAddressRef] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "dinheiro" | "cartao_entrega">("pix");
  const [changeFor, setChangeFor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedNeighborhood = neighborhoods.find((n) => n.id === neighborhoodId);
  const deliveryFee = orderType === "entrega" ? Number(selectedNeighborhood?.fee ?? 0) : 0;
  const total = subtotal + deliveryFee - discount;

  useEffect(() => {
    const load = async () => {
      const { data: comp } = await supabase.from("companies").select("id").eq("slug", slug ?? "").single();
      if (comp) {
        setCompanyId(comp.id);
        const { data: hoods } = await supabase.from("neighborhoods").select("*").eq("company_id", comp.id).eq("is_active", true);
        setNeighborhoods(hoods ?? []);
      }
    };
    load();
  }, [slug]);

  const handleSubmit = async () => {
    if (!name.trim() || !whatsapp.trim()) {
      toast({ title: "Preencha nome e WhatsApp", variant: "destructive" });
      return;
    }
    if (orderType === "entrega" && (!address.trim() || !neighborhoodId)) {
      toast({ title: "Preencha endereço e bairro", variant: "destructive" });
      return;
    }
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        company_id: companyId,
        customer_name: name.trim(),
        customer_whatsapp: whatsapp.trim(),
        type: orderType,
        status: "novo",
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        payment_method: paymentMethod,
        change_for: paymentMethod === "dinheiro" ? Number(changeFor) || null : null,
        address: orderType === "entrega" ? address.trim() : null,
        neighborhood_id: orderType === "entrega" ? neighborhoodId : null,
        address_reference: orderType === "entrega" ? addressRef.trim() || null : null,
      }).select("id, order_number").single();

      if (error) throw error;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        variations: JSON.parse(JSON.stringify(item.variations)),
        addons: JSON.parse(JSON.stringify(item.addons)),
        notes: item.notes || null,
        total: (item.unitPrice + item.variations.reduce((s, v) => s + v.priceModifier, 0) + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity,
      }));

      await supabase.from("order_items").insert(orderItems);
      await supabase.from("order_status_history").insert({ order_id: order.id, to_status: "novo" as const });

      clearCart();
      navigate(`/menu/${slug}/pedido/${order.id}`);
    } catch (err: any) {
      toast({ title: "Erro ao criar pedido", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate(`/menu/${slug}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 bg-background border-b px-4 py-3 z-10">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/menu/${slug}/carrinho`)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-bold font-['Space_Grotesk']">Finalizar Pedido</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 mt-4 space-y-4">
        {/* Dados do cliente */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Seus dados</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Nome</Label><Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>WhatsApp</Label><Input placeholder="(00) 00000-0000" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
          </CardContent>
        </Card>

        {/* Tipo do pedido */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tipo do pedido</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as any)}>
              <div className="flex items-center gap-2"><RadioGroupItem value="entrega" id="entrega" /><Label htmlFor="entrega">Entrega</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="retirada" id="retirada" /><Label htmlFor="retirada">Retirada</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="local" id="local" /><Label htmlFor="local">Consumo no local</Label></div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Endereço (se entrega) */}
        {orderType === "entrega" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Endereço de entrega</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Endereço</Label><Input placeholder="Rua, número" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              <div>
                <Label>Bairro</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={neighborhoodId} onChange={(e) => setNeighborhoodId(e.target.value)}>
                  <option value="">Selecione o bairro</option>
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.id}>{n.name} - R$ {Number(n.fee).toFixed(2).replace(".", ",")}</option>
                  ))}
                </select>
              </div>
              <div><Label>Referência</Label><Input placeholder="Ponto de referência" value={addressRef} onChange={(e) => setAddressRef(e.target.value)} /></div>
            </CardContent>
          </Card>
        )}

        {/* Pagamento */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Pagamento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <div className="flex items-center gap-2"><RadioGroupItem value="pix" id="pix" /><Label htmlFor="pix">Pix</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="dinheiro" id="dinheiro" /><Label htmlFor="dinheiro">Dinheiro</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="cartao_entrega" id="cartao" /><Label htmlFor="cartao">Cartão na entrega</Label></div>
            </RadioGroup>
            {paymentMethod === "dinheiro" && (
              <div><Label>Troco para</Label><Input type="number" placeholder="0,00" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} /></div>
            )}
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2).replace(".", ",")}</span></div>
            {orderType === "entrega" && <div className="flex justify-between"><span className="text-muted-foreground">Taxa de entrega</span><span>R$ {deliveryFee.toFixed(2).replace(".", ",")}</span></div>}
            {discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="text-success">-R$ {discount.toFixed(2).replace(".", ",")}</span></div>}
            <Separator />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>R$ {total.toFixed(2).replace(".", ",")}</span></div>
          </CardContent>
        </Card>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="mx-auto max-w-lg">
          <Button className="w-full font-bold" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : `Enviar Pedido • R$ ${total.toFixed(2).replace(".", ",")}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
