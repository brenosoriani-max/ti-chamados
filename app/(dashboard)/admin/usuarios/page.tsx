import { Role } from "@prisma/client";
import { UserPlus, Users, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

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
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Users className="h-3 w-3" />
            Configurações
          </div>
          <h1 className="text-3xl font-black tracking-tight">Gestão de Equipe</h1>
          <p className="text-sm text-muted-foreground font-medium">Gerencie o acesso e monitore a atividade dos usuários.</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <Card className="border-none shadow-sm bg-card/40 rounded-3xl overflow-hidden border border-border/20">
          <CardHeader className="px-8 py-6 border-b border-border/20 bg-muted/20">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Colaboradores Cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent border-b border-border/20">
                    <TH className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left">Usuário</TH>
                    <TH className="py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Perfil</TH>
                    <TH className="py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Último IP</TH>
                    <TH className="py-4 text-right pr-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ações</TH>
                  </TR>
                </THead>
                <TBody>
                  {users.map((user) => (
                    <TR key={user.id} className="group border-b border-border/10 last:border-0 hover:bg-muted/30 transition-colors">
                      <TD className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate text-foreground leading-tight">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium truncate">{user.email}</p>
                          </div>
                        </div>
                      </TD>
                      <TD className="py-4 text-center">
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-tighter border",
                          user.role === "ADMIN" ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                          user.role === "TECNICO" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                          "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        )}>
                          {user.role}
                        </span>
                      </TD>
                      <TD className="py-4 text-center">
                        <code className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                          {user.lastIp || "---"}
                        </code>
                      </TD>
                      <TD className="py-4 text-right pr-8">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
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
          <Card className="border-none shadow-sm bg-card/40 rounded-3xl border border-border/20 overflow-hidden">
            <CardHeader className="px-8 py-6 border-b border-border/20 bg-primary/5">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Novo Acesso</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form action={createUserAction} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
                  <Input name="name" placeholder="Ex: João Silva" className="h-11 bg-background border-border/40 focus:border-primary/40 rounded-xl text-xs" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</label>
                  <Input name="email" type="email" placeholder="joao@empresa.com" className="h-11 bg-background border-border/40 focus:border-primary/40 rounded-xl text-xs" required />
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Perfil de Acesso</label>
                    <Select name="role" defaultValue="CLIENTE" required className="h-11 bg-background border-border/40 focus:border-primary/40 rounded-xl text-xs">
                      <option value="CLIENTE">Colaborador</option>
                      <option value="TECNICO">Técnico</option>
                      <option value="ADMIN">Administrador</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha (Padrão: ti123456)</label>
                    <Input name="password" type="password" placeholder="••••••••" className="h-11 bg-background border-border/40 focus:border-primary/40 rounded-xl text-xs" />
                  </div>
                </div>
                <Button className="w-full h-12 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] mt-2 shadow-lg shadow-primary/10">
                  <UserPlus className="h-3.5 w-3.5 mr-2" />
                  Cadastrar Usuário
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
