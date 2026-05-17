import React from "react";
import { useListFornecedores } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FornecedoresList() {
  const { data: fornecedores, isLoading } = useListFornecedores();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua base de fornecedores.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por nome ou CNPJ..." className="pl-8" />
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : fornecedores?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Building2 className="h-8 w-8 mb-2 opacity-50" />
                      <p>Nenhum fornecedor encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                fornecedores?.map((fornecedor) => (
                  <TableRow key={fornecedor.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                    <TableCell>{fornecedor.cnpj}</TableCell>
                    <TableCell>{fornecedor.email || '-'}</TableCell>
                    <TableCell>{fornecedor.telefone || '-'}</TableCell>
                    <TableCell>
                      {fornecedor.ativo ? (
                        <span className="text-green-600 font-medium text-sm">Ativo</span>
                      ) : (
                        <span className="text-muted-foreground font-medium text-sm">Inativo</span>
                      )}
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
