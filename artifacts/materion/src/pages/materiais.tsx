import { useState } from "react";
import { useMateriais, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, useCategorias } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Package, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { formatBRL, formatDecimal } from "@/lib/formatters";
import { CATEGORIAS, UNIDADES } from "@/lib/constants";
import { toast } from "sonner";

export default function MateriaisList() {
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [estoqueAlerta, setEstoqueAlerta] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (categoriaFilter) params.categoria = categoriaFilter;
  if (estoqueAlerta) params.estoqueAlerta = "true";
  const { data: materiais, isLoading } = useMateriais(params);
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial(editingId || 0);
  const deleteMaterial = useDeleteMaterial();

  function openCreate() { setEditingId(null); setFormData({ unidade: "un", estoqueAtual: 0, estoqueMinimo: 0 }); setFormOpen(true); }
  function openEdit(m: any) { setEditingId(m.id); setFormData({ ...m }); setFormOpen(true); }

  function handleSave() {
    const mutation = editingId ? updateMaterial : createMaterial;
    mutation.mutate(formData, {
      onSuccess: () => { setFormOpen(false); toast.success(editingId ? "Material atualizado!" : "Material cadastrado!"); },
      onError: (err: any) => toast.error(err.message),
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Materiais</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Catálogo de materiais e controle de estoque.</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1.5" />Novo Material</Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por nome ou código..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoriaFilter} onValueChange={(v) => setCategoriaFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={estoqueAlerta ? "default" : "outline"} size="sm" onClick={() => setEstoqueAlerta(!estoqueAlerta)}>
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />Alertas
        </Button>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-center">Unidade</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="text-right">Ref. Preço</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
            ) : !materiais?.length ? (
              <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground"><Package className="h-8 w-8 mx-auto mb-2 opacity-40" />Nenhum material encontrado</TableCell></TableRow>
            ) : materiais.map((m: any) => (
              <TableRow key={m.id} className={m.alertaEstoque ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                <TableCell className="font-mono text-xs">{m.codigo}</TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">{m.nome}</TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">{m.categoria || "-"}</Badge></TableCell>
                <TableCell className="text-center">{m.unidade}</TableCell>
                <TableCell className="text-right">
                  <span className={m.alertaEstoque ? "text-red-500 font-semibold" : ""}>{formatDecimal(m.estoqueAtual, 2)}</span>
                  {m.alertaEstoque && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{formatDecimal(m.estoqueMinimo, 2)}</TableCell>
                <TableCell className="text-right">{m.precoReferencia ? formatBRL(m.precoReferencia) : "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMaterial.mutate(m.id, { onSuccess: () => toast.success("Material removido"), onError: (err: any) => toast.error(err.message) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)
        : materiais?.map((m: any) => (
          <Card key={m.id} className={`cursor-pointer ${m.alertaEstoque ? "border-red-300" : ""}`} onClick={() => openEdit(m)}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm">{m.nome}</p>
                {m.alertaEstoque && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground font-mono">{m.codigo} · {m.categoria || "Sem categoria"}</p>
              <div className="flex justify-between mt-2 text-xs">
                <span>Estoque: <strong className={m.alertaEstoque ? "text-red-500" : ""}>{formatDecimal(m.estoqueAtual, 2)}</strong> {m.unidade}</span>
                {m.precoReferencia && <span>Ref: {formatBRL(m.precoReferencia)}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Material" : "Novo Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={formData.nome || ""} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Código *</Label><Input value={formData.codigo || ""} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Categoria</Label>
                <Select value={formData.categoria || ""} onValueChange={(v) => setFormData({ ...formData, categoria: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Nenhuma</SelectItem>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Unidade</Label>
                <Select value={formData.unidade || "un"} onValueChange={(v) => setFormData({ ...formData, unidade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Estoque Atual</Label><Input type="number" min="0" step="0.01" value={formData.estoqueAtual ?? ""} onChange={(e) => setFormData({ ...formData, estoqueAtual: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label>Estoque Mínimo</Label><Input type="number" min="0" step="0.01" value={formData.estoqueMinimo ?? ""} onChange={(e) => setFormData({ ...formData, estoqueMinimo: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label>Preço Ref.</Label><Input type="number" min="0" step="0.01" value={formData.precoReferencia ?? ""} onChange={(e) => setFormData({ ...formData, precoReferencia: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={formData.descricao || ""} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.nome || !formData.codigo || createMaterial.isPending || updateMaterial.isPending}>
              {(createMaterial.isPending || updateMaterial.isPending) ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
