import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Shield, AlertTriangle, Info } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resource_id: string | null;
  user_id: string | null;
  company_id: string | null;
  reason: string | null;
  created_at: string;
  old_value: any;
  new_value: any;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-success/10 text-success",
  update: "bg-warning/10 text-warning",
  delete: "bg-destructive/10 text-destructive",
  cancel: "bg-destructive/10 text-destructive",
  login: "bg-primary/10 text-primary",
};

export default function Auditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (search) query = query.or(`resource.ilike.%${search}%,reason.ilike.%${search}%`);

      const { data } = await query;
      setLogs(data ?? []);
      setLoading(false);
    };
    load();
  }, [page, actionFilter, search]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoria</h1>
        <p className="text-muted-foreground">Logs de ações críticas na plataforma</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por recurso ou motivo..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="create">Criar</SelectItem>
            <SelectItem value="update">Atualizar</SelectItem>
            <SelectItem value="delete">Excluir</SelectItem>
            <SelectItem value="cancel">Cancelar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-sm p-6">Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-sm p-6">Nenhum log encontrado.</p>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground"} variant="secondary">
                        {log.action}
                      </Badge>
                      <span className="font-medium text-sm">{log.resource}</span>
                      {log.resource_id && <span className="text-xs text-muted-foreground font-mono">#{log.resource_id.slice(0, 8)}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</span>
                  </div>
                  {log.reason && <p className="text-xs text-muted-foreground mt-1">Motivo: {log.reason}</p>}
                  {log.user_id && <p className="text-xs text-muted-foreground mt-0.5">Usuário: {log.user_id.slice(0, 8)}...</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <span className="text-sm text-muted-foreground">Página {page + 1}</span>
        <Button variant="outline" size="sm" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(page + 1)}>
          Próxima <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
