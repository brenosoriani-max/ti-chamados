import { Role } from "@prisma/client";
import { UserPlus, Users, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createUserAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) redirect("/cliente");

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <AppShell>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
            <p className="text-sm text-muted-foreground">Gerencie o acesso dos colaboradores ao sistema.</p>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <Card className="border-none shadow-sm bg-card/60 overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/20">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Equipe</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                <THead className="bg-muted/30">
                  <TR className="hover:bg-transparent border-b border-border/40">
                    <TH className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left">Nome</TH>
                    <TH className="py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Perfil</TH>
                    <TH className="py-3 text-right pr-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ações</TH>
                  </TR>
                </THead>
                <TBody>
                  {users.map((user) => (
                    <TR key={user.id} className="group border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                      <TD className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium truncate">{user.email}</p>
                          </div>
                        </div>
                      </TD>
                      <TD className="py-4 text-center">
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tight",
                          user.role === "ADMIN" ? "bg-red-500/10 text-red-500" : 
                          user.role === "TECNICO" ? "bg-blue-500/10 text-blue-500" : 
                          "bg-emerald-500/10 text-emerald-500"
                        )}>
                          {user.role}
                        </span>
                      </TD>
                      <TD className="py-4 text-right pr-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card className="border-none shadow-sm bg-card/60">
              <CardHeader className="px-6 py-4 border-b border-border/20">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Cadastrar</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form action={createUserAction} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome</label>
                    <Input name="name" placeholder="Nome Completo" className="h-10 bg-background border-transparent focus:border-primary/20 rounded-lg text-xs" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail</label>
                    <Input name="email" type="email" placeholder="email@empresa.com" className="h-10 bg-background border-transparent focus:border-primary/20 rounded-lg text-xs" required />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Perfil</label>
                      <Select name="role" defaultValue="CLIENTE" required className="h-10 bg-background border-transparent focus:border-primary/20 rounded-lg text-xs">
                        <option value="CLIENTE">Colaborador</option>
                        <option value="TECNICO">Técnico</option>
                        <option value="ADMIN">Administrador</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha</label>
                      <Input name="password" type="password" placeholder="••••••••" className="h-10 bg-background border-transparent focus:border-primary/20 rounded-lg text-xs" />
                    </div>
                  </div>
                  <Button className="w-full h-11 rounded-lg text-[10px] font-bold uppercase tracking-widest mt-4">
                    Adicionar Usuário
                  </Button>
                </form>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
