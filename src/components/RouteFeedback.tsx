import { useRouter } from "@tanstack/react-router";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function DataError() {
  const router = useRouter();
  const { reset } = useQueryErrorResetBoundary();
  return <div role="alert" className="space-y-3 py-8"><p>Não foi possível carregar os dados.</p><Button variant="outline" onClick={() => { reset(); void router.invalidate(); }}>Tentar novamente</Button></div>;
}
export function DataNotFound() {
  return <p className="py-8 text-muted-foreground">Nenhum registro encontrado.</p>;
}