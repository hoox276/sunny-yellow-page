import { Sun } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Sun className="mb-6 h-20 w-20 text-foreground animate-spin" style={{ animationDuration: "8s" }} />
      <h1 className="mb-3 text-5xl font-extrabold tracking-tight text-foreground">
        Página Amarela ☀️
      </h1>
      <p className="text-lg text-muted-foreground max-w-md text-center">
        Simples, bonita e gastando menos de 1 crédito.
      </p>
    </div>
  );
};

export default Index;
