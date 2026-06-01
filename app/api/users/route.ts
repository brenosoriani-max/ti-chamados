import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { userCreateSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireSession([Role.ADMIN]);
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Erro ao listar usuarios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession([Role.ADMIN]);
    const parsed = userCreateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, passwordHash },
      select: { id: true, name: true, email: true, role: true }
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Erro ao criar usuario" }, { status: 500 });
  }
}
