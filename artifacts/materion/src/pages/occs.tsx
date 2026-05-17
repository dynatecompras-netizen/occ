import React, { useState } from "react";
import { useListOccs } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { NovaOccModal } from "@/components/nova-occ-modal";
import { Badge } from "@/components/ui/badge";

function statusVariant(status: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    Rascunho: { bg: "bg-slate-100", text: "text-slate-700" },
    Aberta: { bg: "bg-blue-100", text: "text-blue-700" },
    Aprovada: { bg: "bg-green-100", text: "text-green-700" },
    Enviada: { bg: "bg-purple-100", text: "text-purple-700" },
    "Concluída": { bg: "bg-emerald-100", text: "text-emerald-700" },
    Cancelada: { bg: "bg-red-100", text: "text-red-700" },
  };
  return map[status] ?? { bg: "bg-gray-100", text: "text-gray-700" };
}

function prioridadeVariant(p: string) {
  if (p === "Urgente") return "bg-red-100 text-red-700";
  if (p === "Alta") return "bg-orange-100 text-orange-700";
  if (p === "Normal") return "bg-gray-100 text-gray-600";
  return "bg-gray-50 text-gray-500";
}

export default function OccsList() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [, navigate] = useLocation();
  const { data: occs, isLoading } = useListOccs({ search: search || undefined });

  const fmt = (v: number | null | undefined) =>
    v != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) : "-";

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Ordens de Compra</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Gerencie suas OCCs e rascunhos.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm" className="md:text-sm">
          <Plus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Nova OCC</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por número..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </div>

      {/* Desktop Table */}
      <Card className="flex-1 overflow-hidden flex-col hidden md:flex">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-[130px]">Número</TableHead>
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
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : occs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2 opacity-50" />
                      <p>Nenhuma OCC encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                occs?.map((occ) => {
                  const sv = statusVariant(occ.status);
                  return (
                    <TableRow
                      key={occ.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/occs/${occ.id}`)}
                    >
                      <TableCell className="font-mono font-medium text-xs">{occ.numero}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{occ.fornecedorNome || '-'}</TableCell>
                      <TableCell>{occ.setorNome || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${sv.bg} ${sv.text}`}>
                          {occ.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${prioridadeVariant(occ.prioridade)}`}>
                          {occ.prioridade}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(occ.valorTotal)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile Card List */}
      <div className="flex-1 overflow-y-auto space-y-2 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : occs?.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground py-16">
            <FileText className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Nenhuma OCC encontrada</p>
          </div>
        ) : (
          occs?.map((occ) => {
            const sv = statusVariant(occ.status);
            return (
              <Card
                key={occ.id}
                className="cursor-pointer hover:border-primary/50 active:bg-muted/70 transition-colors"
                onClick={() => navigate(`/occs/${occ.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-mono font-bold text-sm">{occ.numero}</div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sv.bg} ${sv.text}`}>
                      {occ.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate mb-1">
                    {occ.fornecedorNome || "Sem fornecedor"}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {occ.setorNome && (
                        <span className="text-xs text-muted-foreground">{occ.setorNome}</span>
                      )}
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${prioridadeVariant(occ.prioridade)}`}>
                        {occ.prioridade}
                      </span>
                    </div>
                    <span className="font-semibold text-sm">{fmt(occ.valorTotal)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <NovaOccModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
