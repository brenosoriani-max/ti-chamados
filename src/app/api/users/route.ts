import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { Ticket } from "@/entities/Ticket";
import { TicketMessage } from "@/entities/TicketMessage";
import { TicketMessageRead } from "@/entities/TicketMessageRead";
import { TicketHistory } from "@/entities/TicketHistory";
import { Notification } from "@/entities/Notification";
import { SessaoRemota } from "@/entities/SessaoRemota";
import { BackupLog } from "@/entities/BackupLog";
import { requireSession } from "@/lib/auth";
import { userCreateSchema } from "@/lib/validators";
import { messages } from "@/lib/messages";

export async function GET() {
  try {
    await requireSession([Role.ADMIN]);
    await initializeDatabase();

    const userRepository = getRepository(User);
    const users = await userRepository
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.name",
        "user.email",
        "user.role",
        "user.isActive",
        "user.createdAt",
      ])
      .orderBy("user.name", "ASC")
      .getMany();

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: messages.users.listError }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession([Role.ADMIN]);
    await initializeDatabase();

    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: messages.users.invalidData, details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const userRepository = getRepository(User);
    const user = userRepository.create({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash,
      isActive: true,
    });

    await userRepository.save(user);

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: messages.users.createError }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession([Role.ADMIN]);
    await initializeDatabase();
    const userRepository = getRepository(User);
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    const mode = searchParams.get("mode") ?? "deactivate";

    if (!id) {
      return NextResponse.json({ error: messages.users.idRequired }, { status: 400 });
    }

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: messages.users.notFound }, { status: 404 });
    }

    if (mode === "activate") {
      user.isActive = true;
      await userRepository.save(user);
      return NextResponse.json({ message: "Usuário reativado com sucesso." });
    }

    if (mode === "delete") {
      if (user.role === Role.ADMIN && session.id !== user.id) {
        return NextResponse.json(
          { error: "Não é possível excluir outro administrador por segurança." },
          { status: 400 }
        );
      }

      const notificationRepository = getRepository(Notification);
      const ticketMessageRepository = getRepository(TicketMessage);
      const ticketHistoryRepository = getRepository(TicketHistory);
      const sessaoRemotaRepository = getRepository(SessaoRemota);
      const backupLogRepository = getRepository(BackupLog);
      const ticketRepository = getRepository(Ticket);

      const relatedTickets = await ticketRepository.find({
        where: [{ clienteId: id }, { responsavelId: id }],
        select: ["id"],
      });

      const ticketIds = relatedTickets.map((ticket) => ticket.id);

        
      await notificationRepository.delete({ userId: id });
      await ticketHistoryRepository.delete({ actorId: id });
      await ticketMessageRepository.delete({ authorId: id });
      await sessaoRemotaRepository.delete({ usuarioId: id });
      await backupLogRepository.delete({ triggeredById: id });

      if (ticketIds.length > 0) {
        await ticketRepository.delete(ticketIds);
      }

      await userRepository.delete(id);
      return NextResponse.json({ message: "Usuário excluído com sucesso." });
    }

    user.isActive = false;
    await userRepository.save(user);

    return NextResponse.json({ message: "Usuário desativado com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir/desativar usuário:", error);

    if (error.code === "ER_ROW_IS_REFERENCED_2" || error.code === "ERR_ROW_IS_REFERENCED_2") {
      return NextResponse.json({ error: messages.users.deleteLinked }, { status: 400 });
    }

    if (error.message?.includes("admin") || error.message?.includes("Administrador")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: messages.users.deleteError }, { status: 500 });
  }
}
