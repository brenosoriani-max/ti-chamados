import { getFreshSessionUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getFreshSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-8 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 md:px-8">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input 
              type="search"
              placeholder="Pesquisar chamados, equipamentos ou usuários..." 
              className="w-full bg-muted/40 border-transparent focus:bg-background transition-all rounded-xl h-10 text-sm pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            
            <div className="h-8 w-[1px] bg-border/50 mx-2 hidden md:block" />
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-foreground leading-tight">{user.name}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">{user.role}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-xs text-primary border border-primary/20">
                {user.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
