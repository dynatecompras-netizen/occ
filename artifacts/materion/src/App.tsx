import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ThemeProvider } from "@/contexts/theme-context";

import Dashboard from "@/pages/dashboard";
import OccsList from "@/pages/occs";
import OccDetail from "@/pages/occ-detail";
import FornecedoresList from "@/pages/fornecedores";
import MateriaisList from "@/pages/materiais";
import TemplatesList from "@/pages/templates";
import HistoricoPrecos from "@/pages/historico-precos";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/occs" component={OccsList} />
        <Route path="/occs/:id" component={OccDetail} />
        <Route path="/fornecedores" component={FornecedoresList} />
        <Route path="/materiais" component={MateriaisList} />
        <Route path="/templates" component={TemplatesList} />
        <Route path="/historico-precos" component={HistoricoPrecos} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
