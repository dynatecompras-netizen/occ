import { useState } from "react";
import { useFornecedores, useCreateFornecedor, useUpdateFornecedor, useDeleteFornecedor } from "@/hooks/useApi";
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
import { Plus, Search, Building2, Edit2, Trash2, Phone, Mail, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { maskCNPJ, maskCEP, maskPhone } from "@/lib/formatters";
import { ESTADOS_BR } from "@/lib/constants";
import { toast } from "sonner";
import api from "@/lib/api";

export default function FornecedoresList() {
  const [search, setSearch] = useState("");
  const [ativo, setAtivo] = useState("true");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (ativo) params.ativo = ativo;
  const { data: fornecedores, isLoading } = useFornecedores(params);
  
  const createFornecedor = useCreateFornecedor();
  const updateFornecedor = useUpdateFornecedor(editingId || 0);
  const deleteFornecedor = useDeleteFornecedor();

  function openCreate() { setEditingId(null); setFormData({}); setFormOpen(true); }
  function openEdit(f: any) { setEditingId(f.id); setFormData({ ...f }); setFormOpen(true); }

  async function handleCnpjLookup(cnpjMasked: string) {
    const cnpj = cnpjMasked.replace(/\D/g, "");
    setFormData({ ...formData, cnpj: cnpjMasked, situacao_receita: undefined });
    
    if (cnpj.length === 14) {
      setLoadingCnpj(true);
      try {
        const response = await api.get(`/api/cnpj/${cnpj}`);
        const data = response.data;
        
        setFormData(prev => ({
          ...prev,
          razaoSocial: data.razao_social || prev.razaoSocial,
          nomeFantasia: data.nome_fantasia || prev.nomeFantasia,
          email: data.email || prev.email,
          telefone: data.telefone ? maskPhone(data.telefone) : prev.telefone,
          endereco: data.endereco || prev.endereco,
          cidade: data.cidade || prev.cidade,
          estado: data.estado || prev.estado,
          cep: data.cep ? maskCEP(data.cep) : prev.cep,
          situacao_receita: data.situacao_receita
        }));
        
        toast.success("Dados preenchidos automaticamente da Receita Federal", { icon: <CheckCircle2 className="h-4 w-4 text-success" /> });
      } catch (err: any) {
        if (err.response?.status === 404) {
          toast.error("CNPJ não encontrado na Receita Federal");
        } else {
          toast.error("Erro ao consultar CNPJ. Digite os dados manualmente.");
        }
      } finally {
        setLoadingCnpj(false);
      }
    }
  }

  async function handleCepLookup(cepMasked: string) {
    const cep = cepMasked.replace(/\D/g, "");
    setFormData({ ...formData, cep: cepMasked });
    
    if (cep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro ? `${data.logradouro}, ` : prev.endereco,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado
          }));
        }
      } catch (e) {
        // Silently fail CEP to not bother the user
      } finally {
        setLoadingCep(false);
      }
    }
  }

  function handleSave() {
    const mutation = editingId ? updateFornecedor : createFornecedor;
    mutation.mutate(formData, {
      onSuccess: () => { 
        setFormOpen(false); 
        toast.success(editingId ? "Fornecedor atualizado!" : "Fornecedor cadastrado!"); 
      },
      onError: (err: any) => toast.error(err.message || "Erro ao salvar fornecedor"),
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Fornecedores</h1>
          <p className="text-sm text-text-muted mt-1">Gerencie a base de fornecedores e consulte dados via Receita Federal.</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary-dim text-white border border-primary-dim">
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 rounded-lg border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
          <Input 
            type="search" 
            placeholder="Buscar por razão social, CNPJ ou cidade..." 
            className="pl-9 bg-surface3 border-border focus:border-primary text-text w-full" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select value={ativo} onValueChange={setAtivo}>
          <SelectTrigger className="w-full sm:w-[150px] bg-surface3 border-border text-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border text-text">
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
            <SelectItem value="">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface border border-border rounded-lg overflow-hidden border-l-4 border-l-primary">
        <Table>
          <TableHeader className="bg-surface2">
            <TableRow className="border-border">
              <TableHead className="text-primary font-mono text-xs uppercase tracking-wider py-4">Razão Social</TableHead>
              <TableHead className="text-primary font-mono text-xs uppercase tracking-wider">CNPJ</TableHead>
              <TableHead className="text-primary font-mono text-xs uppercase tracking-wider">Telefone</TableHead>
              <TableHead className="text-primary font-mono text-xs uppercase tracking-wider">Email</TableHead>
              <TableHead className="text-primary font-mono text-xs uppercase tracking-wider">Cidade/UF</TableHead>
              <TableHead className="text-primary font-mono text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-primary font-mono text-xs uppercase tracking-wider w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => 
                <TableRow key={i} className="border-border">
                  {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full bg-surface3" /></TableCell>)}
                </TableRow>
              )
            ) : !fornecedores?.length ? (
              <TableRow className="border-border">
                <TableCell colSpan={7} className="h-32 text-center text-text-muted">
                  <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  Nenhum fornecedor encontrado
                </TableCell>
              </TableRow>
            ) : fornecedores.map((f: any) => (
              <TableRow key={f.id} className="border-border hover:bg-surface3 transition-colors">
                <TableCell className="font-medium text-text max-w-[200px] truncate">{f.razaoSocial}</TableCell>
                <TableCell className="font-mono text-xs text-text-dim">{f.cnpj}</TableCell>
                <TableCell className="text-sm text-text-muted">{f.telefone || "-"}</TableCell>
                <TableCell className="text-sm text-text-muted truncate max-w-[150px]">{f.email || "-"}</TableCell>
                <TableCell className="text-sm text-text-muted">{[f.cidade, f.estado].filter(Boolean).join("/") || "-"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 text-xs font-mono border rounded ${f.ativo ? 'border-success/30 text-success bg-success/10' : 'border-text-muted/30 text-text-muted bg-surface3'}`}>
                    {f.ativo ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-primary hover:bg-surface3" onClick={() => openEdit(f)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {f.ativo && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-danger hover:bg-danger/10" 
                        onClick={() => deleteFornecedor.mutate(f.id, { onSuccess: () => toast.success("Fornecedor inativado") })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <Card key={i} className="bg-surface border-border"><CardContent className="p-4"><Skeleton className="h-20 w-full bg-surface3" /></CardContent></Card>)
        : !fornecedores?.length ? (
          <div className="bg-surface border border-border rounded-lg p-8 text-center text-text-muted">
             <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
             <p className="text-sm">Nenhum fornecedor encontrado</p>
          </div>
        )
        : fornecedores?.map((f: any) => (
          <div key={f.id} className="bg-surface border border-border-accent rounded-lg border-l-4 border-l-primary p-4 cursor-pointer hover:bg-surface2 transition-colors" onClick={() => openEdit(f)}>
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold text-sm text-text">{f.razaoSocial}</p>
              <span className={`px-2 py-0.5 text-[10px] font-mono border rounded ${f.ativo ? 'border-success/30 text-success bg-success/10' : 'border-text-muted/30 text-text-muted bg-surface3'}`}>
                {f.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="text-xs text-text-dim font-mono">{f.cnpj}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-text-muted">
              {f.telefone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-text-dim" />{f.telefone}</span>}
              {f.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-text-dim" />{f.email}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-surface border-border-accent text-text">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text">
              {editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label className="text-text-muted">CNPJ *</Label>
              <div className="relative">
                <Input 
                  value={formData.cnpj || ""} 
                  onChange={(e) => handleCnpjLookup(maskCNPJ(e.target.value))} 
                  placeholder="00.000.000/0000-00" 
                  maxLength={18}
                  className="bg-surface3 border-border focus:border-primary text-text font-mono"
                  disabled={loadingCnpj}
                />
                {loadingCnpj && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />}
              </div>
            </div>

            {formData.situacao_receita && (
              <div className={`p-3 border rounded-md flex items-center gap-2 text-sm ${
                formData.situacao_receita.toLowerCase() === 'ativa' 
                  ? 'bg-success/10 border-success/30 text-success' 
                  : 'bg-danger/10 border-danger/30 text-danger'
              }`}>
                {formData.situacao_receita.toLowerCase() === 'ativa' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span className="font-semibold">Situação RFB: {formData.situacao_receita}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-text-muted">Razão Social *</Label>
              <Input value={formData.razaoSocial || ""} onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })} className="bg-surface3 border-border text-text" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-text-muted">Nome Fantasia</Label>
              <Input value={formData.nomeFantasia || ""} onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })} className="bg-surface3 border-border text-text" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-text-muted">Telefone</Label>
                <Input value={formData.telefone || ""} onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })} className="bg-surface3 border-border text-text" />
              </div>
              <div className="space-y-2">
                <Label className="text-text-muted">WhatsApp</Label>
                <Input value={formData.whatsapp || ""} onChange={(e) => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })} className="bg-surface3 border-border text-text" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-text-muted">Email</Label>
              <Input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-surface3 border-border text-text" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label className="text-text-muted">CEP</Label>
                <div className="relative">
                  <Input value={formData.cep || ""} onChange={(e) => handleCepLookup(maskCEP(e.target.value))} maxLength={9} className="bg-surface3 border-border text-text" />
                  {loadingCep && <Loader2 className="absolute right-2 top-2.5 h-3 w-3 animate-spin text-primary" />}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label className="text-text-muted">Endereço</Label>
                <Input value={formData.endereco || ""} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} className="bg-surface3 border-border text-text" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-text-muted">Cidade</Label>
                <Input value={formData.cidade || ""} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} className="bg-surface3 border-border text-text" />
              </div>
              <div className="space-y-2 col-span-1">
                <Label className="text-text-muted">UF</Label>
                <Select value={formData.estado || ""} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                  <SelectTrigger className="bg-surface3 border-border text-text">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-border text-text">
                    {ESTADOS_BR.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-text-muted">Observações</Label>
              <Textarea value={formData.observacoes || ""} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} className="bg-surface3 border-border text-text resize-none" />
            </div>
          </div>
          
          <DialogFooter className="border-t border-border pt-4 mt-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)} className="text-text-muted hover:text-text hover:bg-surface3">Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.razaoSocial || !formData.cnpj || createFornecedor.isPending || updateFornecedor.isPending} className="bg-primary hover:bg-primary-dim text-white">
              {(createFornecedor.isPending || updateFornecedor.isPending) ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar Fornecedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
