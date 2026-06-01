import { PrismaClient, Priority, Role, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const [tiDepartment, financeDepartment] = await Promise.all([
    prisma.department.upsert({
      where: { name: "TI" },
      update: {},
      create: { name: "TI", description: "Tecnologia da informacao" }
    }),
    prisma.department.upsert({
      where: { name: "Financeiro" },
      update: {},
      create: { name: "Financeiro", description: "Departamento Financeiro" }
    })
  ]);

  const [admin, tecnico, cliente] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@empresa.com" },
      update: {},
      create: { name: "Admin Service Desk", email: "admin@empresa.com", passwordHash, role: Role.ADMIN, department: "TI", departmentId: tiDepartment.id }
    }),
    prisma.user.upsert({
      where: { email: "tecnico@empresa.com" },
      update: {},
      create: { name: "Marina Suporte", email: "tecnico@empresa.com", passwordHash, role: Role.TECNICO, department: "Suporte N2", departmentId: tiDepartment.id }
    }),
    prisma.user.upsert({
      where: { email: "cliente@empresa.com" },
      update: {},
      create: { name: "Carlos Cliente", email: "cliente@empresa.com", passwordHash, role: Role.CLIENTE, phone: "(11) 99999-0000", departmentId: financeDepartment.id }
    })
  ]);

  await prisma.client.upsert({
    where: { userId: cliente.id },
    update: {},
    create: { userId: cliente.id, company: "Acme Operacoes", document: "00.000.000/0001-00" }
  });

  await prisma.technician.upsert({
    where: { userId: tecnico.id },
    update: {},
    create: {
      userId: tecnico.id,
      phone: "(11) 99999-0000",
      certification: ["ITIL", "Windows 11"],
      isActive: true
    }
  });

  const financeMachine = await prisma.equipment.upsert({
    where: { patrimony: "EQ-1001" },
    update: {
      lastCommunication: new Date(),
      isOnline: true,
      status: "ONLINE"
    },
    create: {
      patrimony: "EQ-1001",
      machineName: "PC-FINANCEIRO-01",
      hostname: "PC-FINANCEIRO-01",
      ipAddress: "192.168.0.15",
      currentUser: "Carlos Cliente",
      operatingSystem: "Windows 11 Pro",
      windowsVersion: "23H2",
      processor: "Intel Core i7",
      ramGb: 16,
      diskSpaceGb: 512,
      lastUpdateAt: new Date(),
      lastCommunication: new Date(),
      isOnline: true,
      status: "ONLINE",
      departmentId: financeDepartment.id,
      responsibleUserId: cliente.id
    }
  });

  for (const sla of [
    { priority: Priority.BAIXA, responseHours: 24, solutionHours: 72 },
    { priority: Priority.MEDIA, responseHours: 8, solutionHours: 24 },
    { priority: Priority.ALTA, responseHours: 4, solutionHours: 8 },
    { priority: Priority.CRITICA, responseHours: 1, solutionHours: 4 }
  ]) {
    await prisma.sLA.upsert({ where: { priority: sla.priority }, update: sla, create: sla });
  }

  const infraestrutura = await prisma.category.upsert({
    where: { name: "Infraestrutura" },
    update: {},
    create: {
      name: "Infraestrutura",
      description: "Rede, servidores, acesso e equipamentos",
      subCategories: { create: [{ name: "Rede" }, { name: "Notebook" }, { name: "Impressora" }] }
    },
    include: { subCategories: true }
  });

  const sistemas = await prisma.category.upsert({
    where: { name: "Sistemas" },
    update: {},
    create: {
      name: "Sistemas",
      description: "ERP, integrações e aplicações internas",
      subCategories: { create: [{ name: "ERP" }, { name: "Acesso" }] }
    },
    include: { subCategories: true }
  });

  const count = await prisma.ticket.count();
  if (count === 0) {
    const now = new Date();
    await prisma.ticket.create({
      data: {
        number: "CH-2026-0001",
        title: "VPN instavel para equipe financeira",
        description: "A conexao cai a cada 10 minutos durante fechamento mensal.",
        priority: Priority.ALTA,
        status: TicketStatus.EM_ATENDIMENTO,
        tags: ["vpn", "financeiro", "remoto"],
        customerId: cliente.id,
        assigneeId: tecnico.id,
        categoryId: infraestrutura.id,
        subCategoryId: infraestrutura.subCategories[0]?.id,
        equipmentId: financeMachine.id,
        responseDueAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        slaDueAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),
        messages: {
          create: [
            { authorId: cliente.id, body: "Precisamos estabilizar o acesso antes das 16h.", isInternal: false },
            { authorId: tecnico.id, body: "Verificando concentrador VPN e logs de autenticacao.", isInternal: false },
            { authorId: tecnico.id, body: "Possivel saturacao no link secundario.", isInternal: true }
          ]
        },
        history: {
          create: [
            { actorId: cliente.id, action: "CRIACAO", toValue: "ABERTO" },
            { actorId: tecnico.id, action: "TROCA_RESPONSAVEL", toValue: tecnico.name },
            { actorId: tecnico.id, action: "MUDANCA_STATUS", fromValue: "EM_ANALISE", toValue: "EM_ATENDIMENTO" }
          ]
        }
      }
    });

    await prisma.ticket.create({
      data: {
        number: "CH-2026-0002",
        title: "Erro ao emitir nota fiscal no ERP",
        description: "Ao confirmar emissao, o ERP retorna timeout na SEFAZ.",
        priority: Priority.CRITICA,
        status: TicketStatus.ABERTO,
        tags: ["erp", "fiscal"],
        customerId: cliente.id,
        categoryId: sistemas.id,
        subCategoryId: sistemas.subCategories[0]?.id,
        responseDueAt: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        slaDueAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        history: { create: [{ actorId: cliente.id, action: "CRIACAO", toValue: "ABERTO" }] }
      }
    });
  }

  console.log({ admin: admin.email, tecnico: tecnico.email, cliente: cliente.email, password: "123456" });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
