import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import OccsList from "@/pages/occs";
import OccDetail from "@/pages/occ-detail";
import FornecedoresList from "@/pages/fornecedores";
import MateriaisList from "@/pages/materiais";
import TemplatesList from "@/pages/templates";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
