import { Bell, Search } from "lucide-react";
import { getFreshSessionUser } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getFreshSessionUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <Sidebar user={user} />

      {/* Navigation for Mobile */}
      <MobileNav user={user} />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 hidden lg:flex h-16 items-center justify-between gap-8 bg-background border-b border-border/50 px-8">
          <form action="/tickets" method="GET" className="relative max-w-xl flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input 
              name="q"
              className="w-full bg-muted/50 border-transparent focus:bg-background transition-all rounded-xl h-10 text-sm" 
              placeholder="Pesquisar..." 
            />
          </form>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl border border-border/40 hover:bg-muted transition-all text-muted-foreground">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}