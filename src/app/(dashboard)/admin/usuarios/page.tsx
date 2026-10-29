import "reflect-metadata";
import { Role } from "@/types";
import { UserPlus, Users, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createUserAction } from "@/app/actions";
import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { DeleteUserButton } from "@/components/DeleteUserbutton";
import { CreateUserForm } from "@/components/create-user-form";

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) redirect("/cliente");

  await initializeDatabase();
  const userRepository = getRepository(User);
  const users = await userRepository.find({
    order: { name: "ASC" },
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

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-none shadow-sm bg-card/40 rounded-3xl overflow-hidden border border-border/20">
          <CardHeader className="px-6 py-5 border-b border-border/20 bg-muted/20 md:px-8">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Colaboradores Cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent border-b border-border/20">
                    <TH className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left md:px-8">Usuário</TH>
                    <TH className="py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Perfil</TH>
                    <TH className="py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Status</TH>
                    <TH className="py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Último IP</TH>
                    <TH className="py-4 pr-6 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:pr-8">Ações</TH>
                  </TR>
                </THead>
                <TBody>
                  {users.map((user) => (
                    <TR key={user.id} className="group border-b border-border/10 last:border-0 hover:bg-muted/30 transition-colors">
                      <TD className="px-6 py-4 md:px-8">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20 shrink-0">
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
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.12em] border",
                          user.isActive
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                        )}>
                          {user.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </TD>
                      <TD className="py-4 text-center">
                        <code className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md inline-block min-w-[72px]">
                          {user.lastIp || "---"}
                        </code>
                      </TD>
                      <TD className="py-4 pr-6 text-right md:pr-8">
                        <DeleteUserButton userId={user.id} userName={user.name} isActive={user.isActive} className="justify-end" />
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
              <CreateUserForm />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
