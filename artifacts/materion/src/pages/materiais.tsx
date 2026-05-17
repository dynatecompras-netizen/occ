import React, { useState } from "react";
import { useListMateriais, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, getListMateriaisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Box, MoreVertical, Edit, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function MateriaisList() {
  const { data: materiais, isLoading } = useListMateriais();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteMaterial();

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este material?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Material excluído com sucesso." });
          queryClient.invalidateQueries({ queryKey: getListMateriaisQueryKey() });
        },
        onError: () => {
          toast({ title: "Erro", description: "Erro ao excluir material.", variant: "destructive" });
        }
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Materiais</h1>
          <p className="text-sm text-muted-foreground">Catálogo de materiais e histórico de preços.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Material
        </Button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar materiais..." className="pl-8" />
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : materiais?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Box className="h-8 w-8 mb-2 opacity-50" />
                      <p>Nenhum material encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                materiais?.map((material) => (
                  <TableRow key={material.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{material.nome}</TableCell>
                    <TableCell>{material.unidade}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={material.descricao || ''}>
                      {material.descricao || '-'}
                    </TableCell>
                    <TableCell>
                      {material.ativo ? (
                        <span className="text-green-600 font-medium text-sm">Ativo</span>
                      ) : (
                        <span className="text-muted-foreground font-medium text-sm">Inativo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(material.id)} className="text-destructive">
                            <Trash className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
