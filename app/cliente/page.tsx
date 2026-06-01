import { Clock, FolderCheck, Inbox, LifeBuoy } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { TicketTable } from "@/components/ticket-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTicketAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function ClientePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.CLIENTE && session.role !== Role.ADMIN) redirect("/suporte");
  const where = session.role === Role.CLIENTE ? { customerId: session.id } : {};
  const [tickets, total, abertos, andamento, encerrados, categories] = await Promise.all([
    prisma.ticket.findMany({ where, include: { category: true, assignee: true }, orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.ticket.count({ where }),
    prisma.ticket.count({ where: { ...where, status: "ABERTO" } }),
    prisma.ticket.count({ where: { ...where, status: { in: ["EM_ANALISE", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] } } }),
    prisma.ticket.count({ where: { ...where, status: { in: ["RESOLVIDO", "ENCERRADO"] } } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Area do cliente</h1>
        <p className="text-sm text-muted-foreground">Abra chamados, acompanhe SLA e responda ao suporte.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total" value={total} icon={Inbox} />
        <StatCard label="Abertos" value={abertos} icon={LifeBuoy} tone="text-sky-300" />
        <StatCard label="Em andamento" value={andamento} icon={Clock} tone="text-amber-300" />
        <StatCard label="Encerrados" value={encerrados} icon={FolderCheck} tone="text-emerald-300" />
      </section>
      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]">
        <TicketTable tickets={tickets} />
        <Card>
          <CardHeader><CardTitle>Novo chamado</CardTitle></CardHeader>
          <CardContent>
            <form action={createTicketAction} className="space-y-3">
              <Input name="title" placeholder="Titulo do chamado" required />
              <Textarea name="description" placeholder="Descreva o problema, impacto e urgencia" required />
              <Select name="categoryId" defaultValue="" required>
                <option value="" disabled>Categoria</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </Select>
              <Select name="priority" defaultValue="MEDIA">
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Critica</option>
              </Select>
              <Input name="tags" placeholder="Tags separadas por virgula" />
              <Input name="attachments" type="file" multiple />
              <Button className="w-full">Abrir chamado</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
