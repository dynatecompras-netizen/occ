import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FileText, Files, Building2, Box, TrendingUp,
  Menu, LogOut, Sun, Moon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { useTheme } from "@/contexts/theme-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/occs", label: "Ordens de Compra", icon: FileText },
  { href: "/templates", label: "Templates", icon: Files },
  { href: "/fornecedores", label: "Fornecedores", icon: Building2 },
  { href: "/materiais", label: "Materiais", icon: Box },
  { href: "/historico-precos", label: "Histórico de Preços", icon: TrendingUp },
];

const bottomNavItems = navItems.slice(0, 5);

function NavLinks({ onNav }: { onNav?: () => void }) {
  const [location] = useLocation();
  return (
    <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
      {navItems.map((item) => {
        const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.href} href={item.href} onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { mode, toggleMode } = useTheme();

  useEffect(() => { setMobileOpen(false); }, [location]);

  const currentPage = navItems.find((item) =>
    item.href === "/" ? location === "/" : location.startsWith(item.href)
  )?.label ?? "MATERION";

  return (
    <div className="flex h-screen w-full bg-background font-sans">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r bg-card flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">MATERION</span>
          </div>
        </div>
        <NavLinks />
        <div className="p-3 border-t shrink-0 space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={toggleMode}>
            {mode === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {mode === "dark" ? "Modo Claro" : "Modo Escuro"}
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="h-16 flex flex-row items-center px-6 border-b shrink-0">
            <SheetTitle className="font-bold text-lg tracking-tight">MATERION</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col flex-1 h-[calc(100%-4rem)]">
            <NavLinks onNav={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 md:h-16 border-b bg-card flex items-center px-4 md:px-6 justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-sm md:hidden truncate">{currentPage}</span>
            <span className="hidden md:block text-sm text-muted-foreground">Sistema de Compras ERP</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:flex" onClick={toggleMode}>
              {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
              US
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-muted/30">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex items-center justify-around px-1 py-1 safe-area-pb">
        {bottomNavItems.map((item) => {
          const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
