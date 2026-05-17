import React from "react";
import { useListOccs } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function OccsList() {
  const { data: occs, isLoading } = useListOccs();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ordens de Compra</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas OCCs e rascunhos.</p>
        </div>
        <Button asChild>
          <Link href="/occs/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova OCC
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por número ou fornecedor..." className="pl-8" />
        </div>
        <Button variant="outline">Filtros</Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-[100px]">Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : occs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2 opacity-50" />
                      <p>Nenhuma OCC encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                occs?.map((occ) => (
                  <TableRow key={occ.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{occ.numero}</TableCell>
                    <TableCell>{occ.fornecedorNome || '-'}</TableCell>
                    <TableCell>{occ.setorNome || '-'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                        {occ.status}
                      </span>
                    </TableCell>
                    <TableCell>{occ.prioridade}</TableCell>
                    <TableCell className="text-right">
                      {occ.valorTotal != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(occ.valorTotal) : '-'}
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
