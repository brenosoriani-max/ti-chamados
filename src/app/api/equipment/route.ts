import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { equipmentCreateSchema } from "@/lib/validators";
import { toast } from "sonner";


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


export async function POST(request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);

  const body = await request.json();
  const parsed = equipmentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return toast.error("Dados de equipamento inválidos");
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
