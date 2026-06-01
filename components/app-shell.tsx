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
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:block">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <Gauge className="h-5 w-5 text-primary" />
          <span className="font-semibold">TI Chamados</span>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <Link href="/admin#usuarios" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            <Users className="h-4 w-4" />
            Usuarios
          </Link>
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar chamado, cliente, tag ou categoria" />
          </div>
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div className="hidden text-right text-sm sm:block">
            <p className="font-medium">{user?.name ?? "Visitante"}</p>
            <p className="text-xs text-muted-foreground">{user?.role ?? "Sem sessao"}</p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
