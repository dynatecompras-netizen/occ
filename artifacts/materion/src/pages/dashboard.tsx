import React from "react";
import { useGetDashboardResumo } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import {
  ShoppingCart, Users, Package, LayoutTemplate, TrendingUp, AlertCircle,
  CheckCircle, Clock, Send,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Rascunho: "#94a3b8",
  Aberta:   "#3b82f6",
  Aprovada: "#10b981",
  Enviada:  "#8b5cf6",
  Concluída:"#22c55e",
  Cancelada:"#ef4444",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Rascunho: <Clock className="h-3 w-3" />,
  Aberta:   <TrendingUp className="h-3 w-3" />,
  Aprovada: <CheckCircle className="h-3 w-3" />,
  Enviada:  <Send className="h-3 w-3" />,
  Concluída:<CheckCircle className="h-3 w-3" />,
  Cancelada:<AlertCircle className="h-3 w-3" />,
};

const CHART_COLORS = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4"];

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      {label && <p className="font-medium text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }} className="font-semibold">
          {typeof p.value === "number" && p.value > 100 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { data, isLoading } = useGetDashboardResumo();
  const extra = data as any;

  const gastosPorMes: { mes: string; total: number }[] = extra?.gastosPorMes ?? [];
  const gastosPorFornecedor: { nome: string; total: number }[] = extra?.gastosPorFornecedor ?? [];
  const gastosPorCategoria: { nome: string; total: number }[] = extra?.gastosPorCategoria ?? [];
  const occsPorStatus: { status: string; total: number }[] = data?.occsPorStatus ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do sistema de compras.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            {[
              { title: "Ordens de Compra", value: data?.totalOccs ?? 0, icon: <ShoppingCart className="h-5 w-5" />, sub: "Total no sistema" },
              { title: "Gasto Este Mês", value: data?.valorTotalMes != null ? fmt(data.valorTotalMes) : "R$ 0", icon: <TrendingUp className="h-5 w-5" />, sub: "Em itens de OCC" },
              { title: "Fornecedores", value: data?.totalFornecedores ?? 0, icon: <Users className="h-5 w-5" />, sub: "Cadastrados" },
              { title: "Materiais", value: data?.totalMateriais ?? 0, icon: <Package className="h-5 w-5" />, sub: "No catálogo" },
            ].map((kpi) => (
              <Card key={kpi.title}>
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{kpi.title}</p>
                      <p className="text-xl md:text-2xl font-bold mt-1 text-foreground truncate">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{kpi.sub}</p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {kpi.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Charts Row 1: Monthly spending + Status pie */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm font-semibold text-foreground">Gastos por Mês</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-4">
            {isLoading ? <Skeleton className="h-48 w-full" /> : gastosPorMes.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={gastosPorMes} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} width={45} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorGastos)" name="Total" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm font-semibold text-foreground">OCCs por Status</CardTitle>
          </CardHeader>
          <CardContent className="px-1">
            {isLoading ? <Skeleton className="h-48 w-full" /> : occsPorStatus.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={occsPorStatus} cx="50%" cy="44%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="total" nameKey="status">
                    {occsPorStatus.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{value}</span>}
                    iconSize={7} iconType="circle"
                  />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: By supplier + by category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm font-semibold text-foreground">Gastos por Fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-4">
            {isLoading ? <Skeleton className="h-52 w-full" /> : gastosPorFornecedor.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={gastosPorFornecedor} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}>
                    {gastosPorFornecedor.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-4 md:px-6">
            <CardTitle className="text-sm font-semibold text-foreground">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-4">
            {isLoading ? <Skeleton className="h-52 w-full" /> : gastosPorCategoria.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
                Nenhuma OCC com categoria e preço registrados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={gastosPorCategoria} margin={{ top: 4, right: 4, left: 0, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="nome" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} width={42} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
                    {gastosPorCategoria.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent OCCs */}
      <Card>
        <CardHeader className="pb-0 px-4 md:px-6">
          <CardTitle className="text-sm font-semibold text-foreground">OCCs Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !data?.occsRecentes?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma OCC cadastrada.</div>
          ) : (
            <div className="divide-y divide-border">
              {data.occsRecentes.map((occ: any) => (
                <div key={occ.id} className="flex items-center justify-between px-4 md:px-6 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="text-xs font-mono font-semibold text-foreground shrink-0">{occ.numero}</code>
                    {occ.fornecedorNome && (
                      <span className="text-sm text-muted-foreground truncate hidden sm:block">{occ.fornecedorNome}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {occ.valorTotal != null && (
                      <span className="text-sm font-semibold text-foreground hidden sm:block">{fmt(occ.valorTotal)}</span>
                    )}
                    <Badge
                      variant="secondary"
                      className="text-xs flex items-center gap-1 shrink-0"
                      style={{
                        backgroundColor: `${STATUS_COLORS[occ.status]}18`,
                        color: STATUS_COLORS[occ.status],
                        borderColor: `${STATUS_COLORS[occ.status]}30`,
                      }}
                    >
                      {STATUS_ICONS[occ.status]}
                      {occ.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
