import React, { useState } from "react";
import {
  useListFornecedores, useCreateFornecedor, useUpdateFornecedor, useDeleteFornecedor, getListFornecedoresQueryKey,
  useListSetores, getListSetoresQueryKey,
  useListEmpresas, getListEmpresasQueryKey,
  useListCategorias, getListCategoriasQueryKey,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Trash, Building2, Tag, Layers, Landmark, Search } from "lucide-react";

/* ─── Direct fetch helpers for entities without generated mutations ─────── */
async function apiPost(path: string, body: unknown) {
  const res = await fetch(`/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPatch(path: string, id: number, body: unknown) {
  const res = await fetch(`/api/${path}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiDelete(path: string, id: number) {
  const res = await fetch(`/api/${path}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

/* ─── Shared Components ────────────────────────────────────────────────── */
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash className="h-4 w-4 mr-2" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActiveBadge({ ativo }: { ativo?: boolean | null }) {
  return ativo === false
    ? <Badge variant="secondary" className="text-muted-foreground text-xs">Inativo</Badge>
    : <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Ativo</Badge>;
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-sm text-muted-foreground">{label}</TableCell>
    </TableRow>
  );
}

function LoadingRows({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FORNECEDORES TAB
══════════════════════════════════════════════════════════════════════════════ */
function FornecedoresTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: rows, isLoading } = useListFornecedores();
  const createMut = useCreateFornecedor();
  const updateMut = useUpdateFornecedor();
  const deleteMut = useDeleteFornecedor();

  type Form = { id?: number; nome: string; cnpj: string; telefone: string; email: string; whatsapp: string; endereco: string; observacoes: string; ativo: boolean };
  const blank: Form = { nome: "", cnpj: "", telefone: "", email: "", whatsapp: "", endereco: "", observacoes: "", ativo: true };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);
  const [search, setSearch] = useState("");

  const filtered = (rows ?? []).filter(r => r.nome.toLowerCase().includes(search.toLowerCase()));
  const invalidate = () => qc.invalidateQueries({ queryKey: getListFornecedoresQueryKey() });

  function openCreate() { setForm(blank); setOpen(true); }
  function openEdit(r: any) {
    setForm({ id: r.id, nome: r.nome ?? "", cnpj: r.cnpj ?? "", telefone: r.telefone ?? "", email: r.email ?? "", whatsapp: r.whatsapp ?? "", endereco: r.endereco ?? "", observacoes: r.observacoes ?? "", ativo: r.ativo ?? true });
    setOpen(true);
  }

  function handleSave() {
    const { id, ...data } = form;
    if (id) {
      updateMut.mutate({ id, data }, {
        onSuccess: () => { toast({ title: "Fornecedor atualizado" }); setOpen(false); invalidate(); },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
      });
    } else {
      createMut.mutate({ data }, {
        onSuccess: () => { toast({ title: "Fornecedor criado" }); setOpen(false); invalidate(); },
        onError: () => toast({ title: "Erro ao criar", variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Excluir este fornecedor?")) return;
    deleteMut.mutate({ id }, {
      onSuccess: () => { toast({ title: "Fornecedor excluído" }); invalidate(); },
      onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
    });
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar fornecedores..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={openCreate} className="shrink-0"><Plus className="h-4 w-4 mr-2" />Novo Fornecedor</Button>
      </div>
      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead>Nome / Razão Social</TableHead>
                <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                <TableHead className="hidden sm:table-cell">Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRows cols={5} /> : filtered.length === 0 ? (
                <EmptyRow colSpan={5} label="Nenhum fornecedor encontrado." />
              ) : filtered.map(r => (
                <TableRow key={r.id} className="hover:bg-muted/40">
                  <TableCell>
                    <p className="font-medium text-sm">{r.nome}</p>
                    {r.email && <p className="text-xs text-muted-foreground">{r.email}</p>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{r.cnpj || "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{r.telefone || r.whatsapp || "—"}</TableCell>
                  <TableCell><ActiveBadge ativo={r.ativo} /></TableCell>
                  <TableCell className="text-right"><RowActions onEdit={() => openEdit(r)} onDelete={() => handleDelete(r.id)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Nome / Razão Social *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Tubofer Distribuidora Ltda" />
            </div>
            <div className="space-y-1.5">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(11) 9999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contato@empresa.com.br" />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Rua, Número, Cidade - Estado" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Observações</Label>
              <Textarea rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Informações adicionais..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} id="fornAtivo" />
              <Label htmlFor="fornAtivo">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome.trim() || createMut.isPending || updateMut.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EMPRESAS TAB
══════════════════════════════════════════════════════════════════════════════ */
function EmpresasTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: rows, isLoading } = useListEmpresas();

  type Form = { id?: number; nome: string; cnpj: string; ativa: boolean };
  const blank: Form = { nome: "", cnpj: "", ativa: true };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListEmpresasQueryKey() });

  const createMut = useMutation({
    mutationFn: (data: Omit<Form, "id">) => apiPost("empresas", data),
    onSuccess: () => { toast({ title: "Empresa criada" }); setOpen(false); invalidate(); },
    onError: () => toast({ title: "Erro ao criar empresa", variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: Form) => apiPatch("empresas", id!, data),
    onSuccess: () => { toast({ title: "Empresa atualizada" }); setOpen(false); invalidate(); },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiDelete("empresas", id),
    onSuccess: () => { toast({ title: "Empresa excluída" }); invalidate(); },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  function openCreate() { setForm(blank); setOpen(true); }
  function openEdit(r: any) { setForm({ id: r.id, nome: r.nome ?? "", cnpj: r.cnpj ?? "", ativa: r.ativa ?? true }); setOpen(true); }
  function handleSave() { form.id ? updateMut.mutate(form) : createMut.mutate(form); }
  function handleDelete(id: number) { if (!confirm("Excluir esta empresa?")) return; deleteMut.mutate(id); }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Empresa</Button>
      </div>
      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead>Nome da Empresa</TableHead>
                <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRows cols={4} rows={3} /> : !rows?.length ? (
                <EmptyRow colSpan={4} label="Nenhuma empresa cadastrada." />
              ) : rows.map(r => (
                <TableRow key={r.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium text-sm">{r.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{r.cnpj || "—"}</TableCell>
                  <TableCell><ActiveBadge ativo={r.ativa} /></TableCell>
                  <TableCell className="text-right"><RowActions onEdit={() => openEdit(r)} onDelete={() => handleDelete(r.id)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{form.id ? "Editar Empresa" : "Nova Empresa"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da Empresa *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="MATERION Indústria S.A." />
            </div>
            <div className="space-y-1.5">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativa} onCheckedChange={v => setForm(f => ({ ...f, ativa: v }))} id="empAtiva" />
              <Label htmlFor="empAtiva">Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome.trim() || createMut.isPending || updateMut.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SETORES TAB
══════════════════════════════════════════════════════════════════════════════ */
function SetoresTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: rows, isLoading } = useListSetores();

  type Form = { id?: number; nome: string; descricao: string };
  const blank: Form = { nome: "", descricao: "" };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListSetoresQueryKey() });

  const createMut = useMutation({
    mutationFn: (data: Omit<Form, "id">) => apiPost("setores", data),
    onSuccess: () => { toast({ title: "Setor criado" }); setOpen(false); invalidate(); },
    onError: () => toast({ title: "Erro ao criar setor", variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: Form) => apiPatch("setores", id!, data),
    onSuccess: () => { toast({ title: "Setor atualizado" }); setOpen(false); invalidate(); },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiDelete("setores", id),
    onSuccess: () => { toast({ title: "Setor excluído" }); invalidate(); },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  function openCreate() { setForm(blank); setOpen(true); }
  function openEdit(r: any) { setForm({ id: r.id, nome: r.nome ?? "", descricao: r.descricao ?? "" }); setOpen(true); }
  function handleSave() { form.id ? updateMut.mutate(form) : createMut.mutate(form); }
  function handleDelete(id: number) { if (!confirm("Excluir este setor?")) return; deleteMut.mutate(id); }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Setor</Button>
      </div>
      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead>Nome do Setor</TableHead>
                <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRows cols={3} rows={3} /> : !rows?.length ? (
                <EmptyRow colSpan={3} label="Nenhum setor cadastrado." />
              ) : rows.map(r => (
                <TableRow key={r.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium text-sm">{r.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-xs">{r.descricao || "—"}</TableCell>
                  <TableCell className="text-right"><RowActions onEdit={() => openEdit(r)} onDelete={() => handleDelete(r.id)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{form.id ? "Editar Setor" : "Novo Setor"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome do Setor *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Produção, Almoxarifado..." />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição do setor..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome.trim() || createMut.isPending || updateMut.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CATEGORIAS TAB
══════════════════════════════════════════════════════════════════════════════ */
function CategoriasTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: rows, isLoading } = useListCategorias();

  type Form = { id?: number; nome: string; descricao: string };
  const blank: Form = { nome: "", descricao: "" };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListCategoriasQueryKey() });

  const createMut = useMutation({
    mutationFn: (data: Omit<Form, "id">) => apiPost("categorias", data),
    onSuccess: () => { toast({ title: "Categoria criada" }); setOpen(false); invalidate(); },
    onError: () => toast({ title: "Erro ao criar categoria", variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: Form) => apiPatch("categorias", id!, data),
    onSuccess: () => { toast({ title: "Categoria atualizada" }); setOpen(false); invalidate(); },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiDelete("categorias", id),
    onSuccess: () => { toast({ title: "Categoria excluída" }); invalidate(); },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  function openCreate() { setForm(blank); setOpen(true); }
  function openEdit(r: any) { setForm({ id: r.id, nome: r.nome ?? "", descricao: r.descricao ?? "" }); setOpen(true); }
  function handleSave() { form.id ? updateMut.mutate(form) : createMut.mutate(form); }
  function handleDelete(id: number) { if (!confirm("Excluir esta categoria?")) return; deleteMut.mutate(id); }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Categoria</Button>
      </div>
      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead>Nome da Categoria</TableHead>
                <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <LoadingRows cols={3} rows={3} /> : !rows?.length ? (
                <EmptyRow colSpan={3} label="Nenhuma categoria cadastrada." />
              ) : rows.map(r => (
                <TableRow key={r.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium text-sm">{r.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-xs">{r.descricao || "—"}</TableCell>
                  <TableCell className="text-right"><RowActions onEdit={() => openEdit(r)} onDelete={() => handleDelete(r.id)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{form.id ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da Categoria *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Tubos e Conexões, Elétrico..." />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição da categoria..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome.trim() || createMut.isPending || updateMut.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function Cadastros() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cadastros</h1>
        <p className="text-sm text-muted-foreground">Gerencie fornecedores, empresas, setores e categorias.</p>
      </div>

      <Tabs defaultValue="fornecedores">
        <TabsList className="mb-4 h-auto flex-wrap gap-1">
          <TabsTrigger value="fornecedores" className="gap-2">
            <Building2 className="h-4 w-4" /><span>Fornecedores</span>
          </TabsTrigger>
          <TabsTrigger value="empresas" className="gap-2">
            <Landmark className="h-4 w-4" /><span>Empresas</span>
          </TabsTrigger>
          <TabsTrigger value="setores" className="gap-2">
            <Layers className="h-4 w-4" /><span>Setores</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-2">
            <Tag className="h-4 w-4" /><span>Categorias</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fornecedores"><FornecedoresTab /></TabsContent>
        <TabsContent value="empresas"><EmpresasTab /></TabsContent>
        <TabsContent value="setores"><SetoresTab /></TabsContent>
        <TabsContent value="categorias"><CategoriasTab /></TabsContent>
      </Tabs>
    </div>
  );
}
