import { useDashboard } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, Package, AlertTriangle } from "lucide-react";
import { STATUS_CONFIG, type OccStatus } from "@/lib/constants";
import { formatBRL, formatDate } from "@/lib/formatters";
import { Link } from "wouter";

export default function Dashboard() {
  const { data, isLoading } = useDashboard();

  const occsPorStatus: { status: string; total: number }[] = data?.occsPorStatus ?? [];
  const alertasEstoque: any[] = data?.alertasEstoque ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20 md:pb-6">
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
              { title: "Fornecedores Ativos", value: data?.totalFornecedores ?? 0, icon: <Users className="h-5 w-5" />, sub: "Cadastrados" },
              { title: "Materiais", value: data?.totalMateriais ?? 0, icon: <Package className="h-5 w-5" />, sub: "No catálogo" },
              { title: "Alertas de Estoque", value: alertasEstoque.length, icon: <AlertTriangle className="h-5 w-5" />, sub: "Abaixo do mínimo" },
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

      {/* Status Breakdown */}
      <Card>
        <CardHeader className="pb-3 px-4 md:px-6">
          <CardTitle className="text-sm font-semibold text-foreground">OCCs por Status</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          {isLoading ? <Skeleton className="h-24 w-full" /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {occsPorStatus.map((item) => {
                const cfg = STATUS_CONFIG[item.status as OccStatus];
                return (
                  <Link key={item.status} href={`/occs?status=${item.status}`}>
                    <div className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cfg?.dot || "#94a3b8" }} />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{item.status}</p>
                        <p className="text-lg font-bold">{item.total}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent OCCs */}
        <Card>
          <CardHeader className="pb-0 px-4 md:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Últimas OCCs</CardTitle>
              <Link href="/occs" className="text-xs text-primary hover:underline">Ver todas</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-3">
            {isLoading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !data?.occsRecentes?.length ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma OCC cadastrada.</div>
            ) : (
              <div className="divide-y divide-border">
                {data.occsRecentes.slice(0, 10).map((occ: any) => {
                  const cfg = STATUS_CONFIG[occ.status as OccStatus];
                  return (
                    <Link key={occ.id} href={`/occs/${occ.id}`}>
                      <div className="flex items-center justify-between px-4 md:px-6 py-3 hover:bg-muted/40 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <code className="text-xs font-mono font-semibold text-foreground shrink-0">{occ.numero}</code>
                          {occ.fornecedorNome && (
                            <span className="text-sm text-muted-foreground truncate hidden sm:block">{occ.fornecedorNome}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {occ.valorTotal > 0 && (
                            <span className="text-sm font-semibold text-foreground hidden sm:block">{formatBRL(occ.valorTotal)}</span>
                          )}
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: `${cfg?.dot || "#94a3b8"}18`, color: cfg?.dot || "#94a3b8" }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg?.dot || "#94a3b8" }} />
                            {occ.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card>
          <CardHeader className="pb-0 px-4 md:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas de Estoque Mínimo
              </CardTitle>
              <Link href="/materiais" className="text-xs text-primary hover:underline">Ver materiais</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-3">
            {isLoading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : alertasEstoque.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum material abaixo do estoque mínimo.</div>
            ) : (
              <div className="divide-y divide-border">
                {alertasEstoque.map((mat: any) => (
                  <div key={mat.id} className="flex items-center justify-between px-4 md:px-6 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{mat.nome}</p>
                      <p className="text-xs text-muted-foreground">{mat.codigo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-red-500">{mat.estoqueAtual} {mat.unidade}</p>
                      <p className="text-xs text-muted-foreground">Mín: {mat.estoqueMinimo}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
