import "reflect-metadata";
import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { Ticket } from "@/entities/Ticket";
import { Category } from "@/entities/Category";
import { HistoryAction, Role, TicketStatus } from "@/types";
import { StatCard } from "@/components/stat-card";
import { BarChart3, Gauge, ShieldCheck, Star, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { TicketHistory } from "@/entities/TicketHistory";

export async function AdminStatsContainer() {
  await initializeDatabase();

  const ticketRepository = getRepository(Ticket);
  const userRepository = getRepository(User);
  const categoryRepository = getRepository(Category);

  // Contar tickets totais
  const totalTickets = await ticketRepository.count();

  // Contar usuários
  const totalUsers = await userRepository.count();

  // Contar SLA no prazo
  const now = new Date();
  const slaOk = await ticketRepository
    .createQueryBuilder("ticket")
    .where("ticket.slaDueAt >= :now", { now })
    .getCount();

  // Contar SLA violado
  const slaViolado = await ticketRepository
    .createQueryBuilder("ticket")
    .where("ticket.slaDueAt < :now", { now })
    .andWhere("ticket.status = :status", { status: TicketStatus.ABERTO })
    .getCount();

  // Categorias com contagem
  const categories = await categoryRepository.find({
    order: { name: "ASC" }
  });

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const ticketCount = await ticketRepository.count({
        where: { categoryId: cat.id }
      });
      return {
        id: cat.id,
        name: cat.name,
        ticketCount
      };
    })
  );

  // Técnicos com contagem de tickets atribuídos
  const technicians = await userRepository.find({
    where: { role: Role.TECNICO },
    order: { name: "ASC" }
  });

  const techniciansWithCount = await Promise.all(
    technicians.map(async (tech) => {
      const assignedTickets = await ticketRepository.count({
        where: { responsavelId: tech.id }
      });
      return {
        id: tech.id,
        name: tech.name,
        assignedTickets
      };
    })
  );

 
async function getAverageRating(): Promise<number> {
  const historyRepository = getRepository(TicketHistory);

  const result = await historyRepository
    .createQueryBuilder("history")
    .select("AVG(CAST(history.toValue AS DECIMAL(3,1)))", "media")
    .where("history.action = :action", { action: HistoryAction.AVALIACAO })
    .getRawOne();

  return result?.media ? parseFloat(result.media) : 0;
}
 

 const ratingValue = await getAverageRating();
 

  return (
    <>
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Chamados" value={totalTickets} icon={BarChart3} />
        <StatCard label="Usuários Ativos" value={totalUsers} icon={Users} tone="text-sky-400" />
        <StatCard label="SLA no Prazo" value={slaOk} icon={ShieldCheck} tone="text-emerald-400" />
        <StatCard label="SLA Violado" value={slaViolado} icon={Gauge} tone="text-red-400" />
        <StatCard label="Rating Médio" value={ratingValue.toFixed(1)} icon={Star} tone="text-amber-400" />
      </section>

      <div className="grid gap-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="glass-card border-none shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Performance por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR className="border-white/5">
                    <TH className="text-[10px] font-black uppercase tracking-widest">Categoria</TH>
                    <TH className="text-[10px] font-black uppercase tracking-widest text-right">Volume</TH>
                  </TR>
                </THead>
                <TBody>
                  {categoriesWithCount.map((item) => (
                    <TR key={item.id} className="border-white/5 group hover:bg-white/5">
                      <TD className="font-bold text-sm">{item.name}</TD>
                      <TD className="text-right">
                        <span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-muted/50 font-bold group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                          {item.ticketCount}
                        </span>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-400" />
                Carga de Trabalho (Técnicos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR className="border-white/5">
                    <TH className="text-[10px] font-black uppercase tracking-widest">Técnico</TH>
                    <TH className="text-[10px] font-black uppercase tracking-widest text-right">Fila</TH>
                  </TR>
                </THead>
                <TBody>
                  {techniciansWithCount.map((item) => (
                    <TR key={item.id} className="border-white/5 group hover:bg-white/5">
                      <TD className="font-bold text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center text-[10px] font-black">
                            {item.name.charAt(0)}
                          </div>
                          {item.name}
                        </div>
                      </TD>
                      <TD className="text-right">
                        <span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-muted/50 font-bold group-hover:bg-sky-500/20 group-hover:text-sky-400 transition-colors">
                          {item.assignedTickets}
                        </span>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
