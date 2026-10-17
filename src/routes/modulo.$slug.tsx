import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { findLabel } from "@/lib/nav";

export const Route = createFileRoute("/modulo/$slug")({
  head: ({ params }) => {
    const t = `${findLabel(params.slug)} — Visão Ótica`;
    const d = `Módulo ${findLabel(params.slug)} do sistema de gestão para óticas.`;
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  component: Modulo,
});

function Modulo() {
  const { slug } = Route.useParams();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{findLabel(slug)}</h1>
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <Construction className="h-10 w-10 text-primary" />
        <p className="max-w-md text-muted-foreground">Esta tela ainda está em construção. Os registros deste módulo aparecerão aqui.</p>
        <Button asChild variant="outline"><Link to="/">Voltar ao painel</Link></Button>
      </Card>
    </div>
  );
}
