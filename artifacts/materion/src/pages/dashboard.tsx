import React from "react";
import { useGetDashboardResumo } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Building2, Box, Files } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: resumo, isLoading } = useGetDashboardResumo();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de OCCs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo?.totalOccs || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fornecedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo?.totalFornecedores || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Materiais</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo?.totalMateriais || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Templates</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo?.totalTemplates || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">OCCs por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resumo?.occsPorStatus?.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.status}</span>
                  <span className="text-sm text-muted-foreground">{item.total}</span>
                </div>
              ))}
              {!resumo?.occsPorStatus?.length && (
                <div className="text-sm text-muted-foreground text-center py-4">Nenhum dado encontrado.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">OCCs Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resumo?.occsRecentes?.map((occ) => (
                <div key={occ.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <div className="text-sm font-medium">{occ.numero}</div>
                    <div className="text-xs text-muted-foreground">{occ.fornecedorNome || 'Sem fornecedor'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{occ.status}</div>
                    <div className="text-xs text-muted-foreground">{new Date(occ.criadoEm).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              ))}
              {!resumo?.occsRecentes?.length && (
                <div className="text-sm text-muted-foreground text-center py-4">Nenhuma OCC recente.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
