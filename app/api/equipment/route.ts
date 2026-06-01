import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { equipmentCreateSchema } from "@/lib/validators";

/**
 * GET /api/equipment
 * List all equipment with department and responsible user information
 */
export async function GET(_request: NextRequest) {
  await requireSession();

  const equipment = await prisma.equipment.findMany({
    include: {
      department: true,
      responsibleUser: true,
    },
    orderBy: {
      machineName: "asc",
    },
  });

  return NextResponse.json(equipment);
}

/**
 * POST /api/equipment
 * Create a new equipment entry (requires TECNICO or ADMIN role)
 */
export async function POST(request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);

  const body = await request.json();
  const parsed = equipmentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid equipment data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const equipment = await prisma.equipment.create({
    data: parsed.data,
    include: {
      department: true,
      responsibleUser: true,
    },
  });

  return NextResponse.json(equipment, { status: 201 });
}
