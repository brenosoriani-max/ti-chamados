"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Gauge, LifeBuoy, Search, Shield, Ticket, Users, Menu, X, BarChart3, LogOut } from "lucide-react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: any;
}

export function Sidebar({ user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const nav = [
    { href: "/cliente", label: "Início", icon: LifeBuoy, show: user?.role === Role.CLIENTE || user?.role === Role.ADMIN },
    { href: "/tickets", label: "Meus Chamados", icon: Ticket, show: true },
    { href: "/suporte", label: "Fila de Suporte", icon: Gauge, show: user?.role === Role.TECNICO || user?.role === Role.ADMIN },
    { href: "/admin", label: "Dashboard", icon: Shield, show: user?.role === Role.ADMIN }
  ].filter(i => i.show);

  return (
    <>
      <div className="lg:hidden flex h-14 items-center justify-between px-6 bg-background border-b border-border/50 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-white">
            <Gauge className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">TI Chamados</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-muted-foreground p-1">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-background/60 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-card border-r border-border/50 z-50 transition-transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center gap-3 px-8 border-b border-border/40">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            <Gauge className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-sm tracking-tighter text-foreground">TI CHAMADOS</span>
        </div>
        
        <nav className="flex flex-col gap-1 p-4">
          {nav.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                pathname === item.href 
                  ? "bg-primary/5 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          ))}

          {user?.role === Role.ADMIN && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <Link 
                href="/admin/usuarios" 
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                  pathname === "/admin/usuarios" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Users className="h-4.5 w-4.5" />
                Equipe
              </Link>
            </div>
          )}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-muted/40 border border-border/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-foreground">{user?.name}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">{user?.role}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-background border border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
              <LogOut className="h-3 w-3" />
              Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
