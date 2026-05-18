import React, { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useOcc, usePatchOccStatus, useDuplicateOcc, useCreateOccItem, useUpdateOccItem, useDeleteOccItem, useMateriais, useFornecedores, useUpdateOcc } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Copy, Plus, Trash2, Edit2, Check, X, ChevronRight, Building2, Calendar, Tag, AlertTriangle, Package, Clock, FileDown } from "lucide-react";
import { STATUS_CONFIG, STATUS_FLOW, PRIORIDADE_CONFIG, PRIORIDADES, UNIDADES, type OccStatus, type Prioridade } from "@/lib/constants";
import { formatBRL, formatDate, formatDateTime } from "@/lib/formatters";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as OccStatus];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${cfg?.bg || "bg-gray-100"} ${cfg?.color || "text-gray-600"}`}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg?.dot || "#94a3b8" }} />
      {status}
    </span>
  );
}

function StatusTimeline({ current }: { current: string }) {
  const currentIdx = STATUS_FLOW.indexOf(current as OccStatus);
  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex items-center min-w-max gap-0">
        {STATUS_FLOW.map((s, i) => {
          const cfg = STATUS_CONFIG[s];
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done ? "bg-primary border-primary text-primary-foreground"
                  : active ? `border-current ${cfg.color} ring-4 ring-offset-1 ring-primary/20` : "bg-muted border-border text-muted-foreground"
                }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.dot }} />}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${active ? cfg.color : done ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
              </div>
              {i < STATUS_FLOW.length - 1 && <div className={`h-0.5 w-6 sm:w-10 mx-0.5 mt-[-14px] ${done ? "bg-primary" : "bg-border"}`} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function OccDetail() {
  const { id } = useParams<{ id: string }>();
  const occId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const { data: occ, isLoading } = useOcc(occId);
  const patchStatus = usePatchOccStatus(occId);
  const duplicateOcc = useDuplicateOcc();
  const updateItem = useUpdateOccItem(occId);
  const deleteItem = useDeleteOccItem(occId);

  const valorTotal = occ?.itens?.reduce((s: number, i: any) => s + (i.quantidade * i.precoUnitario), 0) ?? 0;
  const currentIdx = STATUS_FLOW.indexOf(occ?.status as OccStatus);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!occ) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-6">
        <AlertTriangle className="h-10 w-10" />
        <p className="text-lg font-medium">OCC não encontrada</p>
        <Button variant="outline" asChild><Link href="/occs">Voltar para OCCs</Link></Button>
      </div>
    );
  }

  const prioCfg = PRIORIDADE_CONFIG[occ.prioridade as Prioridade];

  return (
    <div className="flex flex-col h-full pb-20 md:pb-0">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b px-4 md:px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" asChild><Link href="/occs"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-base md:text-lg truncate">{occ.numero}</span>
            <StatusBadge status={occ.status} />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prioCfg?.bg} ${prioCfg?.color} ${prioCfg?.pulse ? "animate-pulse" : ""}`}>{occ.prioridade}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => duplicateOcc.mutate(occId, {
            onSuccess: (data: any) => { navigate(`/occs/${data.id}`); toast.success("OCC duplicada!"); },
          })}><Copy className="h-3.5 w-3.5 mr-1.5" />Duplicar</Button>
          {occ.status !== "Rascunho" && (
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => window.open(`/api/occs/${occId}/pdf`, "_blank")}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
          )}
          {nextStatus && (
            <Button size="sm" onClick={() => setStatusOpen(true)}>
              <ChevronRight className="h-3.5 w-3.5 mr-1" />{nextStatus}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
          {/* Status Timeline */}
          <Card>
            <CardContent className="px-4 md:px-6 py-4">
              <StatusTimeline current={occ.status} />
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground uppercase">Fornecedor</span></div>
              <p className="font-semibold text-sm truncate">{occ.fornecedorNome || occ.fornecedor?.razaoSocial || "-"}</p>
              {occ.fornecedor?.cnpj && <p className="text-xs text-muted-foreground">{occ.fornecedor.cnpj}</p>}
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground uppercase">Datas</span></div>
              <p className="font-semibold text-sm">Criado: {formatDate(occ.criadoEm)}</p>
              {occ.dataEntrega && <p className="text-xs text-muted-foreground">Entrega: {formatDate(occ.dataEntrega)}</p>}
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><Package className="h-4 w-4 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground uppercase">Itens</span></div>
              <p className="font-bold text-lg">{occ.itens?.length || 0}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><Tag className="h-4 w-4 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground uppercase">Valor Total</span></div>
              <p className="font-bold text-lg text-foreground">{valorTotal > 0 ? formatBRL(valorTotal) : "-"}</p>
            </CardContent></Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="itens">
            <TabsList>
              <TabsTrigger value="itens">Itens ({occ.itens?.length || 0})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            </TabsList>

            {/* Items Tab */}
            <TabsContent value="itens">
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Itens da OCC</CardTitle>
                  {["Rascunho", "Em Negociação"].includes(occ.status) && (
                    <Button size="sm" onClick={() => setAddItemOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Adicionar</Button>
                  )}
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  {!occ.itens?.length ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Package className="h-8 w-8 mb-2 opacity-40" />
                      <p className="text-sm">Nenhum item adicionado.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Código</TableHead>
                              <TableHead>Material</TableHead>
                              <TableHead className="text-center">Qtd</TableHead>
                              <TableHead className="text-center">Un</TableHead>
                              <TableHead className="text-right">Preço Unit.</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                              <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {occ.itens.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.materialCodigo || "-"}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{item.materialNome || "-"}</TableCell>
                                <TableCell className="text-center">
                                  {editingItemId === item.id ? (
                                    <Input type="number" className="w-20 h-7 text-center" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
                                  ) : item.quantidade}
                                </TableCell>
                                <TableCell className="text-center">{item.unidade}</TableCell>
                                <TableCell className="text-right">
                                  {editingItemId === item.id ? (
                                    <Input type="number" className="w-24 h-7 text-right" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                                  ) : formatBRL(item.precoUnitario)}
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatBRL(item.quantidade * item.precoUnitario)}</TableCell>
                                <TableCell>
                                  {editingItemId === item.id ? (
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                        updateItem.mutate({ itemId: item.id, data: { quantidade: parseFloat(editQty), precoUnitario: parseFloat(editPrice) } },
                                          { onSuccess: () => { setEditingItemId(null); toast.success("Item atualizado"); } });
                                      }}><Check className="h-3.5 w-3.5" /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingItemId(null)}><X className="h-3.5 w-3.5" /></Button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItemId(item.id); setEditQty(String(item.quantidade)); setEditPrice(String(item.precoUnitario)); }}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      {["Rascunho", "Em Negociação"].includes(occ.status) && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem.mutate(item.id, { onSuccess: () => toast.success("Item removido") })}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {/* Mobile Cards */}
                      <div className="md:hidden divide-y divide-border">
                        {occ.itens.map((item: any) => (
                          <div key={item.id} className="p-4 space-y-2">
                            <div className="flex justify-between">
                              <div><p className="font-medium text-sm">{item.materialNome}</p><p className="text-xs text-muted-foreground font-mono">{item.materialCodigo}</p></div>
                              <p className="font-semibold text-sm">{formatBRL(item.quantidade * item.precoUnitario)}</p>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Qtd: {item.quantidade} {item.unidade}</span>
                              <span>P.Unit: {formatBRL(item.precoUnitario)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Total */}
                      <div className="flex justify-between items-center px-4 md:px-6 py-4 border-t bg-muted/30 font-bold">
                        <span>Total Geral</span>
                        <span className="text-lg">{formatBRL(valorTotal)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <Card>
                <CardContent className="p-4 md:p-6">
                  {!occ.timeline?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro na timeline.</p>
                  ) : (
                    <div className="space-y-4">
                      {occ.timeline.map((entry: any) => {
                        const cfg = STATUS_CONFIG[entry.statusNovo as OccStatus];
                        return (
                          <div key={entry.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cfg?.dot || "#94a3b8"}20` }}>
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cfg?.dot || "#94a3b8" }} />
                              </div>
                              <div className="w-0.5 flex-1 bg-border mt-1" />
                            </div>
                            <div className="pb-4 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <StatusBadge status={entry.statusNovo} />
                                {entry.statusAnterior && <span className="text-xs text-muted-foreground">← {entry.statusAnterior}</span>}
                              </div>
                              {entry.comentario && <p className="text-sm mt-1">{entry.comentario}</p>}
                              <p className="text-xs text-muted-foreground mt-1">{formatDateTime(entry.criadoEm)} · {entry.usuario}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* General Data Tab */}
            <TabsContent value="dados">
              <Card>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">Número</Label><p className="font-mono font-semibold">{occ.numero}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Status</Label><p><StatusBadge status={occ.status} /></p></div>
                    <div><Label className="text-xs text-muted-foreground">Prioridade</Label><p className={`font-medium ${prioCfg?.color}`}>{occ.prioridade}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Fornecedor</Label><p className="font-medium">{occ.fornecedorNome || "-"}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Data de Criação</Label><p>{formatDateTime(occ.criadoEm)}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Data de Entrega</Label><p>{formatDate(occ.dataEntrega)}</p></div>
                  </div>
                  {occ.observacoes && (
                    <div><Label className="text-xs text-muted-foreground">Observações</Label><p className="text-sm mt-1 whitespace-pre-wrap">{occ.observacoes}</p></div>
                  )}
                  {occ.fornecedor && (
                    <div className="border rounded-lg p-4 mt-4">
                      <h3 className="text-sm font-semibold mb-2">Dados do Fornecedor</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Razão Social:</span> {occ.fornecedor.razaoSocial}</div>
                        <div><span className="text-muted-foreground">CNPJ:</span> {occ.fornecedor.cnpj}</div>
                        <div><span className="text-muted-foreground">Telefone:</span> {occ.fornecedor.telefone || "-"}</div>
                        <div><span className="text-muted-foreground">Email:</span> {occ.fornecedor.email || "-"}</div>
                        <div className="sm:col-span-2"><span className="text-muted-foreground">Endereço:</span> {[occ.fornecedor.endereco, occ.fornecedor.cidade, occ.fornecedor.estado].filter(Boolean).join(", ") || "-"}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <AddItemDialog occId={occId} open={addItemOpen} onOpenChange={setAddItemOpen} />
      <ChangeStatusDialog occ={occ} open={statusOpen} onOpenChange={setStatusOpen} />
    </div>
  );
}

// ─── Add Item Dialog ─────────────────────────────────────────────────────────
function AddItemDialog({ occId, open, onOpenChange }: { occId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [materialId, setMaterialId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [precoUnitario, setPrecoUnitario] = useState("0");
  const [unidade, setUnidade] = useState("un");
  const [matSearch, setMatSearch] = useState("");
  const { data: materiais } = useMateriais(matSearch ? { search: matSearch } : undefined);
  const createItem = useCreateOccItem(occId);

  function handleSubmit() {
    if (!materialId) { toast.error("Selecione um material"); return; }
    createItem.mutate(
      { materialId: parseInt(materialId), quantidade: parseFloat(quantidade), precoUnitario: parseFloat(precoUnitario || "0"), unidade },
      { onSuccess: () => { onOpenChange(false); setMaterialId(""); setQuantidade("1"); setPrecoUnitario("0"); setMatSearch(""); toast.success("Item adicionado!"); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Adicionar Item</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Buscar material</Label>
            <Input placeholder="Digite para buscar..." value={matSearch} onChange={(e) => setMatSearch(e.target.value)} />
            {matSearch && materiais && materiais.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {materiais.slice(0, 8).map((m: any) => (
                  <button key={m.id} type="button" className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between"
                    onClick={() => { setMaterialId(String(m.id)); setUnidade(m.unidade); setMatSearch(""); if (m.precoReferencia) setPrecoUnitario(String(m.precoReferencia)); }}>
                    <span>{m.nome} <span className="text-muted-foreground font-mono">({m.codigo})</span></span>
                    <span className="text-xs text-muted-foreground">Est: {m.estoqueAtual} {m.unidade}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input type="number" min="0.0001" step="0.0001" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Preço Unitário (R$)</Label>
            <Input type="number" min="0" step="0.01" value={precoUnitario} onChange={(e) => setPrecoUnitario(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!materialId || createItem.isPending}>{createItem.isPending ? "Adicionando..." : "Adicionar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Change Status Dialog ────────────────────────────────────────────────────
function ChangeStatusDialog({ occ, open, onOpenChange }: { occ: any; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [comentario, setComentario] = useState("");
  const patchStatus = usePatchOccStatus(occ.id);
  const currentIdx = STATUS_FLOW.indexOf(occ.status as OccStatus);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;
  const prevStatus = currentIdx > 0 ? STATUS_FLOW[currentIdx - 1] : null;

  function handleTransition(newStatus: string) {
    patchStatus.mutate(
      { status: newStatus, comentario: comentario || undefined },
      {
        onSuccess: () => { onOpenChange(false); setComentario(""); toast.success(`Status atualizado para "${newStatus}"`); },
        onError: (err: any) => { toast.error(err.message || "Erro ao atualizar status"); },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Atualizar Status</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><p className="text-sm text-muted-foreground mb-1">Status atual:</p><StatusBadge status={occ.status} /></div>
          <div className="space-y-1.5">
            <Label>Comentário (opcional)</Label>
            <Textarea placeholder="Adicionar observação..." value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            {nextStatus && (
              <Button className="w-full justify-start gap-3" onClick={() => handleTransition(nextStatus)} disabled={patchStatus.isPending}>
                <ChevronRight className="h-4 w-4" />
                Avançar para: <strong>{nextStatus}</strong>
              </Button>
            )}
            {prevStatus && (
              <Button variant="outline" className="w-full justify-start gap-3" onClick={() => handleTransition(prevStatus)} disabled={patchStatus.isPending}>
                <ArrowLeft className="h-4 w-4" />
                Voltar para: <strong>{prevStatus}</strong>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
