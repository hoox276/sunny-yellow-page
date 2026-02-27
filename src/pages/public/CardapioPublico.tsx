import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart, CartItem } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FormModal } from "@/components/shared/FormModal";
import { Store, Search, ShoppingCart, Plus, Minus, Clock, MapPin } from "lucide-react";

interface Company { id: string; name: string; logo_url: string | null; slug: string; is_active: boolean }
interface Category { id: string; name: string; sort_order: number }
interface Product {
  id: string; name: string; description: string | null; price: number;
  image_urls: string[]; category_id: string; is_featured: boolean;
}

export default function CardapioPublico() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, totalItems, subtotal } = useCart();
  const [company, setCompany] = useState<Company | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemNotes, setItemNotes] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: comp } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", slug ?? "")
        .single();
      if (comp) {
        setCompany(comp);
        const [{ data: cats }, { data: prods }] = await Promise.all([
          supabase.from("categories").select("*").eq("company_id", comp.id).eq("is_active", true).order("sort_order"),
          supabase.from("products").select("*").eq("company_id", comp.id).eq("is_active", true).order("sort_order"),
        ]);
        setCategories(cats ?? []);
        setProducts(prods ?? []);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCat || p.category_id === selectedCat;
    return matchSearch && matchCat;
  });

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const item: CartItem = {
      id: crypto.randomUUID(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unitPrice: Number(selectedProduct.price),
      quantity: itemQty,
      variations: [],
      addons: [],
      notes: itemNotes,
      imageUrl: selectedProduct.image_urls?.[0],
    };
    addItem(item);
    setSelectedProduct(null);
    setItemNotes("");
    setItemQty(1);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!company) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Loja não encontrada.</p></div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-5">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
            {company.logo_url ? <img src={company.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <Store className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-['Space_Grotesk']">{company.name}</h1>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <Badge variant="secondary" className="text-xs bg-primary-foreground/20 text-primary-foreground border-0">
                {company.is_active ? "Aberto" : "Fechado"}
              </Badge>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 30-45 min</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 space-y-4 mt-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar no cardápio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button size="sm" variant={!selectedCat ? "default" : "outline"} className="shrink-0" onClick={() => setSelectedCat(null)}>Todos</Button>
            {categories.map((cat) => (
              <Button key={cat.id} size="sm" variant={selectedCat === cat.id ? "default" : "outline"} className="shrink-0" onClick={() => setSelectedCat(cat.id)}>
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {/* Products */}
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Nenhum item disponível no momento.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedProduct(product); setItemQty(1); setItemNotes(""); }}>
                <CardContent className="p-3 flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      {product.is_featured && <Badge variant="default" className="text-[10px] shrink-0">Destaque</Badge>}
                    </div>
                    {product.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>}
                    <p className="text-sm font-bold text-primary mt-1">R$ {Number(product.price).toFixed(2).replace(".", ",")}</p>
                  </div>
                  {product.image_urls?.[0] && (
                    <img src={product.image_urls[0]} alt={product.name} className="h-20 w-20 rounded-lg object-cover shrink-0" loading="lazy" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <FormModal open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name ?? ""} onSubmit={handleAddToCart} submitLabel={`Adicionar • R$ ${((Number(selectedProduct?.price ?? 0)) * itemQty).toFixed(2).replace(".", ",")}`}>
        {selectedProduct && (
          <div className="space-y-4">
            {selectedProduct.image_urls?.[0] && <img src={selectedProduct.image_urls[0]} alt="" className="w-full h-48 object-cover rounded-lg" />}
            {selectedProduct.description && <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>}
            <p className="text-lg font-bold text-primary">R$ {Number(selectedProduct.price).toFixed(2).replace(".", ",")}</p>

            <Separator />
            <div>
              <label className="text-sm font-medium">Observação</label>
              <Input placeholder="Ex: sem cebola, bem passado..." value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} />
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setItemQty(Math.max(1, itemQty - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="text-lg font-bold w-8 text-center">{itemQty}</span>
              <Button variant="outline" size="icon" onClick={() => setItemQty(itemQty + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </FormModal>

      {/* Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 shadow-lg z-50">
          <div className="mx-auto max-w-lg">
            <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold" onClick={() => navigate(`/menu/${slug}/carrinho`)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver Carrinho ({totalItems}) • R$ {subtotal.toFixed(2).replace(".", ",")}
            </Button>
          </div>
        </div>
      )}

      <footer className="border-t py-4 text-center text-xs text-muted-foreground mt-8">
        Powered by MenuRápido
      </footer>
    </div>
  );
}
