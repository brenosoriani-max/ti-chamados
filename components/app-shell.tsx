import Link from "next/link";
import { Bell, Gauge, LifeBuoy, Search, Shield, Ticket, Users } from "lucide-react";
import { getFreshSessionUser } from "@/lib/auth";
import { Input } from "@/components/ui/input";

const nav = [
  { href: "/cliente", label: "Cliente", icon: LifeBuoy },
  { href: "/suporte", label: "Suporte", icon: Ticket },
  { href: "/admin", label: "Admin", icon: Shield }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getFreshSessionUser();
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card/50 backdrop-blur-lg lg:block">
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl premium-gradient text-white shadow-lg shadow-teal-500/20">
            <Gauge className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">TI Chamados</span>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Menu Principal</p>
          {nav.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary active:scale-[0.98]"
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          ))}
          <div className="my-4 border-t border-border/50" />
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Gerenciamento</p>
          <Link 
            href="/admin#usuarios" 
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary active:scale-[0.98]"
          >
            <Users className="h-4.5 w-4.5" />
            Usuarios
          </Link>
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 glass-header px-6">
          <div className="relative max-w-xl flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input 
              className="w-full bg-muted/50 pl-10 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all rounded-full h-10" 
              placeholder="Buscar chamado, cliente, tag ou categoria..." 
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-background animate-pulse" />
            </button>
            <div className="h-8 w-[1px] bg-border/50" />
            <div className="flex items-center gap-3 pl-1">
              <div className="hidden text-right text-sm sm:block">
                <p className="font-semibold leading-none">{user?.name ?? "Visitante"}</p>
                <p className="text-[10px] font-medium uppercase tracking-tighter text-muted-foreground mt-1 px-1.5 py-0.5 rounded-md bg-muted select-none">{user?.role ?? "Sem sessao"}</p>
              </div>
              <div className="h-10 w-10 rounded-full premium-gradient p-[2px]">
                <div className="h-full w-full rounded-full bg-card flex items-center justify-center font-bold text-primary">
                  {user?.name?.charAt(0) ?? "V"}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
