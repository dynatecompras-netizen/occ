import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: () => api.getDashboard() });
}

// ─── OCCs ────────────────────────────────────────────────────────────────────
export function useOccs(params?: Record<string, string>) {
  return useQuery({ queryKey: ["occs", params], queryFn: () => api.listOccs(params) });
}

export function useOcc(id: number) {
  return useQuery({ queryKey: ["occ", id], queryFn: () => api.getOcc(id), enabled: id > 0 });
}

export function useCreateOcc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createOcc(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["occs"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}

export function useUpdateOcc(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.updateOcc(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["occ", id] }); qc.invalidateQueries({ queryKey: ["occs"] }); },
  });
}

export function usePatchOccStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string; comentario?: string }) => api.patchOccStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["occ", id] });
      qc.invalidateQueries({ queryKey: ["occs"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDuplicateOcc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.duplicateOcc(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["occs"] }); },
  });
}

export function useDeleteOcc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteOcc(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["occs"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}

// ─── OCC Items ───────────────────────────────────────────────────────────────
export function useCreateOccItem(occId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createOccItem(occId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["occ", occId] }); },
  });
}

export function useUpdateOccItem(occId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: any }) => api.updateOccItem(occId, itemId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["occ", occId] }); },
  });
}

export function useDeleteOccItem(occId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => api.deleteOccItem(occId, itemId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["occ", occId] }); },
  });
}

// ─── Fornecedores ────────────────────────────────────────────────────────────
export function useFornecedores(params?: Record<string, string>) {
  return useQuery({ queryKey: ["fornecedores", params], queryFn: () => api.listFornecedores(params) });
}

export function useFornecedor(id: number) {
  return useQuery({ queryKey: ["fornecedor", id], queryFn: () => api.getFornecedor(id), enabled: id > 0 });
}

export function useCreateFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createFornecedor(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}

export function useUpdateFornecedor(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.updateFornecedor(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedor", id] }); qc.invalidateQueries({ queryKey: ["fornecedores"] }); },
  });
}

export function useDeleteFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteFornecedor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}

// ─── Materiais ───────────────────────────────────────────────────────────────
export function useMateriais(params?: Record<string, string>) {
  return useQuery({ queryKey: ["materiais", params], queryFn: () => api.listMateriais(params) });
}

export function useMaterial(id: number) {
  return useQuery({ queryKey: ["material", id], queryFn: () => api.getMaterial(id), enabled: id > 0 });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createMaterial(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materiais"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}

export function useUpdateMaterial(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.updateMaterial(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["material", id] }); qc.invalidateQueries({ queryKey: ["materiais"] }); },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteMaterial(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materiais"] }); },
  });
}

export function useCategorias() {
  return useQuery({ queryKey: ["categorias"], queryFn: () => api.listCategorias() });
}

// ─── Templates ───────────────────────────────────────────────────────────────
export function useTemplates() {
  return useQuery({ queryKey: ["templates"], queryFn: () => api.listTemplates() });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createTemplate(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); },
  });
}

export function useUseTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.useTemplate(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); qc.invalidateQueries({ queryKey: ["occs"] }); },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, favorito }: { id: number; favorito: boolean }) => api.toggleFavorite(id, favorito),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); },
  });
}

// ─── Preço Histórico ─────────────────────────────────────────────────────────
export function usePrecoHistorico(params?: Record<string, string>) {
  return useQuery({ queryKey: ["preco-historico", params], queryFn: () => api.listPrecoHistorico(params) });
}

export function usePrecoHistoricoMaterial(materialId: number) {
  return useQuery({
    queryKey: ["preco-historico", materialId],
    queryFn: () => api.getPrecoHistoricoMaterial(materialId),
    enabled: materialId > 0,
  });
}
