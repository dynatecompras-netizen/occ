import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Files, 
  Building2, 
  Box, 
  Settings,
  Menu,
  LogOut
} from "lucide-react";
import { Button } from "./ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/occs", label: "Ordens de Compra", icon: FileText },
  { href: "/templates", label: "Templates", icon: Files },
  { href: "/fornecedores", label: "Fornecedores", icon: Building2 },
  { href: "/materiais", label: "Materiais", icon: Box },
  { href: "/cadastros", label: "Cadastros", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b font-bold text-lg tracking-tight">
          MATERION
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location === item.href || (item.href !== "/" && location.startsWith(item.href))
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center px-4 md:px-6 justify-between shrink-0">
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
            <span className="ml-4 font-bold tracking-tight">MATERION</span>
          </div>
          <div className="hidden md:flex items-center text-sm text-muted-foreground">
            Sistema de Compras ERP
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
              US
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-muted/30">
          {children}
        </div>
      </main>
    </div>
  );
}
