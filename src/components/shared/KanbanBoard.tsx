import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface KanbanColumn<T> {
  id: string;
  label: string;
  color: string;
  items: T[];
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T) => React.ReactNode;
  onCardClick?: (item: T) => void;
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  onCardClick,
}: KanbanBoardProps<T>) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {columns.map((col) => (
          <div key={col.id} className="w-72 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-sm font-semibold">{col.label}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {col.items.length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[200px] rounded-lg bg-muted/30 p-2">
              {col.items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum pedido</p>
              ) : (
                col.items.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onCardClick?.(item)}
                  >
                    <CardContent className="p-3">{renderCard(item)}</CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
