import "reflect-metadata";

import { initializeDatabase, getRepository } from "@/lib/database";
import { Category } from "@/entities/Category";
import { Ticket } from "@/entities/Ticket";
import { User } from "@/entities/User";
import { Priority, Role, TicketStatus } from "@/types";
import bcrypt from "bcryptjs";

const titles = [
  "Erro ao acessar painel de suporte",
  "VPN não conecta no notebook",
  "Computador reinicia sem motivo",
  "Servidor lento durante expediente",
  "Impressora não responde",
  "E-mail não sincroniza no celular",
  "Usuário sem permissão de acesso",
  "Monitor com linhas na tela",
  "Arquivo compartilhado indisponível",
  "Erro ao imprimir documento fiscal",
];

const statusCycle: TicketStatus[] = [
  TicketStatus.ABERTO,
  TicketStatus.EM_ANALISE,
  TicketStatus.EM_ATENDIMENTO,
  TicketStatus.AGUARDANDO_CLIENTE,
  TicketStatus.RESOLVIDO,
];

const priorityCycle: Priority[] = [
  Priority.BAIXA,
  Priority.MEDIA,
  Priority.ALTA,
  Priority.CRITICA,
  Priority.MEDIA,
];

async function main() {
  await initializeDatabase();

  const userRepository = getRepository(User);
  const categoryRepository = getRepository(Category);
  const ticketRepository = getRepository(Ticket);

  const existingClient = await userRepository.findOne({
    where: { email: "cliente.mock@teste.local" },
  });

  const client = existingClient ?? userRepository.create({
    name: "Cliente Mock",
    email: "cliente.mock@teste.local",
    passwordHash: bcrypt.hashSync("mock123456", 10),
    role: Role.CLIENTE,
    isActive: true,
  });

  if (!existingClient) {
    await userRepository.save(client);
  }

  let category = await categoryRepository.findOne({
    where: { isActive: true },
  });

  if (!category) {
    category = categoryRepository.create({
      name: "Atendimento Geral",
      description: "Categoria criada para dados de teste",
      isActive: true,
    });
    await categoryRepository.save(category);
  }

  const tech = await userRepository.findOne({
    where: { role: Role.TECNICO },
  }) ?? await userRepository.findOne({
    where: { role: Role.ADMIN },
  });

  const result = await ticketRepository
    .createQueryBuilder("ticket")
    .select("MAX(CAST(REPLACE(ticket.protocolo, 'HD-', '') AS UNSIGNED))", "maxNumero")
    .getRawOne<{ maxNumero?: number | string }>();

  const nextNumber = Number(result?.maxNumero ?? 0) + 1;

  for (let index = 0; index < 10; index += 1) {
    const number = nextNumber + index;
    const status = statusCycle[index % statusCycle.length];
    const priority = priorityCycle[index % priorityCycle.length];

    const ticket = ticketRepository.create({
      protocolo: `HD-${String(number).padStart(6, "0")}`,
      titulo: titles[index % titles.length],
      descricao: `Chamado de teste ${index + 1}. Descrição simulada para validação de paginação e acompanhamento do atendimento.`,
      status,
      prioridade: priority,
      clienteId: client.id,
      categoryId: category.id,
      responsavelId: tech?.id,
      isArchived: false,
      creatorIp: "127.0.0.1",
      slaDueAt: new Date(Date.now() + (index + 1) * 1000 * 60 * 60 * 3),
      responseDueAt: new Date(Date.now() + (index + 1) * 1000 * 60 * 60 * 2),
      resolvedAt: status === TicketStatus.RESOLVIDO ? new Date() : undefined,
      closedAt: status === TicketStatus.RESOLVIDO ? undefined : undefined,
      dataAbertura: new Date(Date.now() - (index + 1) * 1000 * 60 * 60 * 12),
    });

    await ticketRepository.save(ticket);
  }

  console.log(`15?`);
  console.log(`Criados 10 chamados mockados para o cliente ${client.name}.`);
  console.log(`Próximo número disponível: HD-${String(nextNumber + 10).padStart(6, "0")}`);
}

main()
  .catch((error) => {
    console.error("Erro ao criar chamados mockados:", error);
    process.exit(1);
  });
