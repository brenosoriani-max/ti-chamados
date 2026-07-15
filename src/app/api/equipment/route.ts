import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { equipmentCreateSchema } from "@/lib/validators";
import { Equipment } from "@/entities/Equipment";
import { messages } from "@/lib/messages";

export async function GET(_request: NextRequest) {
  await requireSession();
  await initializeDatabase();

  const equipmentRepository = getRepository(Equipment);
  const equipment = await equipmentRepository.find({
    order: { machineName: "ASC" },
  });

  return NextResponse.json(equipment);
}

export async function POST(request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);
  await initializeDatabase();

  const body = await request.json();
  const parsed = equipmentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: messages.equipment.invalidData },
      { status: 400 }
    );
  }

  const equipmentRepository = getRepository(Equipment);
  const equipment = equipmentRepository.create(parsed.data);
  await equipmentRepository.save(equipment);

  return NextResponse.json(equipment, { status: 201 });
}
