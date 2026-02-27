import { Store } from "lucide-react";
import { useParams } from "react-router-dom";

export default function CardapioPublico() {
  const { slug } = useParams();

  return (
    <div className="min-h-screen bg-background">
      {/* Header da loja */}
      <header className="bg-primary text-primary-foreground px-4 py-6">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Space_Grotesk']">Restaurante</h1>
            <p className="text-sm opacity-80">Cardápio digital • {slug}</p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-lg p-4 space-y-4">
        <p className="text-center text-muted-foreground py-12">
          Cardápio em construção. Em breve teremos itens disponíveis!
        </p>
      </main>

      {/* Rodapé */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Powered by MenuRápido
      </footer>
    </div>
  );
}
