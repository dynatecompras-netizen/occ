const API_BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || "Erro no servidor") as any;
    error.status = res.status;
    error.code = data.code;
    error.details = data.details;
    throw error;
  }
  return data;
}

export const api = {
  // Dashboard
  getDashboard: () => request<any>("/dashboard"),
  // OCCs
  listOccs: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any>(`/occs${qs}`);
  },
  getOcc: (id: number) => request<any>(`/occs/${id}`),
  createOcc: (data: any) => request<any>("/occs", { method: "POST", body: JSON.stringify(data) }),
  updateOcc: (id: number, data: any) => request<any>(`/occs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  patchOccStatus: (id: number, data: any) => request<any>(`/occs/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),
  duplicateOcc: (id: number) => request<any>(`/occs/${id}/duplicate`, { method: "POST" }),
  deleteOcc: (id: number) => request<void>(`/occs/${id}`, { method: "DELETE" }),
  // OCC Items
  listOccItems: (occId: number) => request<any[]>(`/occs/${occId}/items`),
  createOccItem: (occId: number, data: any) => request<any>(`/occs/${occId}/items`, { method: "POST", body: JSON.stringify(data) }),
  updateOccItem: (occId: number, itemId: number, data: any) => request<any>(`/occs/${occId}/items/${itemId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteOccItem: (occId: number, itemId: number) => request<void>(`/occs/${occId}/items/${itemId}`, { method: "DELETE" }),
  // Fornecedores
  listFornecedores: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any[]>(`/fornecedores${qs}`);
  },
  getFornecedor: (id: number) => request<any>(`/fornecedores/${id}`),
  createFornecedor: (data: any) => request<any>("/fornecedores", { method: "POST", body: JSON.stringify(data) }),
  updateFornecedor: (id: number, data: any) => request<any>(`/fornecedores/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteFornecedor: (id: number) => request<void>(`/fornecedores/${id}`, { method: "DELETE" }),
  // Materiais
  listMateriais: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any[]>(`/materiais${qs}`);
  },
  getMaterial: (id: number) => request<any>(`/materiais/${id}`),
  createMaterial: (data: any) => request<any>("/materiais", { method: "POST", body: JSON.stringify(data) }),
  updateMaterial: (id: number, data: any) => request<any>(`/materiais/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMaterial: (id: number) => request<void>(`/materiais/${id}`, { method: "DELETE" }),
  listCategorias: () => request<string[]>("/materiais-categorias"),
  // Templates
  listTemplates: () => request<any[]>("/templates"),
  getTemplate: (id: number) => request<any>(`/templates/${id}`),
  createTemplate: (data: any) => request<any>("/templates", { method: "POST", body: JSON.stringify(data) }),
  updateTemplate: (id: number, data: any) => request<any>(`/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  useTemplate: (id: number, data: any) => request<any>(`/templates/${id}/use`, { method: "POST", body: JSON.stringify(data) }),
  toggleFavorite: (id: number, favorito: boolean) => request<any>(`/templates/${id}/favorite`, { method: "PATCH", body: JSON.stringify({ favorito }) }),
  deleteTemplate: (id: number) => request<void>(`/templates/${id}`, { method: "DELETE" }),
  // Preço Histórico
  listPrecoHistorico: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any[]>(`/preco-historico${qs}`);
  },
  getPrecoHistoricoMaterial: (materialId: number) => request<any[]>(`/preco-historico/${materialId}`),
  createPrecoHistorico: (data: any) => request<any>("/preco-historico", { method: "POST", body: JSON.stringify(data) }),
};
