import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function DataError() {
  const router = useRouter();
  return <div role="alert" className="space-y-3 py-8"><p>Não foi possível carregar os dados.</p><Button variant="outline" onClick={() => void router.invalidate()}>Tentar novamente</Button></div>;
}
export function DataNotFound() {
  return <p className="py-8 text-muted-foreground">Nenhum registro encontrado.</p>;
}