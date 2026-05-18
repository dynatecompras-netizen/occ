import { useState } from "react";
import { useTemplates, useCreateTemplate, useToggleFavorite, useDeleteTemplate, useUseTemplate, useFornecedores } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, StarOff, Trash2, FileText, Play } from "lucide-react";
import { TIPOS_TEMPLATE, PRIORIDADES } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import { useLocation } from "wouter";
import { toast } from "sonner";

const TIPO_COLORS: Record<string, string> = {
  "Recorrente": "bg-blue-100 text-blue-700",
  "Urgente": "bg-red-100 text-red-700",
  "Padrão": "bg-gray-100 text-gray-700",
  "Personalizado": "bg-purple-100 text-purple-700",
};

export default function TemplatesList() {
  const [formOpen, setFormOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [useFornecedorId, setUseFornecedorId] = useState("");
  const [usePrioridade, setUsePrioridade] = useState("Normal");
  const [, navigate] = useLocation();

  const { data: templates, isLoading } = useTemplates();
  const { data: fornecedores } = useFornecedores({ ativo: "true" });
  const createTemplate = useCreateTemplate();
  const toggleFav = useToggleFavorite();
  const deleteTemplate = useDeleteTemplate();
  const useTemplate = useUseTemplate();

  const favorites = templates?.filter((t: any) => t.favorito) || [];
  const others = templates?.filter((t: any) => !t.favorito) || [];

  function handleCreate() {
    createTemplate.mutate(formData, {
      onSuccess: () => { setFormOpen(false); setFormData({}); toast.success("Template criado!"); },
      onError: (err: any) => toast.error(err.message),
    });
  }

  function handleUse() {
    if (!useFornecedorId) { toast.error("Selecione um fornecedor"); return; }
    useTemplate.mutate(
      { id: selectedTemplate.id, data: { fornecedorId: parseInt(useFornecedorId), prioridade: usePrioridade } },
      {
        onSuccess: (data: any) => { setUseOpen(false); navigate(`/occs/${data.id}`); toast.success("OCC criada a partir do template!"); },
        onError: (err: any) => toast.error(err.message),
      },
    );
  }

  function TemplateCard({ template }: { template: any }) {
    return (
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{template.nome}</p>
              {template.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.descricao}</p>}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
              onClick={() => toggleFav.mutate({ id: template.id, favorito: !template.favorito })}>
              {template.favorito ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge variant="secondary" className={`text-[10px] ${TIPO_COLORS[template.tipo] || ""}`}>{template.tipo}</Badge>
            <span className="text-xs text-muted-foreground">{template.contagemUso} uso(s)</span>
            {template.fornecedorNome && <span className="text-xs text-muted-foreground">· {template.fornecedorNome}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="default" className="flex-1" onClick={() => { setSelectedTemplate(template); setUseFornecedorId(template.fornecedorId ? String(template.fornecedorId) : ""); setUseOpen(true); }}>
              <Play className="h-3.5 w-3.5 mr-1" />Usar
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteTemplate.mutate(template.id, { onSuccess: () => toast.success("Template excluído") })}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Modelos reutilizáveis para ordens de compra.</p>
        </div>
        <Button onClick={() => { setFormData({ tipo: "Padrão" }); setFormOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />Novo Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>)}
        </div>
      ) : !templates?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mb-3 opacity-40" />
          <p>Nenhum template cadastrado</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setFormData({ tipo: "Padrão" }); setFormOpen(true); }}>Criar primeiro template</Button>
        </div>
      ) : (
        <>
          {favorites.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500" />Favoritos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((t: any) => <TemplateCard key={t.id} template={t} />)}
              </div>
            </div>
          )}
          <div>
            {favorites.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Todos os Templates</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {others.map((t: any) => <TemplateCard key={t.id} template={t} />)}
            </div>
          </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nome *</Label><Input value={formData.nome || ""} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={formData.descricao || ""} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={2} /></div>
            <div className="space-y-1.5"><Label>Tipo</Label>
              <Select value={formData.tipo || "Padrão"} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_TEMPLATE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Fornecedor Padrão</Label>
              <Select value={formData.fornecedorId ? String(formData.fornecedorId) : ""} onValueChange={(v) => setFormData({ ...formData, fornecedorId: v ? parseInt(v) : null })}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent><SelectItem value="">Nenhum</SelectItem>{fornecedores?.map((f: any) => <SelectItem key={f.id} value={String(f.id)}>{f.razaoSocial}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!formData.nome || createTemplate.isPending}>{createTemplate.isPending ? "Criando..." : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use Template Dialog */}
      <Dialog open={useOpen} onOpenChange={setUseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Usar Template: {selectedTemplate?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Fornecedor *</Label>
              <Select value={useFornecedorId} onValueChange={setUseFornecedorId}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>{fornecedores?.map((f: any) => <SelectItem key={f.id} value={String(f.id)}>{f.razaoSocial}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Prioridade</Label>
              <Select value={usePrioridade} onValueChange={setUsePrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUseOpen(false)}>Cancelar</Button>
            <Button onClick={handleUse} disabled={useTemplate.isPending}>{useTemplate.isPending ? "Criando OCC..." : "Criar OCC"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
