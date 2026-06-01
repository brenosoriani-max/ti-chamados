import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { equipmentCreateSchema } from "@/lib/validators";

export async function GET(_request: NextRequest) {
  await requireSession();
  const items = await prisma.equipment.findMany({
    include: { department: true, responsibleUser: true },
    orderBy: { machineName: "asc" }
  });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await requireSession([Role.TECNICO, Role.ADMIN]);
  const parsed = equipmentCreateSchema.safeParse(await request.json());

  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const equipment = await prisma.equipment.create({ data: parsed.data });
  return NextResponse.json(equipment, { status: 201 });
}
