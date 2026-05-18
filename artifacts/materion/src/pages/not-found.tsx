import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <AlertTriangle className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground mb-6">A página que você procura não existe ou foi removida.</p>
      <Button asChild><Link href="/">Voltar ao Dashboard</Link></Button>
    </div>
  );
}
