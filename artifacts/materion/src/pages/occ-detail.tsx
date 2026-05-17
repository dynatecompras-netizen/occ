import React, { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetOcc,
  useUpdateOcc,
  useCreateOccItem,
  useUpdateOccItem,
  useDeleteOccItem,
  useDuplicarOcc,
  useSalvarOccComoTemplate,
  useListFornecedores,
  useListMateriais,
  useListEmpresas,
  useListSetores,
  useListCategorias,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Copy, FileDown, Send, LayoutTemplate,
  Plus, Trash2, Edit2, Check, X, ChevronRight,
  Building2, MapPin, Tag, Calendar, AlertTriangle,
  Phone, Mail, MessageSquare, Printer, TrendingUp,
  TrendingDown, Minus, Package, CheckCircle, Clock,
} from "lucide-react";
import { Link } from "wouter";

type OccStatus = "Rascunho" | "Aberta" | "Aprovada" | "Enviada" | "Concluída" | "Cancelada";

const STATUS_FLOW: OccStatus[] = ["Rascunho", "Aberta", "Aprovada", "Enviada", "Concluída"];

const STATUS_CONFIG: Record<OccStatus, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  Rascunho: { color: "text-slate-600", bg: "bg-slate-100", icon: Clock, label: "Rascunho" },
  Aberta: { color: "text-blue-600", bg: "bg-blue-100", icon: Package, label: "Aberta" },
  Aprovada: { color: "text-green-600", bg: "bg-green-100", icon: CheckCircle, label: "Aprovada" },
  Enviada: { color: "text-purple-600", bg: "bg-purple-100", icon: Send, label: "Enviada" },
  "Concluída": { color: "text-emerald-600", bg: "bg-emerald-100", icon: Check, label: "Concluída" },
  Cancelada: { color: "text-red-600", bg: "bg-red-100", icon: X, label: "Cancelada" },
};

const PRIORIDADE_CONFIG: Record<string, string> = {
  Baixa: "text-slate-600 bg-slate-100",
  Normal: "text-blue-600 bg-blue-100",
  Alta: "text-orange-600 bg-orange-100",
  Urgente: "text-red-600 bg-red-100",
};

function fmt(v: number | null | undefined) {
  if (v == null) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("pt-BR");
}

