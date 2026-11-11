import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TablePager({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Paginação da tabela" className="mt-4 flex items-center justify-end gap-3 border-t pt-3">
      <Button variant="outline" size="icon" aria-label="Página anterior" disabled={page === 0} onClick={() => onPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
      <span className="text-sm text-muted-foreground">{page + 1} / {pages}</span>
      <Button variant="outline" size="icon" aria-label="Próxima página" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
    </nav>
  );
}