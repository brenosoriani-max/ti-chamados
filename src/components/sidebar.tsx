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
  BookOpenText,
  BarChart3,
  Database,
} from "lucide-react";
import { Role } from "@/types";
import { logoutAction } from "@/app/actions";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: any;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const primaryNav = [
    { href: "/cliente", label: "Novo Chamado", icon: PlusCircle, show: user?.role === Role.CLIENTE || user?.role === Role.ADMIN },
    { href: "/tickets", label: "Meus Chamados", icon: Ticket, show: true },
    { href: "/admin/conhecimento", label: "Base de Conhecimento", icon: BookOpenText, show: user?.role === Role.ADMIN || user?.role === Role.TECNICO },
    { href: "/suporte", label: "Fila de Suporte", icon: Layout, show: user?.role === Role.TECNICO || user?.role === Role.ADMIN },
    { href: "/terminais", label: "Terminais", icon: MonitorDot, show: user?.role === Role.TECNICO || user?.role === Role.ADMIN },
  ].filter((i) => i.show);

  const adminNav = [
    { href: "/admin", label: "Dashboard Admin", icon: LayoutDashboard, show: user?.role === Role.ADMIN },
    { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, show: user?.role === Role.ADMIN },
    { href: "/admin/usuarios", label: "Gestão de Equipe", icon: Users, show: user?.role === Role.ADMIN },
    { href: "/admin/backup", label: "Backup", icon: Database, show: user?.role === Role.ADMIN },
  ].filter((i) => i.show);

  return (
    <aside className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border/60 hidden lg:flex flex-col z-40 shadow-[0_0_0_1px_rgba(148,163,184,0.06)]">
      <div className="h-16 flex items-center justify-between gap-3 px-5 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/95 flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20 ring-1 ring-primary/20">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[11px] tracking-[0.18em] text-foreground uppercase truncate">Contec</span>
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.22em] -mt-0.5 truncate">Chamados</span>
          </div>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
      </div>

      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-7">
        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.22em] mb-2">Principal</p>
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                pathname === item.href
                  ? "bg-primary/8 text-primary ring-1 ring-primary/10 shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
                    pathname === item.href
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-border/60 bg-background text-muted-foreground/80 group-hover:border-border group-hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="truncate">{item.label}</span>
              </div>
              {pathname === item.href && <ChevronRight className="h-4 w-4 opacity-70 shrink-0" />}
            </Link>
          ))}
        </div>

        {adminNav.length > 0 && (
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.22em] mb-2">Gerenciamento</p>
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === item.href
                    ? "bg-primary/8 text-primary ring-1 ring-primary/10 shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
                      pathname === item.href
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border/60 bg-background text-muted-foreground/80 group-hover:border-border group-hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
                {pathname === item.href && <ChevronRight className="h-4 w-4 opacity-70 shrink-0" />}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 mt-auto border-t border-border/60">
        <div className="bg-muted/35 rounded-2xl p-3 border border-border/50">
          <form action={logoutAction}>
            <button className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-background border border-border/60 text-[11px] font-semibold text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive/20 transition-all duration-300">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
