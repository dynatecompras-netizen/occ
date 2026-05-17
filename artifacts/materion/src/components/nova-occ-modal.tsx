import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  useCreateOcc,
  useListTemplates,
  useListOccs,
  useCriarOccDeTemplate,
  useDuplicarOcc,
  useListFornecedores,
  useListEmpresas,
  useListSetores,
  useListCategorias,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Files, Copy, Star, AlertCircle } from "lucide-react";

interface NovaOccModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    Rascunho: "bg-slate-100 text-slate-700",
    Aberta: "bg-blue-100 text-blue-700",
    Aprovada: "bg-green-100 text-green-700",
    Enviada: "bg-purple-100 text-purple-700",
    "Concluída": "bg-emerald-100 text-emerald-700",
    Cancelada: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function NovaOccModal({ open, onOpenChange }: NovaOccModalProps) {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [tab, setTab] = useState("zero");

  const [prioridade, setPrioridade] = useState("Normal");
  const [fornecedorId, setFornecedorId] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [setorId, setSetorId] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const { data: fornecedores } = useListFornecedores();
  const { data: empresas } = useListEmpresas();
  const { data: setores } = useListSetores();
  const { data: templates, isLoading: loadingTemplates } = useListTemplates();
  const { data: occs, isLoading: loadingOccs } = useListOccs();

  const createOcc = useCreateOcc({
    mutation: {
      onSuccess: (occ) => {
        qc.invalidateQueries({ queryKey: ["/api/occs"] });
        onOpenChange(false);
        navigate(`/occs/${occ.id}`);
      },
    },
  });

  const criarDeTemplate = useCriarOccDeTemplate({
    mutation: {
      onSuccess: (occ) => {
        qc.invalidateQueries({ queryKey: ["/api/occs"] });
        onOpenChange(false);
        navigate(`/occs/${occ.id}`);
      },
    },
  });

  const duplicar = useDuplicarOcc({
    mutation: {
      onSuccess: (occ) => {
        qc.invalidateQueries({ queryKey: ["/api/occs"] });
        onOpenChange(false);
        navigate(`/occs/${occ.id}`);
      },
    },
  });

  function handleCreateFromZero() {
    createOcc.mutate({
      data: {
        prioridade,
        fornecedorId: fornecedorId ? parseInt(fornecedorId) : undefined,
        empresaId: empresaId ? parseInt(empresaId) : undefined,
        setorId: setorId ? parseInt(setorId) : undefined,
        observacoes: observacoes || undefined,
        status: "Rascunho",
      },
    });
  }

  function handleFromTemplate(templateId: number) {
    criarDeTemplate.mutate({
      templateId,
      data: { prioridade: "Normal" },
    });
  }

  function handleDuplicate(occId: number) {
    duplicar.mutate({ id: occId });
  }

  const loading = createOcc.isPending || criarDeTemplate.isPending || duplicar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">Nova Ordem de Compra</DialogTitle>
          <DialogDescription>
            Escolha como deseja criar a nova OCC.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs value={tab} onValueChange={setTab} className="mt-4">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="zero" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Do Zero</span>
                <span className="sm:hidden">Zero</span>
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Files className="h-4 w-4" />
                <span className="hidden sm:inline">De Template</span>
                <span className="sm:hidden">Template</span>
              </TabsTrigger>
              <TabsTrigger value="duplicar" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Copy className="h-4 w-4" />
                Duplicar
              </TabsTrigger>
            </TabsList>

            {/* Do Zero */}
            <TabsContent value="zero" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Crie uma OCC em branco e adicione itens manualmente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Prioridade</Label>
                  <Select value={prioridade} onValueChange={setPrioridade}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fornecedor (opcional)</Label>
                  <Select value={fornecedorId} onValueChange={setFornecedorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {fornecedores?.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Empresa (opcional)</Label>
                  <Select value={empresaId} onValueChange={setEmpresaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {empresas?.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Setor (opcional)</Label>
                  <Select value={setorId} onValueChange={setSetorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {setores?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Observações (opcional)</Label>
                <Input
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações iniciais..."
                />
              </div>
              {createOcc.isError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Erro ao criar OCC. Tente novamente.
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateFromZero} disabled={loading}>
                  {loading ? "Criando..." : "Criar OCC"}
                </Button>
              </div>
            </TabsContent>

            {/* De Template */}
            <TabsContent value="template" className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Selecione um template para pré-preencher a OCC com estrutura e itens padrão.
              </p>
              {loadingTemplates ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : templates?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Files className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum template disponível.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {templates?.map((t) => (
                    <Card
                      key={t.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => handleFromTemplate(t.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-medium text-sm line-clamp-2 flex-1">{t.nome}</span>
                          {t.favorito && <Star className="h-4 w-4 text-yellow-500 fill-yellow-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {t.tipo === "completo" ? "Com itens" : "Estrutura"}
                          </Badge>
                          {(t.usoCount ?? 0) > 0 && (
                            <span className="text-xs text-muted-foreground">{t.usoCount} usos</span>
                          )}
                        </div>
                        {t.fornecedorPadraoNome && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{t.fornecedorPadraoNome}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {(criarDeTemplate.isError) && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md mt-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Erro ao criar OCC a partir do template.
                </div>
              )}
            </TabsContent>

            {/* Duplicar */}
            <TabsContent value="duplicar" className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Selecione uma OCC existente para duplicar. O status será redefinido para Rascunho.
              </p>
              {loadingOccs ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : occs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma OCC disponível para duplicar.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {occs?.map((occ) => (
                    <div
                      key={occ.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleDuplicate(occ.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{occ.numero}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {occ.fornecedorNome || "Sem fornecedor"} · {occ.setorNome || "Sem setor"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(occ.status)}`}>
                          {occ.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {duplicar.isError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md mt-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Erro ao duplicar OCC. Tente novamente.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
