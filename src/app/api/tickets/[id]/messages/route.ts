import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Role, HistoryAction } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { messageCreateSchema } from "@/lib/validators";
import { Ticket } from "@/entities/Ticket";
import { TicketMessage } from "@/entities/TicketMessage";
import { TicketHistory } from "@/entities/TicketHistory";
import { TicketAttachment } from "@/entities/TicketAttachment";
import { messages } from "@/lib/messages";
import { emitTicketMessage } from "@/lib/remote/socket-bridge";

const MAX_MESSAGE_IMAGES = 3;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function imageExtension(mimeType: string) {
  return { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" }[mimeType];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    await initializeDatabase();
    const { id } = await params;

    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let body: { body?: string; isInternal?: boolean };
    let images: File[] = [];

    if (isMultipart) {
      const formData = await request.formData();
      body = {
        body: String(formData.get("body") ?? ""),
        isInternal: formData.get("isInternal") === "true",
      };
      images = Array.from(formData.getAll("images")).filter(
        (value): value is File => value instanceof File && value.size > 0
      );
    } else {
      body = await request.json();
    }

    const parsed = messageCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: messages.tickets.invalidComment, details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.isInternal && session.role === Role.CLIENTE) {
      return NextResponse.json({ error: messages.tickets.commentForbidden }, { status: 403 });
    }

    if (images.length > MAX_MESSAGE_IMAGES) {
      return NextResponse.json({ error: "É permitido anexar no máximo 3 imagens por mensagem." }, { status: 400 });
    }

    if (images.some((image) => !IMAGE_MIME_TYPES.has(image.type) || image.size > MAX_IMAGE_SIZE_BYTES)) {
      return NextResponse.json({ error: "Envie imagens JPG, PNG, GIF ou WEBP de até 5 MB cada." }, { status: 400 });
    }

    const ticketRepository = getRepository(Ticket);
    const ticket = await ticketRepository.findOne({
      where: {
        id,
        ...(session.role === Role.CLIENTE ? { clienteId: session.id } : {}),
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: messages.tickets.notFound }, { status: 404 });
    }

    const closedStatuses = ["RESOLVIDO", "ENCERRADO", "CANCELADO"] as const;
    if (closedStatuses.includes(ticket.status as typeof closedStatuses[number])) {
      return NextResponse.json(
        { error: "Este chamado foi finalizado e o chat está bloqueado." },
        { status: 403 }
      );
    }

    const messageRepository = getRepository(TicketMessage);
    const historyRepository = getRepository(TicketHistory);
    const attachmentRepository = getRepository(TicketAttachment);

    const message = messageRepository.create({
      ticketId: id,
      authorId: session.id,
      body: parsed.data.body,
      isInternal: parsed.data.isInternal,
    });
    await messageRepository.save(message);

    const attachments = [] as TicketAttachment[];
    if (images.length > 0) {
      const uploadDirectory = path.join(process.cwd(), "public", "uploads", "tickets", id, "messages");
      await mkdir(uploadDirectory, { recursive: true });

      for (const image of images) {
        const extension = imageExtension(image.type);
        const fileName = `${randomUUID()}.${extension}`;
        const filePath = path.join(uploadDirectory, fileName);
        await writeFile(filePath, Buffer.from(await image.arrayBuffer()));

        const attachment = attachmentRepository.create({
          ticketId: id,
          messageId: message.id,
          message,
          fileName: image.name.slice(0, 255),
          fileUrl: `/uploads/tickets/${id}/messages/${fileName}`,
          fileType: image.type,
          fileSize: image.size,
        });

        attachments.push(attachment);
      }

      await attachmentRepository.save(attachments);
    }

    ticket.updatedAt = new Date();
    await ticketRepository.save(ticket);

    const history = historyRepository.create({
      ticketId: id,
      actorId: session.id,
      action: HistoryAction.COMENTARIO,
      toValue: parsed.data.isInternal ? "interno" : "público",
    });
    await historyRepository.save(history);

    const saved = await messageRepository.findOne({
      where: { id: message.id },
      relations: ["author", "attachments"],
    });

    const payload = {
      id: saved!.id,
      body: saved!.body,
      isInternal: saved!.isInternal,
      createdAt: saved!.createdAt.toISOString(),
      attachments: (saved!.attachments ?? []).map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileType: attachment.fileType ?? null,
        fileSize: attachment.fileSize ?? null,
      })),
      author: {
        id: saved!.author.id,
        name: saved!.author.name,
        avatarUrl: saved!.author.avatarUrl ?? null,
      },
    };
    emitTicketMessage(id, payload, saved!.isInternal);

    return NextResponse.json(payload, { status: 201 });
  } catch {
    return NextResponse.json({ error: messages.tickets.commentError }, { status: 500 });
  }
}
