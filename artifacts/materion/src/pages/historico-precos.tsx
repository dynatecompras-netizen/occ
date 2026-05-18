import { useState } from "react";
import { usePrecoHistorico, useFornecedores, useMateriais } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Download, Search } from "lucide-react";
import { formatBRL, formatDate, formatVariacao } from "@/lib/formatters";

export default function HistoricoPrecos() {
  const [materialId, setMaterialId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");

  const params: Record<string, string> = {};
  if (materialId) params.materialId = materialId;
  if (fornecedorId) params.fornecedorId = fornecedorId;

  const { data: historico, isLoading } = usePrecoHistorico(params);
  const { data: materiais } = useMateriais();
  const { data: fornecedores } = useFornecedores({ ativo: "true" });

  function handleExportCSV() {
    const qs = new URLSearchParams(params).toString();
    window.open(`/api/preco-historico/export${qs ? `?${qs}` : ""}`, "_blank");
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Histórico de Preços</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Inteligência de preços e variações ao longo do tempo.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1.5" />Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={materialId} onValueChange={(v) => setMaterialId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar por material" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os materiais</SelectItem>
            {materiais?.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fornecedorId} onValueChange={(v) => setFornecedorId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar por fornecedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os fornecedores</SelectItem>
            {fornecedores?.map((f: any) => <SelectItem key={f.id} value={String(f.id)}>{f.razaoSocial}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
            ) : !historico?.length ? (
              <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />Nenhum registro encontrado
              </TableCell></TableRow>
            ) : historico.map((h: any) => {
              const v = formatVariacao(h.variacao);
              return (
                <TableRow key={h.id}>
                  <TableCell className="text-sm">{formatDate(h.criadoEm)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{h.materialNome || "-"}</p>
                      <p className="text-xs text-muted-foreground font-mono">{h.materialCodigo}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{h.fornecedorNome || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">{formatBRL(h.preco)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{h.quantidade ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center gap-1 font-medium ${v.color}`}>
                      {h.variacao != null && (
                        h.variacao > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : h.variacao < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />
                      )}
                      {v.text}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {isLoading ? Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)
        : historico?.map((h: any) => {
          const v = formatVariacao(h.variacao);
          return (
            <Card key={h.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-medium text-sm">{h.materialNome}</p>
                    <p className="text-xs text-muted-foreground">{h.fornecedorNome}</p>
                  </div>
                  <span className={`text-sm font-semibold ${v.color}`}>{v.text}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>{formatDate(h.criadoEm)}</span>
                  <span className="font-semibold text-foreground text-sm">{formatBRL(h.preco)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
