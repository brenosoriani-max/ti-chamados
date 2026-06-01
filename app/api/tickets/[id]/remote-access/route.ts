import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { remoteSessionCreateSchema } from "@/lib/validators";

/**
 * GET /api/tickets/[id]/remote-access
 * Retrieve remote access information, sessions, and logs for a ticket
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSession([Role.TECNICO, Role.ADMIN]);
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      equipment: true,
      remoteSessions: {
        orderBy: { createdAt: "desc" },
      },
      remoteAccessLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json(
      { error: "Chamado não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ticketId: ticket.id,
    equipment: ticket.equipment,
    remoteSessions: ticket.remoteSessions,
    remoteAccessLogs: ticket.remoteAccessLogs,
  });
}

/**
 * POST /api/tickets/[id]/remote-access
 * Request a remote access session for a ticket's equipment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession([Role.TECNICO, Role.ADMIN]);
  const { id } = await params;

  // Verify ticket exists
  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    return NextResponse.json(
      { error: "Chamado não encontrado" },
      { status: 404 }
    );
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = remoteSessionCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid remote session data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verify equipment exists
  const equipment = await prisma.equipment.findUnique({
    where: { id: parsed.data.equipmentId },
  });

  if (!equipment) {
    return NextResponse.json(
      { error: "Equipamento não encontrado" },
      { status: 404 }
    );
  }

  // Create remote session
  const remoteSession = await prisma.remoteSession.create({
    data: {
      equipmentId: equipment.id,
      ticketId: ticket.id,
      requestedById: session.id,
      sessionId: parsed.data.sessionId,
      userName: parsed.data.host,
      status: "PENDING",
      connectionType: parsed.data.connectionType,
      mode: parsed.data.mode,
      metadata: {
        requestedHost: parsed.data.host,
        requestedIp: parsed.data.ip,
      },
    },
  });

  // Log the remote access request
  await prisma.remoteAccessLog.create({
    data: {
      technicianId: session.id,
      equipmentId: equipment.id,
      ticketId: ticket.id,
      sessionId: parsed.data.sessionId,
      mode: parsed.data.mode,
      action: "REQUESTED",
      reason: parsed.data.reason,
      startedAt: new Date(),
      audit: {
        host: parsed.data.host,
        ip: parsed.data.ip,
        connectionType: parsed.data.connectionType,
      },
    },
  });

  return NextResponse.json(remoteSession, { status: 201 });
}
