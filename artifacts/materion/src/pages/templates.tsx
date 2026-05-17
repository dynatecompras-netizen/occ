import React, { useState } from "react";
import { useListTemplates, useListTemplatesFavoritos, useListTemplatesRecentes } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Star, Clock, FileText, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function TemplatesList() {
  const [tab, setTab] = useState("todos");
  const { data: todos, isLoading: loadingTodos } = useListTemplates();
  const { data: favoritos, isLoading: loadingFavoritos } = useListTemplatesFavoritos();
  const { data: recentes, isLoading: loadingRecentes } = useListTemplatesRecentes();

  const getTemplates = () => {
    if (tab === "favoritos") return { data: favoritos, loading: loadingFavoritos };
    if (tab === "recentes") return { data: recentes, loading: loadingRecentes };
    return { data: todos, loading: loadingTodos };
  };

  const { data, loading } = getTemplates();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Templates de OCC</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie templates para agilizar suas compras.</p>
        </div>
        <Button asChild>
          <Link href="/templates/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 shrink-0">
        <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="todos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="favoritos" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favoritos
            </TabsTrigger>
            <TabsTrigger value="recentes" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recentes
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar templates..." className="pl-8" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="flex-1">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : data?.length === 0 ? (
          <div className="col-span-full h-48 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            <FileText className="h-8 w-8 mb-2 opacity-50" />
            <p>Nenhum template encontrado</p>
          </div>
        ) : (
          data?.map((template) => (
            <Card key={template.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{template.nome}</CardTitle>
                  <Button variant="ghost" size="icon" className="-mt-1 -mr-2 h-8 w-8 shrink-0">
                    <Star className={`h-4 w-4 ${template.favorito ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </Button>
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {template.descricao || "Sem descrição."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <div className="flex flex-col gap-2">
                  <Badge variant="outline" className="w-fit">
                    {template.tipo === 'completo' ? 'Completo (com itens)' : 'Apenas Estrutura'}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Fornecedor:</span> {template.fornecedorPadraoNome || '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Usos:</span> {template.usoCount || 0}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button className="w-full" variant="secondary" asChild>
                  <Link href={`/templates/${template.id}`}>
                    Usar Template
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