function fmtDateTime(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR");
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as OccStatus] ?? { color: "text-gray-600", bg: "bg-gray-100" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.color}`}>
      {React.createElement(cfg.icon ?? Clock, { className: "h-3.5 w-3.5" })}
      {status}
    </span>
  );
}

function StatusTimeline({ current }: { current: string }) {
  const currentIdx = STATUS_FLOW.indexOf(current as OccStatus);
  const isCanceled = current === "Cancelada";

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex items-center min-w-max gap-0">
        {STATUS_FLOW.map((s, i) => {
          const cfg = STATUS_CONFIG[s];
          const done = !isCanceled && i < currentIdx;
          const active = !isCanceled && i === currentIdx;
          const future = isCanceled || i > currentIdx;
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : active
                      ? `${cfg.bg} border-current ${cfg.color} ring-4 ring-offset-1 ring-primary/20`
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    React.createElement(cfg.icon, { className: "h-4 w-4" })
                  )}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    active ? cfg.color : done ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {s}
                </span>
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div
                  className={`h-0.5 w-10 sm:w-16 mx-1 mt-[-18px] transition-all ${
                    done ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
        {isCanceled && (
          <>
            <div className="h-0.5 w-10 sm:w-16 mx-1 mt-[-18px] bg-red-200" />
            <div className="flex flex-col items-center gap-1">
              <div className="h-9 w-9 rounded-full flex items-center justify-center border-2 bg-red-100 border-red-400 text-red-600 ring-4 ring-offset-1 ring-red-100">
                <X className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-red-600 whitespace-nowrap">Cancelada</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface AddItemDialogProps {
  occId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

function AddItemDialog({ occId, open, onOpenChange, onSuccess }: AddItemDialogProps) {
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [quantidade, setQuantidade] = useState("1");
  const [preco, setPreco] = useState("");
  const [observacao, setObservacao] = useState("");
  const [materialId, setMaterialId] = useState<number | undefined>();
  const [matSearch, setMatSearch] = useState("");

  const { data: materiais } = useListMateriais({ search: matSearch || undefined });
  const createItem = useCreateOccItem({
    mutation: { onSuccess: () => { onSuccess(); onOpenChange(false); resetForm(); } },
  });

  function resetForm() {
    setNome(""); setUnidade("UN"); setQuantidade("1"); setPreco("");
    setObservacao(""); setMaterialId(undefined); setMatSearch("");
  }

  function handleSelectMaterial(m: { id: number; nome: string; unidade: string }) {
    setMaterialId(m.id);
    setNome(m.nome);
    setUnidade(m.unidade);
    setMatSearch("");
  }

  function handleSubmit() {
    if (!nome || !quantidade) return;
    createItem.mutate({
      occId,
      data: {
        nomeMaterial: nome,
        unidade,
        quantidade: parseFloat(quantidade),
        precoUnitario: preco ? parseFloat(preco) : undefined,
        observacao: observacao || undefined,
        materialId,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Buscar material cadastrado</Label>
            <Input
              placeholder="Digite para buscar..."
              value={matSearch}
              onChange={(e) => setMatSearch(e.target.value)}
            />
            {matSearch && materiais && materiais.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {materiais.slice(0, 8).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between"
                    onClick={() => handleSelectMaterial(m)}
                  >
                    <span>{m.nome}</span>
                    <span className="text-xs text-muted-foreground">{m.unidade}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label>Nome do Material</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Parafuso M6x20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input type="number" min="0.001" step="0.001" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["UN", "CX", "KG", "LT", "MT", "RL", "PC", "PR", "RS"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Preço Unitário (R$)</Label>
              <Input type="number" min="0" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Opcional..." />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!nome || createItem.isPending}>
            {createItem.isPending ? "Adicionando..." : "Adicionar Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditOccDialogProps {
  occ: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

function EditOccDialog({ occ, open, onOpenChange, onSuccess }: EditOccDialogProps) {
  const [fornecedorId, setFornecedorId] = useState(String(occ.fornecedorId ?? ""));
  const [empresaId, setEmpresaId] = useState(String(occ.empresaId ?? ""));
  const [setorId, setSetorId] = useState(String(occ.setorId ?? ""));
  const [categoriaId, setCategoriaId] = useState(String(occ.categoriaId ?? ""));
  const [prioridade, setPrioridade] = useState(occ.prioridade ?? "Normal");
  const [observacoes, setObservacoes] = useState(occ.observacoes ?? "");
  const [condicoesPagamento, setCondicoesPagamento] = useState(occ.condicoesPagamento ?? "");
  const [prazo, setPrazo] = useState(occ.prazo ?? "");

  const { data: fornecedores } = useListFornecedores();
  const { data: empresas } = useListEmpresas();
  const { data: setores } = useListSetores();
  const { data: categorias } = useListCategorias();

  const updateOcc = useUpdateOcc({ mutation: { onSuccess: () => { onSuccess(); onOpenChange(false); } } });

  function handleSave() {
    updateOcc.mutate({
      id: occ.id,
      data: {
        fornecedorId: fornecedorId ? parseInt(fornecedorId) : undefined,
        empresaId: empresaId ? parseInt(empresaId) : undefined,
        setorId: setorId ? parseInt(setorId) : undefined,
        categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
        prioridade,
        observacoes: observacoes || undefined,
        condicoesPagamento: condicoesPagamento || undefined,
        prazo: prazo || undefined,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar OCC</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Select value={fornecedorId} onValueChange={setFornecedorId}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {fornecedores?.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {empresas?.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Setor</Label>
              <Select value={setorId} onValueChange={setSetorId}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {setores?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {categorias?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Baixa", "Normal", "Alta", "Urgente"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prazo</Label>
              <Input value={prazo} onChange={(e) => setPrazo(e.target.value)} placeholder="Ex: 30 dias" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Condições de Pagamento</Label>
            <Input value={condicoesPagamento} onChange={(e) => setCondicoesPagamento(e.target.value)} placeholder="Ex: 30/60/90 dias" />
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Observações gerais..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updateOcc.isPending}>
            {updateOcc.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SaveAsTemplateDialogProps {
  occId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function SaveAsTemplateDialog({ occId, open, onOpenChange }: SaveAsTemplateDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("completo");
  const qc = useQueryClient();

  const salvar = useSalvarOccComoTemplate({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/templates"] });
        onOpenChange(false);
        setNome(""); setDescricao("");
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar como Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome do Template</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Compra Mensal Almoxarifado" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o propósito do template..." />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="completo">Completo (com itens)</SelectItem>
                <SelectItem value="estrutura">Apenas Estrutura</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => salvar.mutate({ id: occId, data: { nome, descricao, tipo } })} disabled={!nome || salvar.isPending}>
            {salvar.isPending ? "Salvando..." : "Criar Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ChangeStatusDialogProps {
  occ: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

function ChangeStatusDialog({ occ, open, onOpenChange, onSuccess }: ChangeStatusDialogProps) {
  const currentIdx = STATUS_FLOW.indexOf(occ.status as OccStatus);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;

  const updateOcc = useUpdateOcc({ mutation: { onSuccess: () => { onSuccess(); onOpenChange(false); } } });

  const allStatuses = [...STATUS_FLOW, "Cancelada" as OccStatus].filter((s) => s !== occ.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Atualizar Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground">
            Status atual: <StatusBadge status={occ.status} />
          </p>
          <Separator />
          <div className="space-y-1.5">
            {allStatuses.map((s) => {
              const cfg = STATUS_CONFIG[s as OccStatus];
              return (
                <button
                  key={s}
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left ${
                    s === nextStatus ? "border-primary/30 bg-primary/5" : ""
                  }`}
                  onClick={() => updateOcc.mutate({ id: occ.id, data: { status: s } })}
                  disabled={updateOcc.isPending}
                >
                  <span className={`p-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {React.createElement(cfg.icon, { className: "h-3.5 w-3.5" })}
                  </span>
                  <span className="font-medium text-sm">{s}</span>
                  {s === nextStatus && (
                    <span className="ml-auto text-xs text-primary font-medium">Próximo</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OccPrintContent({ occ }: { occ: any }) {
  const total = occ.itens?.reduce((s: number, i: any) => s + (i.quantidade * (i.precoUnitario ?? 0)), 0) ?? 0;
  return (
    <div className="hidden print:block text-black font-sans text-sm" style={{ fontFamily: "Arial, sans-serif" }}>
      <div style={{ borderBottom: "2px solid black", paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: "bold", margin: 0 }}>MATERION ERP</h1>
            <p style={{ margin: "2px 0", fontSize: 11, color: "#555" }}>Sistema de Compras Industrial</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: 16, fontWeight: "bold", margin: 0 }}>ORDEM DE COMPRA</h2>
            <p style={{ margin: "2px 0", fontSize: 13, fontWeight: "bold" }}>{occ.numero}</p>
            <p style={{ margin: "2px 0", fontSize: 10, color: "#555" }}>Emitido: {fmtDateTime(new Date().toISOString())}</p>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ border: "1px solid #ccc", padding: 10, borderRadius: 4 }}>
          <p style={{ fontWeight: "bold", margin: "0 0 6px" }}>FORNECEDOR</p>
          <p style={{ margin: "2px 0" }}>{occ.fornecedorNome || "-"}</p>
        </div>
        <div style={{ border: "1px solid #ccc", padding: 10, borderRadius: 4 }}>
          <p style={{ fontWeight: "bold", margin: "0 0 6px" }}>DADOS DA ORDEM</p>
          <p style={{ margin: "2px 0" }}>Empresa: {occ.empresaNome || "-"}</p>
          <p style={{ margin: "2px 0" }}>Setor: {occ.setorNome || "-"}</p>
          <p style={{ margin: "2px 0" }}>Status: {occ.status}</p>
          <p style={{ margin: "2px 0" }}>Prioridade: {occ.prioridade}</p>
          <p style={{ margin: "2px 0" }}>Prazo: {occ.prazo || "-"}</p>
          <p style={{ margin: "2px 0" }}>Pagamento: {occ.condicoesPagamento || "-"}</p>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th style={{ border: "1px solid #ccc", padding: "6px 10px", textAlign: "left" }}>Material</th>
            <th style={{ border: "1px solid #ccc", padding: "6px 10px", textAlign: "center" }}>Un.</th>
            <th style={{ border: "1px solid #ccc", padding: "6px 10px", textAlign: "right" }}>Qtd.</th>
            <th style={{ border: "1px solid #ccc", padding: "6px 10px", textAlign: "right" }}>P. Unit.</th>
            <th style={{ border: "1px solid #ccc", padding: "6px 10px", textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {occ.itens?.map((item: any, idx: number) => (
            <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{item.nomeMaterial}</td>
              <td style={{ border: "1px solid #ccc", padding: "5px 10px", textAlign: "center" }}>{item.unidade}</td>
              <td style={{ border: "1px solid #ccc", padding: "5px 10px", textAlign: "right" }}>{item.quantidade}</td>
              <td style={{ border: "1px solid #ccc", padding: "5px 10px", textAlign: "right" }}>
                {item.precoUnitario != null ? fmt(item.precoUnitario) : "-"}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "5px 10px", textAlign: "right", fontWeight: "bold" }}>
                {item.precoUnitario != null ? fmt(item.quantidade * item.precoUnitario) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ border: "1px solid #ccc", padding: "6px 10px", textAlign: "right", fontWeight: "bold" }}>
              TOTAL GERAL
            </td>
            <td style={{ border: "1px solid #ccc", padding: "6px 10px", textAlign: "right", fontWeight: "bold", fontSize: 14 }}>
              {fmt(total)}
            </td>
          </tr>
        </tfoot>
      </table>
      {occ.observacoes && (
        <div style={{ border: "1px solid #ccc", padding: 10, borderRadius: 4, marginBottom: 16 }}>
          <p style={{ fontWeight: "bold", margin: "0 0 4px" }}>OBSERVAÇÕES</p>
          <p style={{ margin: 0 }}>{occ.observacoes}</p>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40, marginTop: 40 }}>
        {["Comprador", "Aprovação", "Fornecedor"].map((role) => (
          <div key={role} style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #000", paddingTop: 6 }}>
              <p style={{ margin: 0, fontSize: 11, color: "#555" }}>{role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OccDetail() {
  const { id } = useParams<{ id: string }>();
  const occId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const { data: occ, isLoading, refetch } = useGetOcc(occId);
  const updateItem = useUpdateOccItem({ mutation: { onSuccess: () => { refetch(); setEditingItemId(null); } } });
  const deleteItem = useDeleteOccItem({ mutation: { onSuccess: () => refetch() } });
  const duplicarOcc = useDuplicarOcc({
    mutation: {
      onSuccess: (novo) => {
        qc.invalidateQueries({ queryKey: ["/api/occs"] });
        navigate(`/occs/${novo.id}`);
      },
    },
  });

  function startEditItem(item: any) {
    setEditingItemId(item.id);
    setEditQty(String(item.quantidade));
    setEditPrice(item.precoUnitario != null ? String(item.precoUnitario) : "");
  }

  function saveEditItem(item: any) {
    updateItem.mutate({
      occId,
      id: item.id,
      data: {
        quantidade: parseFloat(editQty),
        precoUnitario: editPrice ? parseFloat(editPrice) : undefined,
      },
    });
  }

  const valorTotal = occ?.itens?.reduce((s, i) => s + (i.quantidade * (i.precoUnitario ?? 0)), 0) ?? 0;
  const itensSemPreco = occ?.itens?.filter((i) => i.precoUnitario == null).length ?? 0;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
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

  const fornecedor = occ.fornecedorNome;

  return (
    <div className="flex flex-col h-full">
      {/* Print-only PDF */}
      <OccPrintContent occ={occ} />

      {/* Sticky top bar */}
      <div className="print:hidden sticky top-0 z-20 bg-card/95 backdrop-blur border-b px-4 md:px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link href="/occs"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-base md:text-lg truncate">{occ.numero}</span>
            <StatusBadge status={occ.status} />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORIDADE_CONFIG[occ.prioridade] ?? "bg-gray-100 text-gray-600"}`}>
              {occ.prioridade}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setEditOpen(true)}>
            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
            Editar
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => duplicarOcc.mutate({ id: occId })}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Duplicar
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button size="sm" onClick={() => setStatusOpen(true)}>
            <ChevronRight className="h-3.5 w-3.5 mr-1" />
            Status
          </Button>
        </div>
      </div>

      <div className="print:hidden flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">

          {/* Mobile action bar */}
          <div className="flex gap-2 sm:hidden flex-wrap">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />Editar
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => duplicarOcc.mutate({ id: occId })}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />Duplicar
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setTemplateOpen(true)}>
              <LayoutTemplate className="h-3.5 w-3.5 mr-1.5" />Template
            </Button>
          </div>

          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4 md:px-6">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Fluxo de Status
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4">
              <StatusTimeline current={occ.status} />
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fornecedor</span>
                </div>
                <p className="font-semibold text-sm truncate">{occ.fornecedorNome || "-"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Setor / Empresa</span>
                </div>
                <p className="font-semibold text-sm">{occ.setorNome || "-"}</p>
                <p className="text-xs text-muted-foreground truncate">{occ.empresaNome || "-"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Datas</span>
                </div>
                <p className="font-semibold text-sm">Criado: {fmtDate(occ.criadoEm)}</p>
                {occ.prazo && <p className="text-xs text-muted-foreground">Prazo: {occ.prazo}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor Total</span>
                </div>
                <p className="font-bold text-lg text-foreground">{valorTotal > 0 ? fmt(valorTotal) : "-"}</p>
                {itensSemPreco > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {itensSemPreco} item(ns) sem preço
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Items Intelligence Center */}
          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Itens da OCC</CardTitle>
              <Button size="sm" onClick={() => setAddItemOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar Item
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {!occ.itens || occ.itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Package className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Nenhum item adicionado.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setAddItemOpen(true)}>
                    Adicionar primeiro item
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left px-6 py-3 font-medium text-muted-foreground">Material</th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground w-16">Un.</th>
                          <th className="text-right px-3 py-3 font-medium text-muted-foreground w-24">Qtd.</th>
                          <th className="text-right px-3 py-3 font-medium text-muted-foreground w-32">P. Unit.</th>
                          <th className="text-right px-6 py-3 font-medium text-muted-foreground w-32">Total</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground w-24">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {occ.itens.map((item) => {
                          const isEditing = editingItemId === item.id;
                          const itemTotal = item.quantidade * (item.precoUnitario ?? 0);
                          return (
                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-3">
                                <div className="font-medium">{item.nomeMaterial}</div>
                                {item.observacao && (
                                  <div className="text-xs text-muted-foreground mt-0.5">{item.observacao}</div>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center text-muted-foreground">{item.unidade}</td>
                              <td className="px-3 py-3 text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    className="w-20 h-7 text-right text-sm ml-auto"
                                  />
                                ) : (
                                  <span className="font-medium">{item.quantidade}</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    className="w-28 h-7 text-right text-sm ml-auto"
                                    placeholder="0,00"
                                  />
                                ) : item.precoUnitario != null ? (
                                  <span>{fmt(item.precoUnitario)}</span>
                                ) : (
                                  <span className="text-amber-600 text-xs font-medium">A definir</span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-right font-semibold">
                                {item.precoUnitario != null ? fmt(itemTotal) : "-"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => saveEditItem(item)}
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => setEditingItemId(null)}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => startEditItem(item)}
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => deleteItem.mutate({ occId, id: item.id })}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/20">
                          <td colSpan={4} className="px-6 py-3 text-right font-semibold text-sm">Total Geral</td>
                          <td className="px-6 py-3 text-right font-bold text-base">{fmt(valorTotal)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-2 px-4 pb-4">
                    {occ.itens.map((item) => {
                      const itemTotal = item.quantidade * (item.precoUnitario ?? 0);
                      return (
                        <div key={item.id} className="rounded-lg border bg-card p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{item.nomeMaterial}</p>
                              {item.observacao && (
                                <p className="text-xs text-muted-foreground mt-0.5">{item.observacao}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => startEditItem(item)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500"
                                onClick={() => deleteItem.mutate({ occId, id: item.id })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.quantidade} {item.unidade}
                              {item.precoUnitario != null && ` × ${fmt(item.precoUnitario)}`}
                            </span>
                            <span className="font-semibold">
                              {item.precoUnitario != null ? fmt(itemTotal) : "Sem preço"}
                            </span>
                          </div>
                          {editingItemId === item.id && (
                            <div className="space-y-2 pt-2 border-t">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Quantidade</Label>
                                  <Input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">Preço Unit.</Label>
                                  <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 text-sm" />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" className="flex-1 h-8" onClick={() => saveEditItem(item)}>
                                  <Check className="h-3.5 w-3.5 mr-1" />Salvar
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => setEditingItemId(null)}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center px-1 pt-2 border-t">
                      <span className="font-semibold text-sm">Total Geral</span>
                      <span className="font-bold text-base">{fmt(valorTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bottom grid: Supplier + Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Supplier Panel */}
            <Card>
              <CardHeader className="pb-3 pt-4 px-4 md:px-6">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Painel do Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 space-y-4">
                {fornecedor ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{fornecedor}</p>
                        <p className="text-xs text-muted-foreground">Fornecedor cadastrado</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ações Rápidas</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="justify-start gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          Ligar
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          E-mail
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start gap-2 col-span-2">
                          <MessageSquare className="h-3.5 w-3.5" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mensagem Padrão</p>
                      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                        <p>Prezado(a) <strong>{fornecedor}</strong>,</p>
                        <p>Segue nossa Ordem de Compra <strong>{occ.numero}</strong> com {occ.itens?.length ?? 0} item(ns).</p>
                        <p>Prazo solicitado: <strong>{occ.prazo || "a confirmar"}</strong>.</p>
                        <p>Aguardamos confirmação.</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Copy className="h-3.5 w-3.5" />
                        Copiar Mensagem
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
                    <Building2 className="h-6 w-6 opacity-40" />
                    <p className="text-sm">Nenhum fornecedor associado.</p>
                    <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                      Associar Fornecedor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details & Actions */}
            <Card>
              <CardHeader className="pb-3 pt-4 px-4 md:px-6">
                <CardTitle className="text-base font-semibold">Detalhes e Ações</CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 space-y-4">
                {occ.observacoes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Observações</p>
                    <p className="text-sm bg-muted/40 rounded-lg p-3">{occ.observacoes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {occ.condicoesPagamento && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Pagamento</p>
                      <p className="font-medium">{occ.condicoesPagamento}</p>
                    </div>
                  )}
                  {occ.categoriaNome && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Categoria</p>
                      <p className="font-medium">{occ.categoriaNome}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Criado em</p>
                    <p className="font-medium">{fmtDateTime(occ.criadoEm)}</p>
                  </div>
                  {occ.atualizadoEm && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Atualizado em</p>
                      <p className="font-medium">{fmtDateTime(occ.atualizadoEm)}</p>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Operações</p>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setTemplateOpen(true)}>
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Salvar como Template
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => duplicarOcc.mutate({ id: occId })}>
                    <Copy className="h-3.5 w-3.5" />
                    Duplicar esta OCC
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => window.print()}>
                    <FileDown className="h-3.5 w-3.5" />
                    Exportar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddItemDialog
        occId={occId}
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onSuccess={() => refetch()}
      />
      {editOpen && (
        <EditOccDialog
          occ={occ}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={() => refetch()}
        />
      )}
      <SaveAsTemplateDialog
        occId={occId}
        open={templateOpen}
        onOpenChange={setTemplateOpen}
      />
      <ChangeStatusDialog
        occ={occ}
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
