"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  LogOut, 
  ChevronRight, 
  PlusCircle, 
  MonitorDot,
  ShieldCheck,
  Layout,
  Menu,
  X,
  BookOpenText,
  BarChart3,
  Database,
} from "lucide-react";
import { Role } from "@/types";
import { logoutAction } from "@/app/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  user: any;
}

export function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const primaryNav = [
    { href: "/cliente", label: "Novo Chamado", icon: PlusCircle, show: user?.role === Role.CLIENTE || user?.role === Role.ADMIN },
    { href: "/tickets", label: "Meus Chamados", icon: Ticket, show: true },
    { href: "/admin/conhecimento", label: "Base de Conhecimento", icon: BookOpenText, show: user?.role === Role.ADMIN || user?.role === Role.TECNICO },
    { href: "/suporte", label: "Fila de Suporte", icon: Layout, show: user?.role === Role.TECNICO || user?.role === Role.ADMIN },
    { href: "/terminais", label: "Terminais", icon: MonitorDot, show: user?.role === Role.TECNICO || user?.role === Role.ADMIN },
  ].filter(i => i.show);

  const adminNav = [
    { href: "/admin", label: "Dashboard Admin", icon: LayoutDashboard, show: user?.role === Role.ADMIN },
    { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, show: user?.role === Role.ADMIN },
    { href: "/admin/usuarios", label: "Gestão de Equipe", icon: Users, show: user?.role === Role.ADMIN },
    { href: "/admin/backup", label: "Backup", icon: Database, show: user?.role === Role.ADMIN },
  ].filter(i => i.show);

  return (
    <>
      {/* Sticky Top Mobile Header */}
      <header className="sticky top-0 z-30 flex lg:hidden h-16 items-center justify-between border-b border-border/50 bg-card px-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-2 -ml-2 rounded-xl border border-border/40 hover:bg-muted transition-all text-muted-foreground mr-1"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-foreground">TI-Chamados</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary border border-primary/25">
            {user?.name?.charAt(0)}
          </div>
        </div>
      </header>

      {/* Slide-out Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-card border-r border-border/50 flex flex-col z-50 transform lg:hidden transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground uppercase">TI-Chamados</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest -mt-1">Service Desk</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 px-1.5 rounded-lg border border-border/40 hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">Principal</p>
            {primaryNav.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                  pathname === item.href 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-4.5 w-4.5", pathname === item.href ? "text-primary-foreground" : "text-muted-foreground/80 group-hover:text-foreground")} />
                  {item.label}
                </div>
                {pathname === item.href && <ChevronRight className="h-4 w-4 opacity-70" />}
              </Link>
            ))}
          </div>

          {adminNav.length > 0 && (
            <div className="space-y-1">
              <p className="px-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">Gerenciamento</p>
              {adminNav.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                    pathname === item.href 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-4.5 w-4.5", pathname === item.href ? "text-primary-foreground" : "text-muted-foreground/80 group-hover:text-foreground")} />
                    {item.label}
                  </div>
                  {pathname === item.href && <ChevronRight className="h-4 w-4 opacity-70" />}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 mt-auto border-t border-border/20 bg-muted/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary border border-primary/10">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-foreground leading-none mb-1">{user?.name}</p>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">{user?.role}</p>
              </div>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-background border border-border/60 text-xs font-bold text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive/20 transition-all duration-300">
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
