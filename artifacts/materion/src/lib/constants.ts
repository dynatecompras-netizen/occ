// ─── Status ──────────────────────────────────────────────────────────────────
export const STATUS_FLOW = [
  "Rascunho", "Enviada", "Em Negociação", "Respondida", "Aprovada",
  "Comprada", "Em Produção", "Em Rota", "Recebida", "Finalizada",
] as const;

export type OccStatus = (typeof STATUS_FLOW)[number];

export const STATUS_CONFIG: Record<OccStatus, { color: string; bg: string; dot: string; label: string }> = {
  "Rascunho":       { color: "text-gray-600",    bg: "bg-gray-100",    dot: "#94a3b8", label: "Rascunho" },
  "Enviada":        { color: "text-blue-600",    bg: "bg-blue-100",    dot: "#3b82f6", label: "Enviada" },
  "Em Negociação":  { color: "text-yellow-600",  bg: "bg-yellow-100",  dot: "#eab308", label: "Em Negociação" },
  "Respondida":     { color: "text-orange-600",  bg: "bg-orange-100",  dot: "#f97316", label: "Respondida" },
  "Aprovada":       { color: "text-green-600",   bg: "bg-green-100",   dot: "#22c55e", label: "Aprovada" },
  "Comprada":       { color: "text-cyan-600",    bg: "bg-cyan-100",    dot: "#06b6d4", label: "Comprada" },
  "Em Produção":    { color: "text-purple-600",  bg: "bg-purple-100",  dot: "#a855f7", label: "Em Produção" },
  "Em Rota":        { color: "text-pink-600",    bg: "bg-pink-100",    dot: "#ec4899", label: "Em Rota" },
  "Recebida":       { color: "text-emerald-600", bg: "bg-emerald-100", dot: "#10b981", label: "Recebida" },
  "Finalizada":     { color: "text-slate-600",   bg: "bg-slate-200",   dot: "#475569", label: "Finalizada" },
};

// ─── Priority ────────────────────────────────────────────────────────────────
export const PRIORIDADES = ["Baixa", "Normal", "Alta", "Urgente"] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export const PRIORIDADE_CONFIG: Record<Prioridade, { color: string; bg: string; pulse?: boolean }> = {
  "Baixa":   { color: "text-gray-600",   bg: "bg-gray-100" },
  "Normal":  { color: "text-blue-600",   bg: "bg-blue-100" },
  "Alta":    { color: "text-orange-600", bg: "bg-orange-100" },
  "Urgente": { color: "text-red-600",    bg: "bg-red-100", pulse: true },
};

// ─── Units ───────────────────────────────────────────────────────────────────
export const UNIDADES = ["un", "cx", "kg", "lt", "mt", "rl", "pc", "pr", "rs", "m²", "m³"] as const;

// ─── Material Categories ─────────────────────────────────────────────────────
export const CATEGORIAS = ["Fixadores", "Elétrico", "Hidráulico", "Ferramentas", "EPI", "Outros"] as const;

// ─── Template Types ──────────────────────────────────────────────────────────
export const TIPOS_TEMPLATE = ["Recorrente", "Urgente", "Padrão", "Personalizado"] as const;

// ─── Brazilian States ────────────────────────────────────────────────────────
export const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;
