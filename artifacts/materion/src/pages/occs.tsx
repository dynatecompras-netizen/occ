import { useState } from "react";
import { useOccs, useFornecedores, useCreateOcc, useUseTemplate, useTemplates } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FileText, Filter, X } from "lucide-react";
import { useLocation } from "wouter";
import { STATUS_CONFIG, STATUS_FLOW, PRIORIDADE_CONFIG, PRIORIDADES, type OccStatus, type Prioridade } from "@/lib/constants";
import { formatBRL, formatDate } from "@/lib/formatters";
import { toast } from "sonner";

export default function OccsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [, navigate] = useLocation();

  const params: Record<string, string> = { page: String(page), limit: "20" };
  if (search) params.search = search;
  if (statusFilter) params.status = statusFilter;
  if (prioridadeFilter) params.prioridade = prioridadeFilter;

  const { data: result, isLoading } = useOccs(params);
  const occs = result?.data ?? [];
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 max-w-7xl mx-auto flex flex-col h-full pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Ordens de Compra</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Gerencie suas OCCs e rascunhos.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Nova OCC</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por número..." className="pl-8" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
        {(statusFilter || prioridadeFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(""); setPrioridadeFilter(""); setPage(1); }}>
            <X className="h-3.5 w-3.5 mr-1" />Limpar
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_FLOW.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={prioridadeFilter} onValueChange={(v) => { setPrioridadeFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Desktop Table */}
      <Card className="flex-1 overflow-hidden flex-col hidden md:flex">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-[140px]">Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>))}</TableRow>
                ))
              ) : occs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2 opacity-50" />
                      <p>Nenhuma OCC encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                occs.map((occ: any) => {
                  const statusCfg = STATUS_CONFIG[occ.status as OccStatus];
                  const prioCfg = PRIORIDADE_CONFIG[occ.prioridade as Prioridade];
                  return (
                    <TableRow key={occ.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/occs/${occ.id}`)}>
                      <TableCell className="font-mono font-medium text-xs">{occ.numero}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{occ.fornecedorNome || "-"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg?.bg} ${statusCfg?.color}`}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusCfg?.dot }} />
                          {occ.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${prioCfg?.bg} ${prioCfg?.color} ${prioCfg?.pulse ? "animate-pulse" : ""}`}>
                          {occ.prioridade}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(occ.criadoEm)}</TableCell>
                      <TableCell className="text-right font-medium">{formatBRL(occ.valorTotal)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Página {page} de {totalPages} ({result?.total ?? 0} resultados)</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Mobile Card List */}
      <div className="flex-1 overflow-y-auto space-y-2 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : occs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground py-16">
            <FileText className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Nenhuma OCC encontrada</p>
          </div>
        ) : (
          occs.map((occ: any) => {
            const statusCfg = STATUS_CONFIG[occ.status as OccStatus];
            const prioCfg = PRIORIDADE_CONFIG[occ.prioridade as Prioridade];
            return (
              <Card key={occ.id} className="cursor-pointer hover:border-primary/50 active:bg-muted/70 transition-colors" onClick={() => navigate(`/occs/${occ.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-mono font-bold text-sm">{occ.numero}</div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg?.bg} ${statusCfg?.color}`}>{occ.status}</span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate mb-1">{occ.fornecedorNome || "Sem fornecedor"}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${prioCfg?.bg} ${prioCfg?.color}`}>{occ.prioridade}</span>
                    <span className="font-semibold text-sm">{formatBRL(occ.valorTotal)}</span>
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

// ─── Nova OCC Modal ──────────────────────────────────────────────────────────
function NovaOccModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mode, setMode] = useState<"zero" | "template">("zero");
  const [fornecedorId, setFornecedorId] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");
  const [templateId, setTemplateId] = useState("");
  const [, navigate] = useLocation();

  const { data: fornecedores } = useFornecedores({ ativo: "true" });
  const { data: templates } = useTemplates();
  const createOcc = useCreateOcc();
  const useTemplate = useUseTemplate();

  function handleCreate() {
    if (mode === "zero") {
      if (!fornecedorId) { toast.error("Selecione um fornecedor"); return; }
      createOcc.mutate(
        { fornecedorId: parseInt(fornecedorId), prioridade },
        { onSuccess: (data: any) => { onOpenChange(false); navigate(`/occs/${data.id}`); toast.success("OCC criada com sucesso!"); } },
      );
    } else {
      if (!templateId) { toast.error("Selecione um template"); return; }
      useTemplate.mutate(
        { id: parseInt(templateId), data: { fornecedorId: fornecedorId ? parseInt(fornecedorId) : undefined, prioridade } },
        { onSuccess: (data: any) => { onOpenChange(false); navigate(`/occs/${data.id}`); toast.success("OCC criada a partir do template!"); } },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nova Ordem de Compra</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <Button variant={mode === "zero" ? "default" : "outline"} size="sm" onClick={() => setMode("zero")}>Do Zero</Button>
            <Button variant={mode === "template" ? "default" : "outline"} size="sm" onClick={() => setMode("template")}>Usar Template</Button>
          </div>
          {mode === "template" && (
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Selecionar template..." /></SelectTrigger>
                <SelectContent>{templates?.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Fornecedor *</Label>
            <Select value={fornecedorId} onValueChange={setFornecedorId}>
              <SelectTrigger><SelectValue placeholder="Selecionar fornecedor..." /></SelectTrigger>
              <SelectContent>{fornecedores?.map((f: any) => <SelectItem key={f.id} value={String(f.id)}>{f.razaoSocial}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={createOcc.isPending || useTemplate.isPending}>
            {(createOcc.isPending || useTemplate.isPending) ? "Criando..." : "Criar OCC"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
